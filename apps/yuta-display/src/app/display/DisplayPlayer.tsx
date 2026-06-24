'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayPlaylistItem } from '../../types/display-media';
import { uiText } from '../../constants/ui-text';

const REFRESH_INTERVAL_MS = 60_000;

export function DisplayPlayer() {
  const [items, setItems] = useState<DisplayPlaylistItem[]>([]);
  const [index, setIndex] = useState(0);

  const itemsRef = useRef<DisplayPlaylistItem[]>([]);

  // Request fullscreen on mount to hide the browser address bar.
  // Supports standard API + webkit prefix (Samsung Tizen, older HbbTV).
  useEffect(() => {
    const el = document.documentElement;
    const requestFS =
      el.requestFullscreen?.bind(el) ??
      (el as Element & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(el);
    if (requestFS) {
      requestFS().catch(() => {
        // Silently ignore — some TV browsers block programmatic fullscreen
        // without a user gesture; the PWA manifest handles those cases.
      });
    }
  }, []);

  const advance = useCallback(() => {
    setIndex(current => {
      const len = itemsRef.current.length;
      if (len === 0) return 0;
      return (current + 1) % len;
    });
  }, []);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch('/api/display-media?active=true');
      if (!res.ok) return;

      const data: unknown = await res.json();
      if (!Array.isArray(data)) return;

      itemsRef.current = data as DisplayPlaylistItem[];
      setItems(data as DisplayPlaylistItem[]);
      setIndex(current => (current >= data.length ? 0 : current));
    } catch {
      // Keep the current playlist if the server is temporarily unavailable.
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    void fetchPlaylist();
  }, [fetchPlaylist]);

  // Periodic playlist refresh
  useEffect(() => {
    const interval = setInterval(() => void fetchPlaylist(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPlaylist]);

  const currentItem = items[index];

  // Advance after duration for images
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'image') return;
    const timer = setTimeout(advance, currentItem.duration * 1000);
    return () => clearTimeout(timer);
  }, [currentItem, advance]);

  // Preload the next image while the current slide is showing.
  // Skips videos (too large for TV RAM) and single-item playlists.
  useEffect(() => {
    if (items.length < 2) return;
    const next = items[(index + 1) % items.length];
    if (next?.type !== 'image') return;
    const img = new Image();
    img.src = next.fileUrl;
  }, [index, items]);

  // Empty playlist fallback
  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>
          {uiText.noActiveMedia}
        </p>
      </div>
    );
  }

  if (!currentItem) return null;

  // When there is only one item in the playlist, looping is the only way to
  // keep it playing — advance() would leave index at 0 and React would skip
  // the re-render, so the video would freeze at the last frame.
  const isSolo = items.length === 1;

  return (
    <div style={containerStyle}>
      {currentItem.type === 'image' ? (
        <img
          key={currentItem.id}
          src={currentItem.fileUrl}
          alt={currentItem.title ?? ''}
          className="display-media-enter"
          style={mediaStyle}
          decoding="async"
          fetchPriority="high"
          onError={advance}
        />
      ) : (
        <video
          key={currentItem.id}
          src={currentItem.fileUrl}
          className="display-media-enter"
          style={mediaStyle}
          autoPlay
          muted
          playsInline
          loop={isSolo}
          onEnded={isSolo ? undefined : advance}
          onError={advance}
        />
      )}
    </div>
  );
}

/** Full-viewport black container — inline to survive TV CSS quirks. */
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  cursor: 'none',
  overflow: 'hidden',
};

/**
 * Media fill:
 * - Portrait TV: height is the constraint → fill height, let width be automatic.
 * - object-fit: contain keeps aspect ratio without cropping.
 * - max-width/height: 100% prevent overflow in either orientation.
 */
const mediaStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
};
