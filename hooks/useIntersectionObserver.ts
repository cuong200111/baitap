import { useEffect, useState } from 'react';

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  root = null,
}: {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
} = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, rootMargin, root }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [node, threshold, rootMargin, root]);

  return [setNode, entry?.isIntersecting ?? false] as const;
}
