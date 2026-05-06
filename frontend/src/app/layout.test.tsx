import { render } from "@testing-library/react";
import RootLayout from "./layout";
import { vi, describe, it, expect } from "vitest";

vi.mock("next/font/google", () => ({
  Epilogue: () => ({ variable: "mock-font-var" }),
  Manrope: () => ({ variable: "mock-font-var-2" }),
}));

vi.mock("../components/I18nProvider", () => ({
  default: ({ children }: any) => (
    <div data-testid="i18n-provider">{children}</div>
  ),
}));

vi.mock("./PwaRegister", () => ({
  default: () => <div data-testid="pwa-register"></div>,
}));

describe("RootLayout", () => {
  it("renders children with I18nProvider", () => {
    const { getByTestId, getByText } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>,
    );

    expect(getByTestId("i18n-provider")).toBeDefined();
    expect(getByTestId("pwa-register")).toBeDefined();
    expect(getByText("Test Child")).toBeDefined();
  });
});
