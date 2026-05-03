import React from "react";
import { cn } from "../../lib/cn";

interface VinylProps {
  image?: string;
  spinning: boolean;
  size?: number;
  className?: string;
}

/**
 * 极简"黑胶"——其实就是会转的圆形封面：
 *   - 极淡同心 grooves（暗示黑胶质感）
 *   - 中央封面占 78% 直径
 *   - 中心黑色轴心作为点睛
 * 没有拨片臂、没有 conic 反光，克制干净，匹配 Spotify 风格。
 */
export const Vinyl: React.FC<VinylProps> = ({
  image,
  spinning,
  size = 360,
  className,
}) => {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* 外圈底盘（不旋转）—— 提供 shadow + ring */}
      <div className="absolute inset-0 rounded-full bg-[#0a0a0a] shadow-dialog ring-1 ring-white/5" />

      {/* 旋转部分：grooves + 封面 */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          animation: "spin-vinyl 22s linear infinite",
          animationPlayState: spinning ? "running" : "paused",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at center, rgba(255,255,255,0.03) 0 1px, rgba(0,0,0,0) 1px 7px)",
          }}
        />
        <div
          className="absolute overflow-hidden rounded-full ring-2 ring-black/60"
          style={{
            top: "50%",
            left: "50%",
            width: size * 0.78,
            height: size * 0.78,
            transform: "translate(-50%, -50%)",
          }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-surface-3 to-surface-2" />
          )}
        </div>
      </div>

      {/* 中心轴心（不随旋转，独立层）*/}
      <div
        aria-hidden
        className="absolute rounded-full bg-[#0a0a0a] ring-2 ring-white/10"
        style={{
          top: "50%",
          left: "50%",
          width: size * 0.045,
          height: size * 0.045,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
};

export default Vinyl;
