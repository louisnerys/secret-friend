import { render } from "@testing-library/react";
import PwaRegister from "./PwaRegister";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PwaRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers service worker if supported", () => {
    const mockRegister = vi.fn().mockResolvedValue({});
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        register: mockRegister,
      },
      configurable: true,
    });

    render(<PwaRegister />);

    // Manually trigger the load event since JSDOM doesn't fire it automatically
    window.dispatchEvent(new Event("load"));

    expect(mockRegister).toHaveBeenCalledWith("/sw.js");
  });

  it("does not crash if service worker is not supported", () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
    });

    expect(() => render(<PwaRegister />)).not.toThrow();
  });
});
