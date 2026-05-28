import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkdownView from './MarkdownView';

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  return writeText;
}

beforeEach(() => {
  stubClipboard();
});

describe('<MarkdownView />', () => {
  it('renders plain markdown text', () => {
    render(<MarkdownView source="Hello **world**" />);
    expect(screen.getByText('world')).toBeTruthy();
  });

  it('renders GFM strikethrough', () => {
    const { container } = render(<MarkdownView source="~~deleted~~" />);
    expect(container.querySelector('del')).toBeTruthy();
  });

  it('renders a code block with a copy button', () => {
    render(<MarkdownView source={'```js\nconst x = 1;\n```'} />);
    expect(screen.getByRole('button', { name: '코드 블록 복사' })).toBeTruthy();
  });

  it('copy button calls clipboard.writeText with trimmed code', async () => {
    const writeText = stubClipboard();
    render(<MarkdownView source={'```\nhello world\n```'} />);
    fireEvent.click(screen.getByRole('button', { name: '코드 블록 복사' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('hello world'));
  });

  it('shows "복사됨" label immediately after copy', async () => {
    render(<MarkdownView source={'```\nsome code\n```'} />);
    fireEvent.click(screen.getByRole('button', { name: '코드 블록 복사' }));
    await waitFor(() => expect(screen.getByText('복사됨')).toBeTruthy());
  });

  it('applies extra className to the outer wrapper', () => {
    const { container } = render(<MarkdownView source="test" className="my-class" />);
    expect(container.firstElementChild?.classList.contains('my-class')).toBe(true);
  });
});
