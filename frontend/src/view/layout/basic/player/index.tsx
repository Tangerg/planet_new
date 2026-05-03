import React from "react";
import Meta from "./meta";
import Control from "./control";
import Action from "./action";

/**
 * 底部播放栏。bg 用半透明黑 + backdrop-blur，让全局封面氛围色透出，
 * 同时和上面的内容区有视觉分层。
 */
const Player: React.FC = () => (
  <div className="select-none w-full border-t border-white/5 bg-black/30 px-4 py-3 backdrop-blur-md">
    <div className="flex w-full items-center justify-between gap-4 min-w-[620px]">
      <div className="w-[30%] min-w-[180px]">
        <Meta />
      </div>
      <div className="w-[40%] max-w-[722px]">
        <Control />
      </div>
      <div className="flex w-[30%] min-w-[180px] items-center justify-end">
        <Action />
      </div>
    </div>
  </div>
);

export default Player;
