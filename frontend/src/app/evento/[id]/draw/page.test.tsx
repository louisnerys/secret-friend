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

  it('renders messages correctly depending on who sent them', () => {
    const messages = [
      { id: '1', text: 'Hello', is_mine: true, sender_display: 'Você' },
      { id: '2', text: 'Hi', is_mine: false, sender_display: 'Bob' },
    ];
    vi.mocked(useEventDrawController).mockReturnValue({
      ...mockController,
      filteredMessages: messages as any,
      activeChat: 'drawer'
    } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    
    expect(getByText('Hello')).toBeDefined();
    expect(getByText('Hi')).toBeDefined();
    // Test the "You" translation logic
    expect(getByText('common.you')).toBeDefined();
  });

  it('triggers router push when back button is clicked', () => {
    const push = vi.fn();
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, router: { push } } as any);
    const { getByLabelText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    fireEvent.click(getByLabelText('common.back'));
    expect(push).toHaveBeenCalledWith('/evento/evt-1');
  });

  it('triggers setRevealed correctly', () => {
    const setRevealed = vi.fn();
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, setRevealed, revealed: false } as any);
    const { getByText, rerender } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    
    // Test true
    fireEvent.click(getByText('draw.reveal_name'));
    expect(setRevealed).toHaveBeenCalledWith(true);

    // Test false
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, setRevealed, revealed: true } as any);
    rerender(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    fireEvent.click(getByText('draw.hide'));
    expect(setRevealed).toHaveBeenCalledWith(false);
  });

  it('triggers setNewMessage on input change', () => {
    const setNewMessage = vi.fn();
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, setNewMessage } as any);
    const { getByPlaceholderText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    
    fireEvent.change(getByPlaceholderText('draw.placeholder'), { target: { value: 'New Test Message' } });
    expect(setNewMessage).toHaveBeenCalledWith('New Test Message');
  });

  it('switches tabs to my drawn', () => {
    const setActiveChat = vi.fn();
    vi.mocked(useEventDrawController).mockReturnValue({ ...mockController, setActiveChat } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    fireEvent.click(getByText('draw.tab_my_drawn'));
    
    expect(setActiveChat).toHaveBeenCalledWith('drawn');
  });

  it('shows ??? when myDrawn is null and revealed', () => {
    vi.mocked(useEventDrawController).mockReturnValue({
      ...mockController,
      revealed: true,
      myDrawn: null, // exercises the `|| '???'` branch on line 102
    } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    expect(getByText('???')).toBeDefined();
  });

  it('renders non-Você sender_display as-is', () => {
    const messages = [
      { id: '3', text: 'Hey', is_mine: false, sender_display: 'Alice' }, // not 'Você' → exercises false branch of ternary
    ];
    vi.mocked(useEventDrawController).mockReturnValue({
      ...mockController,
      filteredMessages: messages as any,
    } as any);

    const { getByText } = render(<DrawPage params={Promise.resolve({ id: 'evt-1' })} />);
    expect(getByText('Alice')).toBeDefined();
  });
});
