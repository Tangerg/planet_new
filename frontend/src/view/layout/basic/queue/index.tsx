import React from "react";

import TrackItem from "@/components/track-item";
import useAppStore from "@/store/app";
import { usePlayQueueStore } from "@/store/playqueue";
import { ScrollArea } from "@/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";

const Queue: React.FC = () => {
  const isQueueOpen = useAppStore.use.isQueueOpen();
  const setIsQueueOpen = useAppStore.use.setIsQueueOpen();
  const tracks = usePlayQueueStore.use.tracks();

  return (
    <Sheet open={isQueueOpen} onOpenChange={setIsQueueOpen}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[420px] flex-col bg-surface text-white"
      >
        <SheetHeader>
          <SheetTitle>Queue</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-3 pb-6">
          <ul className="flex flex-col gap-1">
            {tracks?.map((track) => (
              <li key={track.id}>
                <TrackItem track={track} />
              </li>
            ))}
            {(!tracks || tracks.length === 0) && (
              <li className="px-3 py-8 text-center text-sm text-text-muted">
                Your queue is empty
              </li>
            )}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default Queue;
