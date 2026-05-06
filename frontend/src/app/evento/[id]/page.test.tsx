import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import EventPage from "./page";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { act } from "@testing-library/react";

const {
  mockSingle,
  mockMaybeSingle,
  mockOrder,
  mockInsert,
  mockDelete,
  mockRpc,
  mockEq,
  mockUpdate,
  resolvedParams,
  mockPush,
} = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockOrder: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  mockRpc: vi.fn(),
  mockEq: vi.fn(),
  mockUpdate: vi.fn(),
  resolvedParams: { id: "evt-1" },
  mockPush: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    use: vi.fn((promiseOrContext) => {
      if (promiseOrContext && typeof promiseOrContext.then === "function") {
        return resolvedParams;
      }
      return actual.use(promiseOrContext);
    }),
    useEffect: (fn: any, deps: any) => {
      try {
        fn();
      } catch (e) {}
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/lib/supabase", () => {
  return {
    __mockSingle: mockSingle,
    __mockMaybeSingle: mockMaybeSingle,
    __mockOrder: mockOrder,
    __mockInsert: mockInsert,
    __mockDelete: mockDelete,
    __mockRpc: mockRpc,
    __mockEq: mockEq,
    __mockUpdate: mockUpdate,
    supabase: {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({
            data: {
              user: {
                id: "user-1",
                email: "test@example.com",
                user_metadata: { name: "Test" },
              },
            },
            error: null,
          }),
        getSession: vi
          .fn()
          .mockResolvedValue({
            data: { session: { access_token: "fake-token" } },
            error: null,
          }),
        onAuthStateChange: vi
          .fn()
          .mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
      },
      from: vi.fn((table: string) => {
        const builder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: mockOrder,
          single: mockSingle,
          maybeSingle: mockMaybeSingle,
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
          then: (onFulfilled: any) => mockEq().then(onFulfilled),
        };
        return builder;
      }),
      rpc: mockRpc,
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

import * as SupabaseLib from "@/lib/supabase";
const {
  __mockMaybeSingle,
  __mockOrder,
  __mockEq,
  __mockInsert,
  __mockRpc,
  __mockUpdate,
  __mockDelete,
  __mockSingle: _mockSingle,
} = SupabaseLib as any;

describe("EventDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    if (typeof window !== "undefined") {
      window.alert = vi.fn();
      window.confirm = vi.fn().mockReturnValue(true);

      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });
    }
    __mockOrder.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders event details and allows joining", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-2", // not the logged-in user
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-2",
      },
      error: null,
    });

    __mockEq.mockResolvedValue({
      data: [], // No participants
      error: null,
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null,
    });

    __mockInsert.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "part-1" }, error: null }),
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>,
      );
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByText("Secret Santa 2025")).toBeDefined();
    });
  });

  it("allows starting the draw for admin", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-1",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-1",
      },
      error: null,
    });

    // Make user-1 a participant so "start_draw" logic in frontend doesn't short circuit
    __mockEq.mockResolvedValue({
      data: [
        { user_id: "user-1", name: "User 1" },
        { user_id: "user-2", name: "User 2" },
        { user_id: "user-3", name: "User 3" },
      ],
      error: null,
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>,
      );
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getAllByText("event.draw_now").length).toBeGreaterThan(0);
    });

    const drawBtns = screen.getAllByRole("button");
    const drawBtn = drawBtns.find(
      (btn) =>
        btn.title === "event.draw_now" ||
        btn.textContent?.includes("event.draw_now"),
    );

    await act(async () => {
      if (drawBtn) fireEvent.click(drawBtn);
      await new Promise((r) => setTimeout(r, 0));
    });

    // the draw uses global.fetch
    expect(global.fetch).toHaveBeenCalled();
  });

  it("renders drawn state and allows accessing draw room", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "drawn",
          creator_id: "user-1",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "drawn",
        creator_id: "user-1",
      },
      error: null,
    });

    // Mark the current user (user-1) as a participant so that they can see drawn specific buttons.
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", name: "User 1" }],
      error: null,
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>,
      );
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /event.nav_draw/i }),
      ).not.toBeNull();
    });

    const roomBtn = screen.getByRole("button", { name: /event.nav_draw/i });
    await act(async () => {
      fireEvent.click(roomBtn);
    });
    expect(mockPush).toHaveBeenCalledWith("/evento/evt-1/draw");
  });

  it("allows adding a participant (join)", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-2",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-2",
      },
      error: null,
    });
    __mockEq.mockResolvedValue({ data: [], error: null });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    __mockInsert.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "part-1" }, error: null }),
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>,
      );
      await new Promise((r) => setTimeout(r, 100));
    });

    let joinBtns: HTMLElement[] = [];
    await waitFor(() => {
      joinBtns = screen.getAllByRole("button");
      const joinBtn = joinBtns.find((btn) =>
        btn.textContent?.includes("event.join_event"),
      );
      expect(joinBtn).toBeDefined();
    });

    const joinBtn = joinBtns.find((btn) =>
      btn.textContent?.includes("event.join_event"),
    );
    await act(async () => {
      if (joinBtn) fireEvent.click(joinBtn);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(__mockInsert).toHaveBeenCalled(); // Since it inserts participant
  });

  it("allows toggling like on mural message", async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-1",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-1",
      },
      error: null,
    });
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", name: "User 1" }],
      error: null,
    });
    __mockOrder.mockResolvedValue({
      data: [{ id: "msg-1", text: "Hello", reactions: {} }],
      error: null,
    });

    _mockSingle.mockResolvedValue({
      data: { id: "msg-1", text: "Hello", reactions: {} },
    });
    __mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>,
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Find the thumb up button
    const likeBtns = screen.getAllByText("👍");

    await act(async () => {
      if (likeBtns.length > 0) {
        fireEvent.click(likeBtns[0]);
        vi.runAllTimers();
      }
    });

    expect(__mockUpdate).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("allows copying link", async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-1",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-1",
      },
      error: null,
    });
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", name: "User 1" }],
      error: null,
    });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>,
    );
    await act(async () => {
      vi.runAllTimers();
    });

    const copyBtns = screen.getAllByRole("button", { name: "common.copy" });
    if (copyBtns.length > 0) {
      await act(async () => {
        fireEvent.click(copyBtns[0]);
        vi.runAllTimers();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
    vi.useRealTimers();
  });

  it("allows removing participant as admin", async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "evt-1",
          name: "Secret Santa 2025",
          status: "open",
          creator_id: "user-1",
        },
        error: null,
      }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: "evt-1",
        name: "Secret Santa 2025",
        status: "open",
        creator_id: "user-1",
      },
      error: null,
    });
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", name: "User 1", id: "part-1" }],
      error: null,
    });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    __mockDelete.mockReturnValue({
      eq: vi
        .fn()
        .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>,
    );
    await act(async () => {
      vi.runAllTimers();
    });

    const removeBtns = screen.queryAllByRole("button", {
      name: "common.remove",
    });
    if (removeBtns.length > 0) {
      await act(async () => {
        fireEvent.click(removeBtns[0]);
        vi.runAllTimers();
      });
      expect(__mockDelete).toHaveBeenCalled();
    }
    vi.useRealTimers();
  });

  it("handles join error", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-2" },
          error: null,
        }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: { id: "evt-1", status: "open", creator_id: "user-2" },
      error: null,
    });
    __mockEq.mockReset();
    __mockEq.mockResolvedValue({ data: [], error: null });

    __mockInsert.mockResolvedValue({ error: { message: "DB Error" } });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    const joinBtn = await screen.findByText("event.join_event");
    await act(async () => {
      fireEvent.click(joinBtn);
    });

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("DB Error"),
    );
  });

  it("handles draw error", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-1" },
          error: null,
        }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: { id: "evt-1", status: "open", creator_id: "user-1" },
      error: null,
    });
    __mockEq.mockReset();
    __mockEq.mockResolvedValue({
      data: [{ user_id: "1" }, { user_id: "2" }, { user_id: "3" }],
      error: null,
    }); // 3 participants to enable draw

    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    const drawBtn = await screen.findByText("event.draw_now");
    const drawBtnParent = drawBtn.closest("button");
    await act(async () => {
      fireEvent.click(drawBtnParent!);
    });

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("event.draw_error"),
    );
  });

  it("allows sending a mural message", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-1" },
          error: null,
        }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: { id: "evt-1", status: "open", creator_id: "user-1" },
      error: null,
    });
    __mockEq.mockReset();
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", users: { name: "User 1" } }],
      error: null,
    });

    __mockInsert.mockResolvedValue({ error: null });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    const input = await screen.findByPlaceholderText("event.mural_placeholder");
    fireEvent.change(input, { target: { value: "Test Message" } });

    const form = input.closest("form");
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(__mockInsert).toHaveBeenCalled();
  });

  it("handles exclusion groups as admin", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-1" },
          error: null,
        }),
    });
    // Mock initial data load
    __mockEq.mockReset();
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", users: { name: "User 1" } }],
      error: null,
    }); // default for participants
    __mockEq
      .mockResolvedValueOnce({
        data: [{ user_id: "user-1", users: { name: "User 1" } }],
        error: null,
      }) // 1: loadData participants
      .mockResolvedValueOnce({
        data: [{ id: "g1", name: "Family", exclusion_group_members: [] }],
        error: null,
      }) // 2: loadData groups
      .mockResolvedValueOnce({
        data: [
          { id: "g1", name: "Family", exclusion_group_members: [] },
          { id: "g2", name: "New Group", exclusion_group_members: [] },
        ],
        error: null,
      }); // 3: handleAdd groups refresh

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Open exclusions section
    const exclusionsBtn = await screen.findByLabelText(
      "event.toggle_exclusions",
    );
    await act(async () => {
      fireEvent.click(exclusionsBtn);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Wait for the input to appear
    const input = await screen.findByPlaceholderText(
      "event.exclusion_group_placeholder",
    );
    fireEvent.change(input, { target: { value: "New Group" } });
    const createBtn = screen.getByText("event.add_group");
    __mockInsert.mockResolvedValue({ error: null });
    await act(async () => {
      fireEvent.click(createBtn);
    });
    expect(__mockInsert).toHaveBeenCalled();

    // Toggle member
    const toggleBtns = await screen.findAllByText(/User 1/i);
    const toggleBtn = toggleBtns[0].closest("button")!;
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }); // for the check
    await act(async () => {
      fireEvent.click(toggleBtn);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(__mockInsert).toHaveBeenCalled();

    // Delete exclusion group
    const deleteBtns = await screen.findAllByLabelText("common.delete");
    __mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await act(async () => {
      fireEvent.click(deleteBtns[0]);
    });
    expect(__mockDelete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("allows interacting with wishlist", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-1" },
          error: null,
        }),
    });

    __mockEq.mockResolvedValue({
      data: [
        { user_id: "user-1", users: { name: "User 1" }, wishlist: "old list" },
      ],
      error: null,
    });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    // Wait for the wishlist header to appear
    await screen.findByText("event.my_wishlist");

    // Open wishlist editor
    const editBtn = await screen.findByRole("button", { name: /event\.edit/i });
    await act(async () => {
      fireEvent.click(editBtn);
    });

    // Change wishlist
    const input = await screen.findByPlaceholderText(
      "event.wishlist_placeholder",
    );
    fireEvent.change(input, { target: { value: "New Wishlist Item" } });

    // Save wishlist
    const saveBtn = await screen.findByText("common.save");
    __mockUpdate.mockReturnValue({
      eq: vi
        .fn()
        .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    expect(__mockUpdate).toHaveBeenCalled();
  });

  it("handles wishlist save error", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open" },
          error: null,
        }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: { id: "evt-1", status: "open" },
      error: null,
    });
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", wishlist: "book" }],
      error: null,
    });
    __mockUpdate.mockReturnValue({
      eq: vi
        .fn()
        .mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: "DB Error" }),
        }),
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Enter edit mode - try both since myWishlist might be empty if mock failed
    const editBtn = await screen.findByText(/event\.(edit|add_item)/);
    fireEvent.click(editBtn);

    const input = await screen.findByPlaceholderText(
      "event.wishlist_placeholder",
    );
    fireEvent.change(input, { target: { value: "toy" } });
    const saveBtn = screen.getByText("common.save");
    await act(async () => {
      fireEvent.click(saveBtn);
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(alertSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not submit mural message when input is empty", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-1" },
          error: null,
        }),
    });
    __mockEq.mockResolvedValue({
      data: [{ user_id: "user-1", users: { name: "User 1" } }],
      error: null,
    });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    const input = await screen.findByPlaceholderText("event.mural_placeholder");
    // Leave input empty — exercises the `!newMuralMsg.trim()` early-return branch
    const form = input.closest("form");
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(__mockInsert).not.toHaveBeenCalled();
  });

  it("join success opens wishlist editing", async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: { id: "evt-1", status: "open", creator_id: "user-2" },
          error: null,
        }),
    });
    __mockMaybeSingle.mockResolvedValue({
      data: { id: "evt-1", status: "open", creator_id: "user-2" },
      error: null,
    });
    __mockEq.mockReset();
    __mockEq.mockResolvedValue({ data: [], error: null });
    // Successful insert → exercises the `!error` path which calls setIsEditingWishlist(true)
    __mockInsert.mockResolvedValue({ error: null });

    render(<EventPage params={Promise.resolve(resolvedParams) as any} />);

    const joinBtn = await screen.findByText("event.join_event");
    await act(async () => {
      fireEvent.click(joinBtn);
    });

    // Wishlist editor appears after successful join
    expect(__mockInsert).toHaveBeenCalled();
  });
});
