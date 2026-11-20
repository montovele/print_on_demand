import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const response = (body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

const trackingPayload = {
  trackResponse: {
    shipment: [{
      package: [{
        activity: [{
          status: { type: "I", description: "En tránsito" },
          date: "20261118",
          time: "153000",
        }],
      }],
    }],
  },
};

describe("UPS client contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("UPS_CLIENT_ID", "test-client-id");
    vi.stubEnv("UPS_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("UPS_ACCOUNT_NUMBER", "TESTACCOUNT");
    vi.stubEnv("UPS_API_BASE_URL", "https://wwwcie.ups.com");
    vi.stubEnv("UPS_SHIP_FROM_NAME", "Printly Test");
    vi.stubEnv("UPS_SHIP_FROM_PHONE", "5555555555");
    vi.stubEnv("UPS_SHIP_FROM_ADDRESS_LINE1", "Calle de prueba 123");
    vi.stubEnv("UPS_SHIP_FROM_CITY", "Ciudad de México");
    vi.stubEnv("UPS_SHIP_FROM_STATE", "CDMX");
    vi.stubEnv("UPS_SHIP_FROM_POSTAL_CODE", "06000");
    vi.stubEnv("UPS_SHIP_FROM_COUNTRY_CODE", "MX");
    vi.stubEnv("UPS_PACKAGE_LENGTH_CM", "30");
    vi.stubEnv("UPS_PACKAGE_WIDTH_CM", "20");
    vi.stubEnv("UPS_PACKAGE_HEIGHT_CM", "5");
    vi.stubEnv("UPS_PACKAGE_WEIGHT_KG", "0.5");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requests and stores a UPS label with the quoted service and package data", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.endsWith("/security/v1/oauth/token")) {
        return response({ access_token: "mock-ups-token", expires_in: "3600" });
      }
      if (url.endsWith("/api/shipments/v2409/ship")) {
        return response({
          ShipmentResponse: {
            ShipmentResults: {
              ShipmentIdentificationNumber: "SHIPMENT-123",
              PackageResults: {
                TrackingNumber: "1Z999AA10123456784",
                ShippingLabel: { GraphicImage: "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
              },
            },
          },
        });
      }
      throw new Error(`Unexpected UPS request: ${url}`);
    });

    vi.resetModules();
    const { createUpsShipment, getUpsConfigurationStatus } = await import("./ups.js");
    const shipment = await createUpsShipment({
      recipient: "Cliente de prueba",
      phone: "5551234567",
      addressLine1: "Avenida de prueba 456",
      addressLine2: "",
      city: "Ciudad de México",
      state: "CDMX",
      postalCode: "06010",
      country: "MX",
    }, "03", 1, "TEST-ORDER");

    expect(getUpsConfigurationStatus().labelReady).toBe(true);
    expect(shipment.shipmentIdentificationNumber).toBe("SHIPMENT-123");
    expect(shipment.labels[0]?.trackingNumber).toBe("1Z999AA10123456784");
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      "/security/v1/oauth/token",
      "/api/shipments/v2409/ship",
    ]);

    const body = JSON.parse(String(requests[1]?.init?.body)) as {
      ShipmentRequest: {
        Shipment: {
          ShipTo: { Name: string; Phone: { Number: string } };
          Service: { Code: string };
          Package: Array<{ Dimensions: { Length: string; Width: string; Height: string }; PackageWeight: { Weight: string } }>;
        };
      };
    };
    expect(body.ShipmentRequest.Shipment.ShipTo).toEqual({
      Name: "Cliente de prueba",
      Phone: { Number: "5551234567" },
      Address: expect.any(Object),
    });
    expect(body.ShipmentRequest.Shipment.Service.Code).toBe("03");
    expect(body.ShipmentRequest.Shipment.Package).toHaveLength(1);
    expect(body.ShipmentRequest.Shipment.Package[0]).toMatchObject({
      Dimensions: { Length: "30", Width: "20", Height: "5" },
      PackageWeight: { Weight: "0.5" },
    });
  });

  it("shares one OAuth request across concurrent package tracking calls", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/security/v1/oauth/token")) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return response({ access_token: "mock-ups-token", expires_in: "3600" });
      }
      if (url.includes("/api/track/v1/details/")) return response(trackingPayload);
      throw new Error(`Unexpected UPS request: ${url}`);
    });

    vi.resetModules();
    const { getUpsTracking } = await import("./ups.js");
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) => getUpsTracking(`1Z999AA1012345678${index}`)),
    );

    expect(requests.filter((url) => url.endsWith("/security/v1/oauth/token"))).toHaveLength(1);
    expect(requests.filter((url) => url.includes("/api/track/v1/details/"))).toHaveLength(5);
    expect(results.every((result) => result.status === "in_transit")).toBe(true);
  });
});
