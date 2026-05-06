import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import NewEvent from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("NewEvent", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
  });

  it("renders form and creates event", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "new-e1" }, error: null });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    } as any);

    const { getByLabelText, getByRole, getByText } = render(<NewEvent />);

    fireEvent.change(getByLabelText("newEvent.fields.name"), {
      target: { value: "Holiday Party" },
    });
    fireEvent.change(getByLabelText("newEvent.fields.reveal_date"), {
      target: { value: "2025-12-25" },
    });

    const submitBtn = getByText("newEvent.create_button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Holiday Party" }),
      );
      expect(mockPush).toHaveBeenCalledWith("/evento/new-e1");
    });
  });

  it("shows error if creation fails", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Failure" } }),
    } as any);

    const { getByLabelText, getByText } = render(<NewEvent />);

    fireEvent.change(getByLabelText("newEvent.fields.name"), {
      target: { value: "Bad Event" },
    });
    fireEvent.click(getByText("newEvent.create_button"));

    await waitFor(() => {
      expect(getByText(/newEvent.create_error/i)).toBeDefined();
    });
  });

  it("shows generic error if creation fails without message", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: {} }),
    } as any);

    const { getByLabelText, getByRole } = render(<NewEvent />);

    fireEvent.change(getByLabelText("newEvent.fields.name"), {
      target: { value: "Bad Event" },
    });
    fireEvent.submit(getByRole("button", { name: "newEvent.create_button" }));

    await waitFor(() => {
      expect(screen.getByText(/common.error/i)).toBeDefined();
    });
  });

  it("navigates back on cancel", () => {
    const { getByText } = render(<NewEvent />);
    fireEvent.click(getByText("common.cancel"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("does not submit if name is empty", async () => {
    const { getByRole } = render(<NewEvent />);
    const submitBtn = getByRole("button", { name: "newEvent.create_button" });
    fireEvent.submit(submitBtn);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("redirects to login if not authenticated", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const { getByLabelText, getByText } = render(<NewEvent />);

    fireEvent.change(getByLabelText("newEvent.fields.name"), {
      target: { value: "Holiday Party" },
    });
    fireEvent.click(getByText("newEvent.create_button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("updates description when typed", () => {
    const { getByPlaceholderText } = render(<NewEvent />);
    const descInput = getByPlaceholderText(
      "newEvent.fields.description_placeholder",
    );
    fireEvent.change(descInput, { target: { value: "Secret Rules" } });
    expect((descInput as HTMLInputElement).value).toBe("Secret Rules");
  });

  it("navigates to dashboard via bottom nav", () => {
    const { getByText } = render(<NewEvent />);
    fireEvent.click(getByText("dashboard.nav_events"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
