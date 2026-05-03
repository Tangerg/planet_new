import React from "react";
import { cn } from "../../lib/cn";

interface CoverAmbientBgProps {
  /** 用作氛围色源的封面图 URL */
  image?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 容器额外样式（root 始终是 relative） */
  className?: string;
  /** 整体氛围浓度（默认 0.45） */
  imageOpacity?: number;
}

/**
 * 用封面作为整页氛围色背景：
 *   - 图片层：scale 1.5 + blur 120px，overflow-hidden 裁掉羽化区，避免边缘伪影
 *   - 暗化层：上轻下重的微渐变暗化罩，**永远不到纯 base**——封面色调贯穿整页
 *
 * 使用场景：NowPlaying 全屏页、playlist/album 详情页等需要"沉浸到这首曲目色调"的页面。
 * 容器是 relative，children 默认走正常文档流；如需让 children 在背景之上请确保自己有非 -z-* 的 z-index。
 */
export const CoverAmbientBg: React.FC<CoverAmbientBgProps> = ({
  image,
  children,
  className,
  imageOpacity = 0.45,
}) => (
  // `isolate` 强制创建 stacking context，否则 -z-* 层会"逃逸"到外层
  // 父级（如 basic 布局的 section gradient）的下方，看起来就像没渲染。
  <div className={cn("relative isolate", className)}>
    {image && (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${image}")`,
            filter: "blur(120px) saturate(1.4)",
            transform: "scale(1.5)",
            opacity: imageOpacity,
          }}
        />
      </div>
    )}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/25 to-black/55"
    />
    {children}
  </div>
);

export default CoverAmbientBg;
