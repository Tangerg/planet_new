import React from "react";

interface TitleProps {
  content: string;
  action?: React.ReactNode;
}

const Title: React.FC<TitleProps> = ({ content, action }) => (
  <div className="flex items-end justify-between px-1 pt-6 pb-3">
    <h2 className="font-title text-2xl font-bold tracking-tight text-white">
      {content}
    </h2>
    {action ? (
      <div className="text-button-uppercase text-text-muted hover:text-white transition-colors cursor-pointer">
        {action}
      </div>
    ) : null}
  </div>
);

export default Title;
