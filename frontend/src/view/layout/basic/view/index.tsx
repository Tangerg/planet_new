import React from "react";
import { Outlet } from "@tanstack/react-router";

const View: React.FC = () => (
  <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-spotify">
    <Outlet />
  </div>
);

export default View;
