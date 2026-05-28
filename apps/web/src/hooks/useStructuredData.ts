import { useEffect } from 'react';

/**
 * Inject a JSON-LD `<script>` into the document head while the component is
 * mounted, and clean up on unmount. Search engines pick this up alongside
 * the OG meta tags to render rich product / rating cards.
 *
 * Pass `null` to skip injection (e.g. while the data is still loading).
 */
export function useStructuredData(data: object | null) {
  useEffect(() => {
    if (!data || typeof document === 'undefined') return;
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(data);
    tag.setAttribute('data-source', 'promptmarket-structured');
    document.head.appendChild(tag);
    return () => {
      try {
        tag.remove();
      } catch {
        /* element already gone — silently ignore */
      }
    };
  }, [data]);
}
