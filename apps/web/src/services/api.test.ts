import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import api, { getErrorMessage } from "./api";

describe("API client", () => {
  it("uses a request timeout so the interface cannot wait forever", () => {
    expect(api.defaults.timeout).toBe(15000);
  });

  it("shows a clear message when the server does not respond in time", () => {
    const error = new AxiosError("timeout", "ECONNABORTED");
    expect(getErrorMessage(error)).toContain("tardó demasiado en responder");
  });
});
