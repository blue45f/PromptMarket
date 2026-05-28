import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownToc from './MarkdownToc';

describe('<MarkdownToc />', () => {
  it('renders nothing when source has no H2/H3 headings', () => {
    const { container } = render(<MarkdownToc source="just some prose" />);
    // Component returns null when entries is empty.
    expect(container.firstChild).toBeNull();
  });

  it('extracts H2 and H3 headings from the source', () => {
    const md = `# Title

## Section one

text

### Subsection A

more

## Section two`;
    render(<MarkdownToc source={md} />);
    expect(screen.getByText('Section one')).toBeTruthy();
    expect(screen.getByText('Subsection A')).toBeTruthy();
    expect(screen.getByText('Section two')).toBeTruthy();
    // H1 should not appear in the TOC.
    expect(screen.queryByText('Title')).toBeNull();
  });

  it('skips headings inside fenced code blocks', () => {
    // Need at least 2 entries for the TOC to render (entries.length < 2 → null).
    const md = `## Real heading

\`\`\`md
## Fake heading inside code
\`\`\`

## Second real heading`;
    render(<MarkdownToc source={md} />);
    expect(screen.getByText('Real heading')).toBeTruthy();
    expect(screen.getByText('Second real heading')).toBeTruthy();
    expect(screen.queryByText('Fake heading inside code')).toBeNull();
  });

  it('strips markdown emphasis from heading text', () => {
    const md = `## **Bold** _italic_ heading\n\n## Second`;
    render(<MarkdownToc source={md} />);
    // Whitespace may collapse between stripped emphasis markers; match
    // with a flexible regex instead of an exact string.
    expect(screen.getByText(/Bold\s+italic\s+heading/)).toBeTruthy();
  });

  it('handles Korean heading text', () => {
    const md = `## 한국어 섹션\n\n### 하위 섹션`;
    render(<MarkdownToc source={md} />);
    expect(screen.getByText('한국어 섹션')).toBeTruthy();
    expect(screen.getByText('하위 섹션')).toBeTruthy();
  });
});
