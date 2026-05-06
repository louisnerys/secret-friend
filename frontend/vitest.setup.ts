import { vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

export const mockPush = vi.fn();
export const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
  I18nextProvider: ({ children }: any) => children,
}));

export const mockSingle = vi.fn();
export const mockInsert = vi.fn();
export const mockSelect = vi.fn();
export const mockEq = vi.fn();
export const mockIn = vi.fn();
export const mockOrder = vi.fn();
export const mockOr = vi.fn();
export const mockUpdate = vi.fn();
export const mockDelete = vi.fn();
export const mockMaybeSingle = vi.fn();

// Create a chain that returns itself for all chained methods
export const chain: any = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  or: mockOr,
  update: mockUpdate,
  delete: mockDelete,
  insert: mockInsert,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  then: function (resolve: any) {
    resolve({ data: [{ id: "evt-1", name: "Event 1" }], error: null });
  },
};

mockSelect.mockReturnValue(chain);
mockEq.mockReturnValue(chain);
mockIn.mockReturnValue(chain);
mockOrder.mockReturnValue(chain);
mockOr.mockReturnValue(chain);
mockUpdate.mockReturnValue(chain);
mockDelete.mockReturnValue(chain);
mockInsert.mockReturnValue(chain);

mockSingle.mockImplementation(() =>
  Promise.resolve({ data: { id: "evt-1", name: "Event 1" }, error: null }),
);
mockMaybeSingle.mockImplementation(() =>
  Promise.resolve({ data: { id: "evt-1", name: "Event 1" }, error: null }),
);

export const mockGetUser = vi.fn();
export const mockGetSession = vi.fn();
export const mockExchangeCodeForSession = vi.fn();
export const mockSignInWithOAuth = vi.fn();
export const mockSignInWithPassword = vi.fn();
export const mockSignUp = vi.fn();
const mockChannelOn = vi.fn().mockReturnThis();
const mockChannelSubscribe = vi.fn();
export const mockInvoke = vi.fn();
export const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
      exchangeCodeForSession: mockExchangeCodeForSession,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
    from: vi.fn(() => chain),
    rpc: vi.fn((...args: any[]) => {
      const promise: any = mockRpc(...args);
      promise.maybeSingle = vi.fn().mockReturnValue(promise);
      promise.single = vi.fn().mockReturnValue(promise);
      return promise;
    }),
    channel: vi.fn(() => ({
      on: mockChannelOn,
      subscribe: mockChannelSubscribe,
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }),
) as any;

if (typeof window !== "undefined" && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

beforeEach(() => {
  vi.clearAllMocks();

  mockChannelOn.mockReturnThis();

  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
    error: null,
  });
  mockRpc.mockResolvedValue({ data: null, error: null });
  mockExchangeCodeForSession.mockResolvedValue({
    data: { session: {} },
    error: null,
  });

  mockSingle.mockImplementation(() =>
    Promise.resolve({ data: { id: "evt-1", name: "Event 1" }, error: null }),
  );
  mockMaybeSingle.mockImplementation(() =>
    Promise.resolve({ data: { id: "evt-1", name: "Event 1" }, error: null }),
  );

  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockIn.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockDelete.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
