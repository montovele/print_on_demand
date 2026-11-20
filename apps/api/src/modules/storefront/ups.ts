import { randomUUID } from "node:crypto";
import { config } from "../../config.js";
import { HttpError } from "../../lib/http.js";

export interface UpsDestination {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: "MX";
  recipient?: string;
  phone?: string;
}

export interface UpsRate {
  serviceCode: string;
  serviceName: string;
  currency: string;
  totalCents: number;
}

export interface UpsLabel {
  trackingNumber: string;
  image: Buffer;
}

export interface UpsPurchasedShipment {
  shipmentIdentificationNumber: string;
  labels: UpsLabel[];
}

export interface UpsTrackingResult {
  status: "in_transit" | "delivered" | "exception";
  description: string;
  activityDate: string | null;
  activityTime: string | null;
}

export function aggregateUpsTracking(results: UpsTrackingResult[]): UpsTrackingResult {
  if (results.length === 0) {
    throw new HttpError(502, "UPS no devolvió eventos de rastreo.", "UPS_TRACKING_RESPONSE_INVALID");
  }
  if (results.length === 1) return results[0]!;
  const deliveredCount = results.filter((result) => result.status === "delivered").length;
  const status = deliveredCount === results.length
    ? "delivered"
    : results.some((result) => result.status === "exception")
      ? "exception"
      : "in_transit";
  return {
    status,
    description: `${deliveredCount} de ${results.length} paquetes entregados`,
    activityDate: null,
    activityTime: null,
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function requestJson(url: string, init: RequestInit, errorCode: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new HttpError(502, "No fue posible conectar con UPS. Intenta de nuevo.", errorCode);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, "UPS devolvió una respuesta inválida.", errorCode);
  }
  if (!response.ok) {
    throw new HttpError(502, "UPS no pudo procesar la solicitud. Verifica la configuración de la cuenta.", errorCode);
  }
  if (!isRecord(payload)) throw new HttpError(502, "UPS devolvió una respuesta inválida.", errorCode);
  return payload;
}

