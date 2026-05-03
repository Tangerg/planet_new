import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Disc3, ListMusic, Users } from "lucide-react";

import { cn } from "../../../lib/cn";

interface CategoryRowProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  icon,
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex h-12 w-full items-center gap-3 rounded-md px-3 text-left transition-colors",
      active
        ? "bg-white/[0.06] text-white"
        : "text-text-muted hover:bg-white/[0.04] hover:text-white",
    )}
  >
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
        active ? "text-white" : "text-text-muted/80 group-hover:text-white",
      )}
    >
      {icon}
    </span>
    <span className="text-[14px] tracking-tight">{label}</span>
  </button>
);

type CategoryId = "playlists" | "albums" | "artists";

const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "playlists", label: "Playlists", icon: <ListMusic size={18} strokeWidth={2.2} /> },
  { id: "albums",    label: "Albums",    icon: <Disc3 size={18} strokeWidth={2.2} /> },
  { id: "artists",   label: "Artists",   icon: <Users size={18} strokeWidth={2.2} /> },
];

const Nav: React.FC = () => {
  const [active, setActive] = React.useState<CategoryId>("playlists");

  return (
    <nav className="flex h-full w-full flex-col">
      {/* 顶部 logo —— 点击回 home */}
      <Link to="/home" className="block px-5 pt-6 pb-8">
        <h1 className="font-title text-[28px] font-extrabold leading-none tracking-tight text-white">
          planet<span className="text-accent">.</span>
        </h1>
      </Link>

      {/* 分类列表 */}
      <div className="scrollbar-spotify flex-1 overflow-y-auto px-2 pb-4">
        {CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat.id}
            icon={cat.icon}
            label={cat.label}
            active={active === cat.id}
            onClick={() => setActive(cat.id)}
          />
        ))}
      </div>
    </nav>
  );
};

export default Nav;
