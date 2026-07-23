"use client";

import { useEffect, useState } from "react";
import { deleteStoryAction } from "@/lib/actions/story-actions";
import type { StoryItem } from "@/lib/stories";

const PHOTO_DURATION_MS = 7000;

export function StoryViewer({
  stories,
  onClose,
  canDelete,
}: {
  stories: StoryItem[];
  onClose: () => void;
  canDelete: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const current = stories[index];

  function next() {
    if (index >= stories.length - 1) {
      onClose();
    } else {
      setIndex((i) => i + 1);
      setProgress(0);
    }
  }

  function prev() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setProgress(0);
  }

  useEffect(() => {
    if (!current || current.mediaType === "VIDEO") return;
    const start = Date.now();
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / PHOTO_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!current) return null;

  async function handleDelete() {
    const fd = new FormData();
    fd.set("id", current.id);
    await deleteStoryAction(fd);
    next();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex gap-1 px-3 pt-3">
        {stories.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-white"
              style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-sm font-medium text-brand-text">{current.author.name}</p>
        <div className="flex items-center gap-4">
          {canDelete && (
            <button type="button" onClick={handleDelete} className="text-sm text-red-300">
              Удалить
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-brand-text/70"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center"
        onClick={(e) => {
          const half = window.innerWidth / 2;
          if (e.clientX < half) prev();
          else next();
        }}
      >
        {current.mediaType === "PHOTO" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <video
            key={current.id}
            src={current.mediaUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            playsInline
            onEnded={next}
          />
        )}
      </div>

      {current.caption && (
        <p className="px-4 pb-6 text-center text-sm text-brand-text/90">{current.caption}</p>
      )}
    </div>
  );
}
