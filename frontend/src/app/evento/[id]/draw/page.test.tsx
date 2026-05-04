import { render, fireEvent } from '@testing-library/react';
import DrawPage from './page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { useEventDrawController } from '@/presentation/controllers/useEventDrawController';

// Mock the controller
const mockController = {
  t: (key: string) => key,
  i18n: { language: 'pt' },
  myDrawn: { name: 'Bob' },
  messages: [],
  activeChat: 'drawn',
  setActiveChat: vi.fn(),
  newMessage: '',
  setNewMessage: vi.fn(),
  loading: false,
  revealed: false,
  setRevealed: vi.fn(),
  router: { push: vi.fn() },
  chatEndRef: { current: null },
  handleSendMessage: vi.fn(),
  filteredMessages: []
};

vi.mock('@/presentation/controllers/useEventDrawController', () => ({
  useEventDrawController: vi.fn(() => mockController)
}));

// Mock React.use for params
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: (promise: any) => {
        if (promise && typeof promise.then === 'function') {
            return { id: 'evt-1' }; // Mocking the resolved params
        }
        return actual.use(promise);
    }
  };
});

describe('DrawPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, loading: true } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    expect(getByText('draw.revealing')).toBeDefined();
  });

  it('renders reveal button initially', () => {
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, revealed: false } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    expect(getByText('draw.reveal_name')).toBeDefined();
  });

  it('shows name when revealed', () => {
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, revealed: true } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    expect(getByText('Bob')).toBeDefined();
  });

  it('switches tabs', () => {
    const setActiveChat = vi.fn();
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, setActiveChat } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    fireEvent.click(getByText('draw.tab_my_drawer'));
    
    expect(setActiveChat).toHaveBeenCalledWith('drawer');
  });

  it('sends message', () => {
    const handleSendMessage = vi.fn((e) => e.preventDefault());
    vi.mocked(useEventDrawController).mockReturnValue({ 
        ...mockController, 
        newMessage: 'Hello',
        handleSendMessage 
    } as any);

    const { getByLabelText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    fireEvent.submit(getByLabelText('common.send').closest('form')!);
    
    expect(handleSendMessage).toHaveBeenCalled();
  });
});
