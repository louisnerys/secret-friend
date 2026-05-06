import { render } from "@testing-library/react";
import Home from "./page";
import { vi, describe, it, expect } from "vitest";
import * as navigation from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("HomePage", () => {
  it("redirects to /login", () => {
    try {
      render(<Home />);
    } catch (e: any) {}
    expect(navigation.redirect).toHaveBeenCalledWith("/login");
  });
});
