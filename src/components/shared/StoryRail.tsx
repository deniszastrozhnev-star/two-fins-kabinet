"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { StoryViewer } from "./StoryViewer";
import { StoryUploadModal } from "./StoryUploadModal";
import type { StoriesFeed, StoryItem } from "@/lib/stories";

const NEON_RING = "bg-gradient-to-tr from-brand-blue via-brand-cyan to-brand-violet";
const NEUTRAL_RING = "bg-white/15";

export function StoryRail({
  feed,
  ownName,
  ownAvatarUrl,
  canModerate = false,
}: {
  feed: StoriesFeed;
  ownName: string;
  ownAvatarUrl: string | null;
  /** Модерация — любой тренер может удалить чужую историю, не только автор. */
  canModerate?: boolean;
}) {
  const [viewerStack, setViewerStack] = useState<null | {
    stories: StoryItem[];
    canDelete: boolean;
  }>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const hasOwnStories = feed.own.length > 0;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1">
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                hasOwnStories
                  ? setViewerStack({ stories: feed.own, canDelete: true })
                  : setUploadOpen(true)
              }
              aria-label={hasOwnStories ? "Мои истории" : "Добавить историю"}
            >
              <Avatar
                name={ownName}
                url={ownAvatarUrl}
                size={56}
                ringClassName={hasOwnStories ? NEON_RING : NEUTRAL_RING}
              />
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              aria-label="Добавить историю"
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-base bg-brand-cyan text-xs font-bold text-white"
            >
              +
            </button>
          </div>
          <span className="max-w-[64px] truncate text-xs text-brand-text/60">Вы</span>
        </div>

        {feed.others.map(({ author, stories }) => (
          <div
            key={`${author.role}:${author.id}`}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <button
              type="button"
              onClick={() => setViewerStack({ stories, canDelete: canModerate })}
              aria-label={`Истории: ${author.name}`}
            >
              <Avatar name={author.name} url={author.avatarUrl} size={56} ringClassName={NEON_RING} />
            </button>
            <span className="max-w-[64px] truncate text-xs text-brand-text/60">{author.name}</span>
          </div>
        ))}
      </div>

      {viewerStack && (
        <StoryViewer
          stories={viewerStack.stories}
          canDelete={viewerStack.canDelete}
          onClose={() => setViewerStack(null)}
        />
      )}
      {uploadOpen && <StoryUploadModal onClose={() => setUploadOpen(false)} />}
    </>
  );
}
