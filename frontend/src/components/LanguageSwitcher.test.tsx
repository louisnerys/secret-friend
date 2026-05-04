import { render, fireEvent } from '@testing-library/react';
import LanguageSwitcher from './LanguageSwitcher';
import { describe, it, expect, vi } from 'vitest';
import { useTranslation } from 'react-i18next';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('LanguageSwitcher', () => {
  it('renders buttons and changes language', () => {
    const mockChangeLanguage = vi.fn();
    vi.mocked(useTranslation).mockReturnValue({
      i18n: { 
        changeLanguage: mockChangeLanguage,
        language: 'en'
      },
      t: (key: string) => key,
    } as any);

    const { getByLabelText } = render(<LanguageSwitcher />);
    
    const ptButton = getByLabelText('Português');
    fireEvent.click(ptButton);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('highlights active language', () => {
    vi.mocked(useTranslation).mockReturnValue({
      i18n: { 
        changeLanguage: vi.fn(),
        language: 'pt-BR'
      },
      t: (key: string) => key,
    } as any);

    const { getByLabelText } = render(<LanguageSwitcher />);
    
    const ptButton = getByLabelText('Português');
    expect(ptButton.getAttribute('aria-pressed')).toBe('true');
  });
});
