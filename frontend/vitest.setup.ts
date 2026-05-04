import { vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

export const mockPush = vi.fn();
export const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() }
  }),
}));

export const mockSingle = vi.fn();
export const mockInsert = vi.fn();
export const mockSelect = vi.fn();
export const mockEq = vi.fn();
export const mockIn = vi.fn();
export const mockOrder = vi.fn();
export const mockUpdate = vi.fn();
export const mockDelete = vi.fn();
export const mockMaybeSingle = vi.fn();

// Create a chain that returns itself for all chained methods
export const chain: any = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  update: mockUpdate,
  delete: mockDelete,
  insert: mockInsert,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  then: function (resolve: any) {
    resolve({ data: [{ id: 'evt-1', name: 'Event 1' }], error: null });
  }
};

mockSelect.mockReturnValue(chain);
mockEq.mockReturnValue(chain);
mockIn.mockReturnValue(chain);
mockOrder.mockReturnValue(chain);
mockUpdate.mockReturnValue(chain);
mockDelete.mockReturnValue(chain);
mockInsert.mockReturnValue(chain);

mockSingle.mockImplementation(() => Promise.resolve({ data: { id: 'evt-1', name: 'Event 1' }, error: null }));
mockMaybeSingle.mockImplementation(() => Promise.resolve({ data: { id: 'evt-1', name: 'Event 1' }, error: null }));

const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockChannelOn = vi.fn().mockReturnThis();
const mockChannelSubscribe = vi.fn();
const mockInvoke = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
      exchangeCodeForSession: (...args: any[]) => mockExchangeCodeForSession(...args),
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
    },
    from: vi.fn(() => chain),
    rpc: vi.fn((...args: any[]) => {
      // Mock rpc normally but also return chain so .maybeSingle() works
      const res = mockRpc(...args);
      if (res && res.then) {
         return res;
      }
      return chain;
    }),
    channel: vi.fn(() => ({
      on: mockChannelOn,
      subscribe: mockChannelSubscribe,
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    }
  },
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as any;

if (typeof window !== 'undefined' && window.HTMLElement) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

beforeEach(() => {
  vi.clearAllMocks();

  mockChannelOn.mockReturnThis();

  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null });
  mockRpc.mockResolvedValue({ data: null, error: null });
  mockExchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null });

  mockSingle.mockImplementation(() => Promise.resolve({ data: { id: 'evt-1', name: 'Event 1' }, error: null }));
  mockMaybeSingle.mockImplementation(() => Promise.resolve({ data: { id: 'evt-1', name: 'Event 1' }, error: null }));

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

export {
  mockGetUser,
  mockGetSession,
  mockExchangeCodeForSession,
  mockSignInWithOAuth,
  mockSignInWithPassword,
  mockSignUp,
  mockRpc
};
