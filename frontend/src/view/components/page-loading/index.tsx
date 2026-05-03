import React from "react";
import { motion } from "motion/react";

import { cn } from "../../lib/cn";

interface PageLoadingProps {
  /** 自定义提示文案，默认 "Loading" */
  label?: string;
  className?: string;
}

/**
 * 页面切换期间的占位 loading：
 *   - 4 根 accent 绿律动均衡条（音乐主题）
 *   - 下方一行 UPPERCASE 小标
 *   - 整体 motion 淡入，避免快加载时闪烁
 */
const PageLoading: React.FC<PageLoadingProps> = ({
  label = "Loading",
  className,
}) => {
  // 4 根条不同的高度序列错相位，构成"律动"
  const sequences: number[][] = [
    [10, 38, 18, 46, 14],
    [22, 14, 44, 26, 38],
    [16, 42, 12, 40, 22],
    [30, 18, 36, 14, 44],
  ];

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex h-12 items-end gap-1.5">
          {sequences.map((seq, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="block w-1.5 rounded-full bg-accent"
              animate={{ height: seq }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
        <p className="text-button-uppercase text-text-muted/80">{label}</p>
      </motion.div>
    </div>
  );
};

export default PageLoading;
