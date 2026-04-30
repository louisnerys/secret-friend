import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './page';
import { mockSignInWithPassword, mockSignUp, mockSignInWithOAuth } from '../../../vitest.setup';

describe('Login Component', () => {
  const mockLocation = {
    origin: 'http://localhost:3000',
    search: '',
    href: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', {
      ...window.location,
      ...mockLocation,
    });
  });

  it('renders sign in form by default', () => {
    render(<Login />);

    expect(screen.getByText('login.welcome')).toBeTruthy();
    expect(screen.getByRole('button', { name: /login.continue_google/i })).toBeTruthy();
    expect(screen.getByText('login.email_label')).toBeTruthy();
    expect(screen.getByText('login.password_label')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'login.sign_in' })).toBeTruthy();
    expect(screen.queryByText('login.name_label')).toBeNull();
  });

  it('toggles between sign in and sign up', () => {
    render(<Login />);

    const toggleButton = screen.getByRole('button', { name: 'login.no_account' });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: 'login.sign_up' })).toBeTruthy();
    expect(screen.getByText('login.name_label')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'login.have_account' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'login.have_account' }));
    expect(screen.getByRole('button', { name: 'login.sign_in' })).toBeTruthy();
    expect(screen.queryByText('login.name_label')).toBeNull();
  });

  it('handles successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
    });
  });

  it('handles successful sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    // Toggle to register
    fireEvent.click(screen.getByRole('button', { name: 'login.no_account' }));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_up' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User' },
          emailRedirectTo: 'http://localhost:3000/callback?next=%2Fdashboard',
        },
      });
      expect(screen.getByRole('status')).toBeTruthy();
      expect(screen.getByText('login.check_email')).toBeTruthy();
    });
  });

  it('handles sign up error', async () => {
    const errorMessage = 'User already exists';
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: errorMessage } });

    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'login.no_account' }));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Existing User' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_up' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeTruthy();
    });
  });

  it('handles google social login', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /login.continue_google/i }));

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

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

    expect(screen.getByText('common.connecting')).toBeTruthy();
    const submitBtn = screen.getByRole('button', { name: 'common.connecting' });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // Resolve it
    resolveAuth({ data: { user: {} }, error: null });

    await waitFor(() => {
      expect(screen.queryByText('common.connecting')).toBeNull();
    });
  });
});