export function getUpsConfigurationStatus() {
  const missingQuoteConfiguration = [
    ...(!config.UPS_CLIENT_ID?.trim() ? ["UPS_CLIENT_ID"] : []),
    ...(!config.UPS_CLIENT_SECRET?.trim() ? ["UPS_CLIENT_SECRET"] : []),
    ...(!config.UPS_ACCOUNT_NUMBER?.trim() ? ["UPS_ACCOUNT_NUMBER"] : []),
    ...(!config.UPS_SHIP_FROM_POSTAL_CODE ? ["UPS_SHIP_FROM_POSTAL_CODE"] : []),
  ];
  const packageConfiguration = [
    "UPS_PACKAGE_LENGTH_CM",
    "UPS_PACKAGE_WIDTH_CM",
    "UPS_PACKAGE_HEIGHT_CM",
    "UPS_PACKAGE_WEIGHT_KG",
  ];
  const missingLabelConfiguration = [
    ...missingQuoteConfiguration,
    ...(!config.UPS_SHIP_FROM_NAME ? ["UPS_SHIP_FROM_NAME"] : []),
    ...(!config.UPS_SHIP_FROM_PHONE ? ["UPS_SHIP_FROM_PHONE"] : []),
    ...(!config.UPS_SHIP_FROM_ADDRESS_LINE1 ? ["UPS_SHIP_FROM_ADDRESS_LINE1"] : []),
    ...(!config.UPS_SHIP_FROM_CITY ? ["UPS_SHIP_FROM_CITY"] : []),
    ...(!config.UPS_SHIP_FROM_STATE ? ["UPS_SHIP_FROM_STATE"] : []),
    ...packageConfiguration.filter((key) => !process.env[key]?.trim()),
  ];
  return {
    quoteReady: missingQuoteConfiguration.length === 0,
    labelReady: missingLabelConfiguration.length === 0,
    sandbox: new URL(config.UPS_API_BASE_URL).hostname === "wwwcie.ups.com",
    missingQuoteConfiguration,
    missingLabelConfiguration,
  };
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.value;
  if (pendingTokenRequest) return pendingTokenRequest;
  const clientId = config.UPS_CLIENT_ID?.trim();
  const clientSecret = config.UPS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new HttpError(503, "Faltan las credenciales de UPS en la configuración del servidor.", "UPS_NOT_CONFIGURED");
  }
  pendingTokenRequest = (async () => {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const payload = await requestJson(`${config.UPS_API_BASE_URL}/security/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }, "UPS_AUTH_FAILED");
    const token = payload.access_token;
    const expiresIn = Number(payload.expires_in);
    if (typeof token !== "string" || !token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new HttpError(502, "UPS devolvió una respuesta de autenticación inválida.", "UPS_AUTH_FAILED");
    }
    cachedToken = { value: token, expiresAt: Date.now() + expiresIn * 1000 };
    return token;
  })();
  const tokenRequest = pendingTokenRequest;
  try {
    return await tokenRequest;
  } finally {
    if (pendingTokenRequest === tokenRequest) pendingTokenRequest = null;
  }
}

export async function validateUpsCredentials() {
  await getAccessToken();
}

function getRates(payload: Record<string, unknown>): UpsRate[] {
  const rateResponse = payload.RateResponse;
  if (!isRecord(rateResponse)) return [];
  const rawRates = rateResponse.RatedShipment;
  const shipments = Array.isArray(rawRates) ? rawRates : rawRates ? [rawRates] : [];
  const rates: UpsRate[] = [];
  for (const rawRate of shipments) {
    if (!isRecord(rawRate)) continue;
    const service = rawRate.Service;
    const total = rawRate.NegotiatedRateCharges;
    const regularTotal = rawRate.TotalCharges;
    const preferred = isRecord(total) ? total.TotalCharge : undefined;
    const charges = isRecord(preferred) ? preferred : isRecord(regularTotal) ? regularTotal : undefined;
    const serviceCode = isRecord(service) ? service.Code : undefined;
    const serviceName = isRecord(service) ? service.Description : undefined;
    const currency = charges?.CurrencyCode;
    const amount = Number(charges?.MonetaryValue);
    if (
      typeof serviceCode !== "string"
      || typeof serviceName !== "string"
      || currency !== "MXN"
      || !Number.isFinite(amount)
      || amount < 0
    ) continue;
    const totalCents = Math.round(amount * 100);
    if (!Number.isSafeInteger(totalCents)) continue;
    rates.push({ serviceCode, serviceName, currency, totalCents });
  }
  return rates;
}

export async function getCheapestUpsRate(destination: UpsDestination, packageCount = 1): Promise<UpsRate> {
  const accountNumber = config.UPS_ACCOUNT_NUMBER?.trim();
  const originPostalCode = config.UPS_SHIP_FROM_POSTAL_CODE;
  if (!accountNumber || !originPostalCode) {
    throw new HttpError(503, "Configura el número de cuenta UPS y el código postal de origen.", "UPS_NOT_CONFIGURED");
  }

  const token = await getAccessToken();
  const transactionId = randomUUID();
  const address = {
    AddressLine: [destination.addressLine1, destination.addressLine2].filter(Boolean),
    City: destination.city,
    StateProvinceCode: destination.state,
    PostalCode: destination.postalCode,
    CountryCode: destination.country,
  };
  const origin = {
    PostalCode: originPostalCode,
    CountryCode: config.UPS_SHIP_FROM_COUNTRY_CODE,
  };
  const rateRequest = {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: "Printly storefront shipping quote",
        },
      },
      Shipment: {
        Shipper: {
          Name: "Printly",
          ShipperNumber: accountNumber,
          Address: origin,
        },
        ShipFrom: {
          Name: "Printly",
          Address: origin,
        },
        ShipTo: {
          Name: "Customer",
          Address: address,
        },
        PaymentDetails: {
          ShipmentCharge: [{
            Type: "01",
            BillShipper: { AccountNumber: accountNumber },
          }],
        },
        ShipmentRatingOptions: { NegotiatedRatesIndicator: "" },
        Package: Array.from({ length: packageCount }, () => ({
          PackagingType: { Code: "02", Description: "Customer Supplied Package" },
          Dimensions: {
            UnitOfMeasurement: { Code: "CM" },
            Length: String(config.UPS_PACKAGE_LENGTH_CM),
            Width: String(config.UPS_PACKAGE_WIDTH_CM),
            Height: String(config.UPS_PACKAGE_HEIGHT_CM),
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: "KGS" },
            Weight: String(config.UPS_PACKAGE_WEIGHT_KG),
          },
        })),
      },
    },
  };

  const payload = await requestJson(`${config.UPS_API_BASE_URL}/api/rating/v2403/Shop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      transId: transactionId,
      transactionSrc: "Printly",
    },
    body: JSON.stringify(rateRequest),
  }, "UPS_RATE_FAILED");
  const rates = getRates(payload).sort((left, right) => left.totalCents - right.totalCents);
  const cheapest = rates[0];
  if (!cheapest) {
    throw new HttpError(502, "UPS no devolvió tarifas válidas en MXN para ese destino.", "UPS_RATE_UNAVAILABLE");
  }
  return cheapest;
}

