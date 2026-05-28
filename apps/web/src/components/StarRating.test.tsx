import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StarRating from './StarRating';

describe('<StarRating />', () => {
  it('renders five star buttons regardless of value', () => {
    render(<StarRating value={3.7} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('rounds value to the nearest integer for fill count', () => {
    render(<StarRating value={3.4} />);
    const buttons = screen.getAllByRole('button');
    // The first three stars should carry the filled class; the rest should not.
    expect(buttons[0].querySelector('.fill-volt-400')).not.toBeNull();
    expect(buttons[2].querySelector('.fill-volt-400')).not.toBeNull();
    expect(buttons[3].querySelector('.fill-volt-400')).toBeNull();
  });

  it('disables every button when onChange is not supplied (read-only)', () => {
    render(<StarRating value={4} />);
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });

  it('enables every button when onChange is supplied (interactive)', () => {
    render(<StarRating value={4} onChange={vi.fn()} />);
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).not.toBeDisabled();
    }
  });

  it('clicking a star fires onChange with its 1-based index', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('shows the label like "4.5 (12)" when showLabel + count provided', () => {
    render(<StarRating value={4.5} count={12} showLabel />);
    expect(screen.getByText('4.5 (12)')).toBeTruthy();
  });

  it('shows just "(N)" when count is provided without showLabel', () => {
    render(<StarRating value={4.5} count={7} />);
    expect(screen.getByText('(7)')).toBeTruthy();
    expect(screen.queryByText('4.5 (7)')).toBeNull();
  });

  it('hovering paints the preview fill independent of the value', () => {
    render(<StarRating value={2} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.mouseEnter(buttons[4]);
    // All five stars should now be filled in the preview.
    for (const btn of buttons) {
      expect(btn.querySelector('.fill-volt-400')).not.toBeNull();
    }
  });
});
