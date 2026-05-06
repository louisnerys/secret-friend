import { render, act } from "@testing-library/react";
import I18nProvider from "./I18nProvider";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockI18n = vi.hoisted(() => {
  const i18n = {
    language: "en",
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(async (lng) => {
      i18n.language = lng;
      const callbacks = i18n.on.mock.calls
        .filter((c) => c[0] === "languageChanged")
        .map((c) => c[1]);
      callbacks.forEach((cb) => cb(lng));
    }),
  };
  return i18n;
});

vi.mock("@/lib/i18n", () => ({
  default: mockI18n,
}));

describe("I18nProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockI18n.on.mockClear();
    mockI18n.off.mockClear();
    document.documentElement.lang = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children and handles language changes", async () => {
    const { getByText, unmount } = render(
      <I18nProvider>
        <div>Test Child</div>
      </I18nProvider>,
    );

    // Initially unmounted, visibility hidden
    expect(getByText("Test Child")).toBeDefined();

    // Fast-forward timeout to trigger mounting
    await act(async () => {
      vi.runAllTimers();
    });

    // Now mounted, document lang should be set
    expect(document.documentElement.lang).toBe("en");

    // Simulate language change
    await act(async () => {
      await mockI18n.changeLanguage("pt");
    });
    expect(document.documentElement.lang).toBe("pt");

    // Test unmount
    unmount();
    expect(mockI18n.off).toHaveBeenCalledWith(
      "languageChanged",
      expect.any(Function),
    );
  });
});
