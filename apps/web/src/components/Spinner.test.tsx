import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

describe('<Spinner />', () => {
  it('renders without error when no props are provided', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows label text when label prop is provided', () => {
    render(<Spinner label="Loading…" />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('does not render a span when label is not provided', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('span')).toBeNull();
  });

  it('applies extra className to the outer wrapper', () => {
    const { container } = render(<Spinner className="my-custom-class" />);
    expect(
      (container.firstChild as HTMLElement).classList.contains('my-custom-class'),
    ).toBe(true);
  });
});
