import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './page';
import { mockSignInWithPassword, mockSignUp, mockSignInWithOAuth } from '../../../vitest.setup';

// Mock window.location
const originalLocation = window.location;

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup location mock
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'http://localhost:3000',
      search: '',
      href: '',
    } as any;
  });

  it('renders sign in form by default', () => {
    render(<Login />);

    expect(screen.getByText('login.welcome')).toBeDefined();
    expect(screen.getByText('login.continue_google')).toBeDefined();
    expect(screen.getByPlaceholderText('name@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getByText('login.sign_in')).toBeDefined();
    expect(screen.queryByPlaceholderText('John Doe')).toBeNull();
  });

  it('toggles between sign in and sign up', () => {
    render(<Login />);

    const toggleButton = screen.getByText('login.no_account');
    fireEvent.click(toggleButton);

    expect(screen.getByText('login.sign_up')).toBeDefined();
    expect(screen.getByPlaceholderText('John Doe')).toBeDefined();
    expect(screen.getByText('login.have_account')).toBeDefined();

    fireEvent.click(screen.getByText('login.have_account'));
    expect(screen.getByText('login.sign_in')).toBeDefined();
    expect(screen.queryByPlaceholderText('John Doe')).toBeNull();
  });

  it('handles successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('login.sign_in'));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('handles sign in error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong-password' } });

    fireEvent.click(screen.getByText('login.sign_in'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('handles successful sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    // Toggle to register
    fireEvent.click(screen.getByText('login.no_account'));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('login.sign_up'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User' },
          emailRedirectTo: 'http://localhost:3000/callback?next=%2Fdashboard',
        },
      });
      expect(screen.getByText('login.check_email')).toBeDefined();
    });
  });

  it('handles sign up error', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: 'User already exists' } });

    render(<Login />);
    fireEvent.click(screen.getByText('login.no_account'));

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('login.sign_up'));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeDefined();
    });
  });

  it('handles google social login', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    render(<Login />);

    fireEvent.click(screen.getByText('login.continue_google'));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/callback?next=%2Fdashboard',
      },
    });
  });

  it('shows loading state during email auth', async () => {
    // Return a promise that doesn't resolve immediately
    let resolveAuth: any;
    const authPromise = new Promise((resolve) => { resolveAuth = resolve; });
    mockSignInWithPassword.mockReturnValue(authPromise);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('login.sign_in'));

    expect(screen.getByText('common.connecting')).toBeDefined();
    expect(screen.getByText('common.connecting')).toBeDisabled();

    // Resolve it
    resolveAuth({ data: { user: {} }, error: null });

    await waitFor(() => {
      expect(screen.queryByText('common.connecting')).toBeNull();
    });
  });
});