export function readUpsShipmentResponse(payload: Record<string, unknown>): UpsPurchasedShipment {
  const response = payload.ShipmentResponse;
  const results = isRecord(response) ? response.ShipmentResults : undefined;
  if (!isRecord(results) || typeof results.ShipmentIdentificationNumber !== "string") {
    throw new HttpError(502, "UPS no devolvió el identificador de la guía.", "UPS_SHIPMENT_RESPONSE_INVALID");
  }
  const rawPackageResults = results.PackageResults;
  const packageResults = Array.isArray(rawPackageResults) ? rawPackageResults : rawPackageResults ? [rawPackageResults] : [];
  const labels = packageResults.flatMap((rawPackage) => {
    if (!isRecord(rawPackage) || typeof rawPackage.TrackingNumber !== "string") return [];
    const shippingLabel = rawPackage.ShippingLabel;
    const encodedImage = isRecord(shippingLabel) ? shippingLabel.GraphicImage : undefined;
    if (typeof encodedImage !== "string" || !encodedImage) return [];
    const image = Buffer.from(encodedImage, "base64");
    if (image.length < 6 || !/^GIF8[79]a$/.test(image.subarray(0, 6).toString("ascii"))) return [];
    return [{ trackingNumber: rawPackage.TrackingNumber, image }];
  });
  if (labels.length === 0 || labels.length !== packageResults.length) {
    throw new HttpError(502, "UPS no devolvió todas las etiquetas de paquetería.", "UPS_LABEL_RESPONSE_INVALID");
  }
  return { shipmentIdentificationNumber: results.ShipmentIdentificationNumber, labels };
}

