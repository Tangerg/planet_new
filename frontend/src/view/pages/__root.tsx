import { createRootRoute } from "@tanstack/react-router";
import React from "react";

import Basic from "../layout/basic";
import NowPlaying from "../layout/now-playing";

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    );

export const Route = createRootRoute({
  component: () => (
    <>
      {/* 两种顶层布局并排：Basic 是常规导航 + 路由 + 播放栏；
          NowPlaying 是全屏播放页，靠 isNowPlayingOpen 自管显隐。 */}
      <Basic />
      <NowPlaying />
      {/*<TanStackRouterDevtools/>*/}
    </>
  ),
});
