import { useEffect } from "react";
import useAppStore from "../store/app";

/**
 * 页面用此 hook 声明自己的"主封面图"。
 * 该值会被 basic 布局根级的 CoverAmbientBg 读取，让封面氛围色铺满整窗（侧栏/内容/底栏一起染色）。
 *
 * 用法：
 *   - 详情页（playlist/album 等）：`usePageCover(data?.image)`，封面加载后立刻设上。
 *   - 普通列表页（home 等）：`usePageCover(undefined)`，明确清掉，避免上一页 cover 残留。
 */
export function usePageCover(image: string | undefined): void {
  const setCoverImage = useAppStore.use.setCoverImage();
  useEffect(() => {
    setCoverImage(image);
  }, [image, setCoverImage]);
}