export async function createUpsShipment(
  destination: UpsDestination,
  serviceCode: string,
  packageCount: number,
  customerContext: string,
): Promise<UpsPurchasedShipment> {
  const accountNumber = config.UPS_ACCOUNT_NUMBER?.trim();
  const status = getUpsConfigurationStatus();
  if (!status.labelReady || !accountNumber) {
    throw new HttpError(503, "Completa las credenciales, el origen y las medidas reales del paquete UPS.", "UPS_NOT_CONFIGURED");
  }
  if (!Number.isInteger(packageCount) || packageCount < 1 || packageCount > 30) {
    throw new HttpError(400, "UPS permite crear guías para un máximo de 30 paquetes por trabajo.", "UPS_PACKAGE_COUNT_INVALID");
  }
  const token = await getAccessToken();
  const address = {
    AddressLine: [destination.addressLine1, destination.addressLine2].filter(Boolean),
    City: destination.city,
    StateProvinceCode: destination.state,
    PostalCode: destination.postalCode,
    CountryCode: destination.country,
  };
  const originAddress = {
    AddressLine: [config.UPS_SHIP_FROM_ADDRESS_LINE1, config.UPS_SHIP_FROM_ADDRESS_LINE2].filter(Boolean),
    City: config.UPS_SHIP_FROM_CITY,
    StateProvinceCode: config.UPS_SHIP_FROM_STATE,
    PostalCode: config.UPS_SHIP_FROM_POSTAL_CODE,
    CountryCode: config.UPS_SHIP_FROM_COUNTRY_CODE,
  };
  const shipmentRequest = {
    ShipmentRequest: {
      Request: {
        RequestOption: "nonvalidate",
        TransactionReference: { CustomerContext: customerContext },
      },
      Shipment: {
        Description: "Printly customer order",
        Shipper: {
          Name: config.UPS_SHIP_FROM_NAME,
          Phone: { Number: config.UPS_SHIP_FROM_PHONE },
          ShipperNumber: accountNumber,
          Address: originAddress,
        },
        ShipFrom: {
          Name: config.UPS_SHIP_FROM_NAME,
          Phone: { Number: config.UPS_SHIP_FROM_PHONE },
          Address: originAddress,
        },
        ShipTo: {
          Name: destination.recipient ?? "Customer",
          Phone: { Number: destination.phone ?? "" },
          Address: address,
        },
        PaymentInformation: {
          ShipmentCharge: [{
            Type: "01",
            BillShipper: { AccountNumber: accountNumber },
          }],
        },
        Service: { Code: serviceCode },
        Package: Array.from({ length: packageCount }, () => ({
          PackagingType: { Code: "02" },
          Dimensions: {
            UnitOfMeasurement: { Code: "CM" },
            Length: String(config.UPS_PACKAGE_LENGTH_CM),
            Width: String(config.UPS_PACKAGE_WIDTH_CM),
            Height: String(config.UPS_PACKAGE_HEIGHT_CM),
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: "KGS" },
            Weight: String(config.UPS_PACKAGE_WEIGHT_KG),
          },
        })),
      },
      LabelSpecification: {
        LabelImageFormat: { Code: "GIF" },
      },
    },
  };
  const payload = await requestJson(`${config.UPS_API_BASE_URL}/api/shipments/v2409/ship`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      transId: randomUUID(),
      transactionSrc: "Printly",
    },
    body: JSON.stringify(shipmentRequest),
  }, "UPS_SHIPMENT_FAILED");
  return readUpsShipmentResponse(payload);
}

export function readTrackingResult(payload: Record<string, unknown>): UpsTrackingResult {
  const response = payload.trackResponse;
  const rawShipments = isRecord(response) ? response.shipment : undefined;
  const shipments = Array.isArray(rawShipments) ? rawShipments : rawShipments ? [rawShipments] : [];
  const shipment = shipments.find(isRecord);
  const rawPackages = shipment?.package;
  const packages = Array.isArray(rawPackages) ? rawPackages : rawPackages ? [rawPackages] : [];
  const trackingPackage = packages.find(isRecord);
  const rawActivities = trackingPackage?.activity;
  const activities = Array.isArray(rawActivities) ? rawActivities : rawActivities ? [rawActivities] : [];
  const activity = activities.find(isRecord);
  if (!activity) {
    throw new HttpError(502, "UPS no devolvió eventos de rastreo válidos.", "UPS_TRACKING_RESPONSE_INVALID");
  }
  const statusObject = activity && isRecord(activity.status) ? activity.status : undefined;
  const rawStatusType = statusObject?.type;
  const status = typeof rawStatusType === "string"
    ? rawStatusType
    : isRecord(rawStatusType) && typeof rawStatusType.code === "string"
      ? rawStatusType.code
      : undefined;
  const description = statusObject?.description;
  if (typeof status !== "string" || typeof description !== "string") {
    throw new HttpError(502, "UPS no devolvió eventos de rastreo válidos.", "UPS_TRACKING_RESPONSE_INVALID");
  }
  return {
    status: status === "D" ? "delivered" : status === "X" ? "exception" : "in_transit",
    description,
    activityDate: typeof activity.date === "string" ? activity.date : null,
    activityTime: typeof activity.time === "string" ? activity.time : null,
  };
}

export async function getUpsTracking(trackingNumber: string): Promise<UpsTrackingResult> {
  const token = await getAccessToken();
  const payload = await requestJson(
    `${config.UPS_API_BASE_URL}/api/track/v1/details/${encodeURIComponent(trackingNumber)}?locale=es_MX&returnSignature=false`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        transId: randomUUID(),
        transactionSrc: "Printly",
      },
    },
    "UPS_TRACKING_FAILED",
  );
  return readTrackingResult(payload);
}
