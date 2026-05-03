import React from "react";
import History from "./history";
import Profile from "./profile";

const Header: React.FC = () => (
  <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 px-6 backdrop-blur-md bg-black/20">
    <History />
    <div className="flex-1" />
    <Profile />
  </header>
);

export default Header;
