import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ModelPicker from './ModelPicker';

describe('<ModelPicker />', () => {
  it('renders one section per vendor when no query is set', () => {
    render(<ModelPicker value={[]} onChange={vi.fn()} />);
    // Vendor labels are uppercase model.vendor strings; at least 2 must exist
    // (Anthropic + OpenAI etc.).
    const sectionLabels = screen.getAllByText(/^(Anthropic|OpenAI|Google|Meta|Mistral|xAI|DeepSeek|Cohere)$/);
    expect(sectionLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('filters models by vendor name (case-insensitive)', () => {
    render(<ModelPicker value={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('모델 / 벤더 검색…');
    fireEvent.change(input, { target: { value: 'anthropic' } });
    // Anthropic still appears, OpenAI should not.
    expect(screen.queryByText('Anthropic')).not.toBeNull();
    expect(screen.queryByText('OpenAI')).toBeNull();
  });

  it('shows an empty hint when the query matches nothing', () => {
    render(<ModelPicker value={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('모델 / 벤더 검색…');
    fireEvent.change(input, { target: { value: 'zzz-unknown' } });
    expect(screen.getByText(/zzz-unknown.*맞는 모델이 없어요/)).toBeTruthy();
  });

  it('toggles a slug into and out of value on checkbox click', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ModelPicker value={[]} onChange={onChange} />,
    );
    // Click the first model checkbox (any model — we just need a stable shape).
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0] as string[];
    expect(added.length).toBe(1);

    // Now feed the slug back in and confirm clicking removes it.
    rerender(<ModelPicker value={added} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    const after = onChange.mock.calls[1][0] as string[];
    expect(after).toEqual([]);
  });

  it('hides the search box when hideSearch is set', () => {
    render(<ModelPicker value={[]} onChange={vi.fn()} hideSearch />);
    expect(screen.queryByPlaceholderText('모델 / 벤더 검색…')).toBeNull();
  });

  it('renders a removable chip for each selected slug at the top', () => {
    const onChange = vi.fn();
    render(
      <ModelPicker value={['claude-opus-4-7']} onChange={onChange} />,
    );
    // The chip button is rendered inside a pill row at the top with a label
    // resolved from MODELS. We can't reach for the literal label without
    // coupling to model registry, so check that exactly one chip button
    // exists with the bone-on-ink classes that pill rows use.
    const chips = document.querySelectorAll('button.bg-ink');
    expect(chips.length).toBe(1);
    // Click should remove it.
    fireEvent.click(chips[0]);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
