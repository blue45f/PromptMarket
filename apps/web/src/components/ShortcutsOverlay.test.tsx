import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ShortcutsOverlay from './ShortcutsOverlay';

describe('<ShortcutsOverlay />', () => {
  it('is closed by default — the dialog title is not rendered', () => {
    render(<ShortcutsOverlay />);
    expect(screen.queryByText('키보드 단축키')).toBeNull();
  });

  it('opens when the global "?" key is pressed', () => {
    render(<ShortcutsOverlay />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('키보드 단축키')).toBeTruthy();
  });

  it('toggles open/close on repeated "?" presses', () => {
    render(<ShortcutsOverlay />);
    fireEvent.keyDown(window, { key: '?' });
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.queryByText('키보드 단축키')).toBeNull();
  });

  it('ignores "?" when an INPUT is focused (so typing in search still works)', () => {
    render(
      <>
        <input data-testid="i" />
        <ShortcutsOverlay />
      </>,
    );
    const input = screen.getByTestId('i');
    fireEvent.keyDown(input, { key: '?' });
    expect(screen.queryByText('키보드 단축키')).toBeNull();
  });

  it('ignores "?" combined with a modifier key', () => {
    render(<ShortcutsOverlay />);
    fireEvent.keyDown(window, { key: '?', metaKey: true });
    expect(screen.queryByText('키보드 단축키')).toBeNull();
  });

  it('lists the navigation shortcuts when open', () => {
    render(<ShortcutsOverlay />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('전역')).toBeTruthy();
    expect(screen.getByText('명령 팔레트 열기')).toBeTruthy();
    expect(screen.getByText(/네비게이션/)).toBeTruthy();
    expect(screen.getByText('홈')).toBeTruthy();
  });
});
