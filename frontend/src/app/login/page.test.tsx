import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Login from './page';
import { mockSignInWithPassword, mockSignUp, mockSignInWithOAuth } from '../../../vitest.setup';

describe('Login Component', () => {
  const mockLocation = {
    origin: 'http://localhost:3000',
    search: '',
    href: '',
  };

  beforeEach(() => {
    cleanup();
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
    vi.clearAllMocks();
    vi.stubGlobal('location', {
      ...window.location,
      ...mockLocation,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders sign in form by default', () => {
    render(<Login />);

    expect(screen.getAllByText(/login.welcome/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /login.continue_google/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/login.email_label/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/login.password_label/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /login.sign_in/i }).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/login.name_label/i).length).toBe(0);
  });

  it('toggles between sign in and sign up', () => {
    render(<Login />);

    const toggleButton = screen.getAllByRole('button', { name: /login.no_account/i })[0];
    fireEvent.click(toggleButton);

    expect(screen.getAllByRole('button', { name: /login.sign_up/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/login.name_label/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /login.have_account/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /login.have_account/i })[0]);
    expect(screen.getAllByRole('button', { name: /login.sign_in/i }).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/login.name_label/i).length).toBe(0);
  });

  it('handles successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    const emailInputs = screen.getAllByPlaceholderText('name@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const submitBtns = screen.getAllByRole('button', { name: /login.sign_in/i });

    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInputs[passwordInputs.length - 1], { target: { value: 'password123' } });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('handles sign in error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

    render(<Login />);

    const emailInputs = screen.getAllByPlaceholderText('name@example.com');
    const submitBtns = screen.getAllByRole('button', { name: /login.sign_in/i });

    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: 'test@example.com' } });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/invalid credentials/i).length).toBeGreaterThan(0);
    });
  });

  it('handles successful sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

    render(<Login />);

    // Toggle to register
    fireEvent.click(screen.getAllByRole('button', { name: /login.no_account/i })[0]);

    const nameInputs = screen.getAllByPlaceholderText('John Doe');
    const emailInputs = screen.getAllByPlaceholderText('name@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const submitBtns = screen.getAllByRole('button', { name: /login.sign_up/i });

    fireEvent.change(nameInputs[nameInputs.length - 1], { target: { value: 'Test User' } });
    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInputs[passwordInputs.length - 1], { target: { value: 'password123' } });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/login.check_email/i).length).toBeGreaterThan(0);
    });
  });

  it('handles sign up error', async () => {
    const errorMessage = 'User already exists';
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: errorMessage } });

    render(<Login />);
    fireEvent.click(screen.getAllByRole('button', { name: /login.no_account/i })[0]);

    const emailInputs = screen.getAllByPlaceholderText('name@example.com');
    const submitBtns = screen.getAllByRole('button', { name: /login.sign_up/i });

    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: 'existing@example.com' } });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      const errors = screen.getAllByText(new RegExp(errorMessage, 'i'));
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('handles google social login', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    render(<Login />);

    const googleBtns = screen.getAllByRole('button', { name: /login.continue_google/i });
    fireEvent.click(googleBtns[googleBtns.length - 1]);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google'
    }));
  });

  it('shows loading state during email auth', async () => {
    let resolveAuth: any;
    const authPromise = new Promise((resolve) => { resolveAuth = resolve; });
    mockSignInWithPassword.mockReturnValue(authPromise);

    render(<Login />);

    const submitBtnsBefore = screen.getAllByRole('button', { name: /login.sign_in/i });
    fireEvent.click(submitBtnsBefore[submitBtnsBefore.length - 1]);

    const loadingTexts = screen.getAllByText(/common.connecting/i);
    expect(loadingTexts.length).toBeGreaterThan(0);

    const submitBtnsLoading = screen.getAllByRole('button', { name: /common.connecting/i });
    expect((submitBtnsLoading[submitBtnsLoading.length - 1] as HTMLButtonElement).disabled).toBe(true);

    resolveAuth({ data: { user: {} }, error: null });

    await waitFor(() => {
      expect(screen.queryAllByText(/common.connecting/i).length).toBe(0);
    });
  });
});
