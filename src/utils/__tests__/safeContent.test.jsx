import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafeBoldText } from '../safeContent';

describe('SafeBoldText', () => {
  it('keeps supported bold formatting', () => {
    render(<p><SafeBoldText text="Use **verified evidence** only" /></p>);
    expect(screen.getByText('verified evidence').tagName).toBe('STRONG');
  });

  it('renders HTML payloads as inert text', () => {
    const { container } = render(<p><SafeBoldText text={'<img src=x onerror="alert(1)"> **safe**'} /></p>);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });
});
