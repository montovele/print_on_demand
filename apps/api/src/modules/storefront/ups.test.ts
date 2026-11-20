import { describe, expect, it } from "vitest";
import { aggregateUpsTracking, getUpsConfigurationStatus, readTrackingResult, readUpsShipmentResponse } from "./ups.js";

describe("UPS response handling", () => {
  it("extracts tracking numbers and downloadable GIF labels", () => {
    const shipment = readUpsShipmentResponse({
      ShipmentResponse: {
        ShipmentResults: {
          ShipmentIdentificationNumber: "1Z999AA10123456784",
          PackageResults: {
            TrackingNumber: "1Z999AA10123456784",
            ShippingLabel: { GraphicImage: "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
          },
        },
      },
    });

    expect(shipment.shipmentIdentificationNumber).toBe("1Z999AA10123456784");
    expect(shipment.labels).toHaveLength(1);
    expect(shipment.labels[0]?.trackingNumber).toBe("1Z999AA10123456784");
    expect(shipment.labels[0]?.image.subarray(0, 6).toString("ascii")).toBe("GIF89a");
  });

  it("rejects incomplete UPS label responses", () => {
    expect(() => readUpsShipmentResponse({
      ShipmentResponse: {
        ShipmentResults: {
          ShipmentIdentificationNumber: "1Z999AA10123456784",
          PackageResults: [{ TrackingNumber: "1Z999AA10123456784" }],
        },
      },
    })).toThrow("UPS no devolvió todas las etiquetas de paquetería.");
  });

  it("maps UPS delivery events to the order lifecycle", () => {
    expect(readTrackingResult({
      trackResponse: {
        shipment: [{
          package: [{
            activity: [{
              status: { type: "D", description: "Entregado" },
              date: "20261118",
              time: "153000",
            }],
          }],
        }],
      },
    })).toEqual({
      status: "delivered",
      description: "Entregado",
      activityDate: "20261118",
      activityTime: "153000",
    });
  });

  it("does not mark a multi-package shipment delivered until every package is delivered", () => {
    const delivered = {
      status: "delivered" as const,
      description: "Delivered",
      activityDate: "20261118",
      activityTime: "153000",
    };
    const inTransit = {
      status: "in_transit" as const,
      description: "In transit",
      activityDate: "20261118",
      activityTime: "140000",
    };

    expect(aggregateUpsTracking([delivered, inTransit]).status).toBe("in_transit");
    expect(aggregateUpsTracking([delivered, delivered])).toMatchObject({
      status: "delivered",
      description: "2 de 2 paquetes entregados",
    });
  });

  it("reports readiness without returning credentials", () => {
    const status = getUpsConfigurationStatus();
    expect(status).toHaveProperty("quoteReady");
    expect(status).toHaveProperty("labelReady");
    expect(status).toHaveProperty("missingLabelConfiguration");
    expect(status).not.toHaveProperty("clientId");
    expect(status).not.toHaveProperty("clientSecret");
  });
});
