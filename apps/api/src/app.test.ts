import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("API edge behavior", () => {
  it("returns a structured 404 for unknown routes", async () => {
    const response = await request(app).get("/api/v1/not-a-route");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("requires authentication before reading tenant products", async () => {
    const response = await request(app).get("/api/v1/products");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before bulk-publishing tenant products", async () => {
    const response = await request(app).post("/api/v1/products/publish-bulk");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading internal production jobs", async () => {
    const response = await request(app).get("/api/v1/production/jobs");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading UPS readiness", async () => {
    const response = await request(app).get("/api/v1/providers/ups/status");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before buying an UPS label", async () => {
    const response = await request(app).post("/api/v1/production/jobs/example/ups-label").send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading production job summaries", async () => {
    const response = await request(app).get("/api/v1/production/jobs/summary");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading support tickets", async () => {
    const response = await request(app).get("/api/v1/support/tickets");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading support metrics", async () => {
    const response = await request(app).get("/api/v1/support/metrics");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading the support ticket summary", async () => {
    const response = await request(app).get("/api/v1/support/tickets/summary");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("does not expose the customer storefront", async () => {
    const response = await request(app).get("/api/v1/storefront/settings");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("does not expose the legacy payments checkout route", async () => {
    const response = await request(app).post("/api/v1/payments/checkout").send({});
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("requires a customer session before starting storefront checkout", async () => {
    const response = await request(app).post("/api/v1/storefront/checkout").send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires a customer session before requesting an UPS shipping quote", async () => {
    const response = await request(app).post("/api/v1/storefront/shipping/quote").send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires a customer session before reading a storefront order", async () => {
    const response = await request(app).get("/api/v1/storefront/orders/example");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires a customer session before uploading storefront artwork", async () => {
    const response = await request(app)
      .put("/api/v1/storefront/artwork")
      .set("Content-Type", "image/png")
      .send(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("validates customer registration requests", async () => {
    const response = await request(app).post("/api/v1/auth/customer/register").send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("does not require a store lookup for customer registration", async () => {
    const response = await request(app).get("/api/v1/auth/customer/store");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("requires a customer session to read customer account data", async () => {
    const response = await request(app).get("/api/v1/auth/customer/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("validates customer login requests", async () => {
    const response = await request(app).post("/api/v1/auth/customer/login").send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires a customer session to log out", async () => {
    const response = await request(app).post("/api/v1/auth/customer/logout");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before listing orders", async () => {
    const response = await request(app).get("/api/v1/orders");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading older support ticket comments", async () => {
    const response = await request(app).get("/api/v1/support/tickets/example/comments");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before reading the internal catalog", async () => {
    const response = await request(app).get("/api/v1/catalog/products");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before listing product designer templates", async () => {
    const response = await request(app).get("/api/v1/designer/templates");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires authentication before uploading artwork", async () => {
    const response = await request(app)
      .put("/api/v1/designer/artwork")
      .set("Content-Type", "image/png")
      .send(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("does not expose the Express framework header", async () => {
    const response = await request(app).get("/api/v1/not-a-route");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
