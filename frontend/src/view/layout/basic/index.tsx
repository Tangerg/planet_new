import React from "react";

import CoverAmbientBg from "../../components/cover-ambient-bg";
import useAppStore from "../../store/app";
import Header from "./header";
import Nav from "./nav";
import Player from "./player";
import Queue from "./queue";
import View from "./view";

const Basic: React.FC = () => {
  const coverImage = useAppStore.use.coverImage();
  return (
    <main className="h-screen w-screen overflow-hidden bg-base text-white font-ui">
      {/* 全窗封面氛围色 —— 由当前页通过 usePageCover 设置 */}
      <CoverAmbientBg image={coverImage} className="flex h-full w-full flex-col">
        <div className="grid h-full w-full grid-cols-[300px_1fr] grid-rows-[1fr_auto]">
          <aside className="col-start-1 row-span-1 row-start-1 min-h-0 overflow-hidden">
            <Nav />
          </aside>
          <section className="col-start-2 row-span-1 row-start-1 flex min-h-0 flex-col overflow-hidden">
            <Header />
            <View />
          </section>
          <footer className="col-span-2 row-start-2">
            <Player />
          </footer>
        </div>
      </CoverAmbientBg>
      <Queue />
    </main>
  );
};

export default Basic;
