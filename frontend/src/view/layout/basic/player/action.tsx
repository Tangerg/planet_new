import React from "react";
import { ListMusic, Maximize2 } from "lucide-react";

import VolumeControl from "@/components/volume-control";
import { cn } from "@/lib/cn";
import useAppStore from "@/store/app";
import { Tooltip } from "@/ui/tooltip";

const IconBtn: React.FC<{
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, active, children }) => (
  <Tooltip content={label}>
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        active ? "text-accent" : "text-text-muted hover:text-white",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const QueueBtn: React.FC = () => {
  const isQueueOpen = useAppStore.use.isQueueOpen();
  const setIsQueueOpen = useAppStore.use.setIsQueueOpen();
  return (
    <IconBtn
      label="Queue"
      active={isQueueOpen}
      onClick={() => setIsQueueOpen(!isQueueOpen)}
    >
      <ListMusic size={18} />
    </IconBtn>
  );
};

const FullScreen: React.FC = () => (
  <IconBtn label="Full screen">
    <Maximize2 size={18} />
  </IconBtn>
);

const Action: React.FC = () => (
  <div className="flex items-center gap-1.5">
    <QueueBtn />
    <VolumeControl />
    <FullScreen />
  </div>
);

export default Action;
