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
    expect(screen.getByLabelText('login.email_label')).toBeTruthy();
    expect(screen.getByLabelText('login.password_label')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'login.sign_in' })).toBeTruthy();
    expect(screen.queryByLabelText('login.name_label')).toBeNull();
  });

  it('toggles between sign in and sign up', () => {
    render(<Login />);

    const toggleButton = screen.getByRole('button', { name: 'login.no_account' });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: 'login.sign_up' })).toBeTruthy();
    expect(screen.getByLabelText('login.name_label')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'login.have_account' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'login.have_account' }));
    expect(screen.getByRole('button', { name: 'login.sign_in' })).toBeTruthy();
    expect(screen.queryByLabelText('login.name_label')).toBeNull();
  });

  it('handles successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      // Component uses window.location.href = redirectPath;
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('handles sign in error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

    render(<Login />);

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'wrong-password' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('handles successful sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    // Toggle to register
    fireEvent.click(screen.getByRole('button', { name: 'login.no_account' }));

    fireEvent.change(screen.getByLabelText('login.name_label'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

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
      expect(screen.getByText('login.check_email')).toBeTruthy();
    });
  });

  it('handles sign up error', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: 'User already exists' } });

    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'login.no_account' }));

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_up' }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeTruthy();
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

    fireEvent.change(screen.getByLabelText('login.email_label'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('login.password_label'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'login.sign_in' }));

    expect(screen.getByText('common.connecting')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'common.connecting' })).toBeDisabled();

    // Resolve it
    resolveAuth({ data: { user: {} }, error: null });

    await waitFor(() => {
      expect(screen.queryByText('common.connecting')).toBeNull();
    });
  });
});
