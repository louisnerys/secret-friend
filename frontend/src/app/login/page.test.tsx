import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './page';
import { mockSignInWithPassword, mockSignUp, mockSignInWithOAuth } from '../../../vitest.setup';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() }
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in form by default', () => {
    render(<Login />);
    expect(screen.getByLabelText('login.email_label')).toBeDefined();
    expect(screen.getByLabelText('login.password_label')).toBeDefined();
    expect(screen.queryByLabelText('login.name_label')).toBeNull();
  });

  it('toggles between sign in and sign up', async () => {
    const { container } = render(<Login />);
    
    // Toggle to register
    const toggleBtn = container.querySelector('#auth-toggle-button')!;
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    
    expect(screen.getByLabelText('login.name_label')).toBeDefined();
    
    // Toggle back to login
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    expect(screen.queryByLabelText('login.name_label')).toBeNull();
  });

  it('handles successful sign in', async () => {
    const { container } = render(<Login />);
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#login-submit-button')!);
    });

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles sign in error', async () => {
    const { container } = render(<Login />);
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'wrong-password' } });

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#login-submit-button')!);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('handles successful sign up', async () => {
    const { container } = render(<Login />);

    // Toggle to register
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#auth-toggle-button')!);
    });

    fireEvent.change(screen.getByLabelText('login.name_label'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#login-submit-button')!);
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
          },
          emailRedirectTo: expect.stringContaining('/callback?next=%2Fdashboard'),
        },
      });
    });
  });

  it('handles sign up error', async () => {
    const { container } = render(<Login />);
    
    // Toggle to register
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#auth-toggle-button')!);
    });

    // Verify it toggled
    expect(screen.queryByLabelText('login.name_label')).not.toBeNull();

    fireEvent.change(screen.getByLabelText('login.name_label'), { target: { value: 'Existing User' } });
    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: 'User already exists' } });

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#login-submit-button')!);
    });

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeDefined();
    });
  });

  it('handles google social login', async () => {
    const { container } = render(<Login />);

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(container.querySelector('#google-login-button')!);
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/callback?next=%2Fdashboard'),
      },
    });
  });

  it('shows loading state during email auth', async () => {
    // Return a promise that doesn't resolve immediately
    let resolveAuth: any;
    const authPromise = new Promise((resolve) => { resolveAuth = resolve; });
    mockSignInWithPassword.mockReturnValue(authPromise);

    const { container } = render(<Login />);
    const submitBtn = container.querySelector('#login-submit-button') as HTMLButtonElement;

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'http://google.com' }, error: null });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('common.connecting')).toBeDefined();
    expect(submitBtn.disabled).toBe(true);
  });
});
