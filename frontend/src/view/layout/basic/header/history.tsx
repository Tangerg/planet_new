import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip } from "../../../ui/tooltip";

const HistoryButton: React.FC<{
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, label, children }) => (
  <Tooltip content={label}>
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:scale-105 transition-transform"
    >
      {children}
    </button>
  </Tooltip>
);

const History: React.FC = () => {
  const goBack = () => window.history.back();
  const goForward = () => window.history.forward();
  return (
    <div className="flex items-center gap-2">
      <HistoryButton onClick={goBack} label="Go back">
        <ChevronLeft size={18} />
      </HistoryButton>
      <HistoryButton onClick={goForward} label="Go forward">
        <ChevronRight size={18} />
      </HistoryButton>
    </div>
  );
};

export default History;
