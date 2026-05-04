import { render } from '@testing-library/react';
import I18nProvider from './I18nProvider';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  default: {
    use: () => ({
      init: vi.fn().mockResolvedValue({}),
    }),
  },
}));

describe('I18nProvider', () => {
  it('renders children', () => {
    const { getByText } = render(
      <I18nProvider>
        <div>Test Child</div>
      </I18nProvider>
    );
    expect(getByText('Test Child')).toBeDefined();
  });
});
