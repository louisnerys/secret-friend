import { renderHook, waitFor } from "@testing-library/react";
import { useAdminController } from "./useAdminController";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetUser, mockRpc, mockPush } from "../../../vitest.setup";

describe("useAdminController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches admin metrics successfully", async () => {
    const mockMetrics = {
      total_events: 10,
      total_users: 50,
      active_events: 5,
    };

    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: mockMetrics,
      error: null,
    });

    const { result } = renderHook(() => useAdminController());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.error).toBeNull();
  });

  it("handles error when fetching metrics with error message", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    const errorMessage = "You are not an admin";
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAdminController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it("handles error when fetching metrics without error message (fallback)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: {}, // No message property
    });

    const { result } = renderHook(() => useAdminController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBe("Erro ao carregar métricas. Você é um administrador?");
  });

  it("redirects to login if no user is found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAdminController());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    // Finally block always runs even on return, so loading should become false
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("handles handleMakeMeAdmin", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useAdminController());

    result.current.handleMakeMeAdmin();

    expect(alertSpy).toHaveBeenCalledWith(
      "Para testar, atualize a coluna is_admin do seu usuário para true diretamente no banco de dados.",
    );

    alertSpy.mockRestore();
  });
});
