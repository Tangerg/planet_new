import React from "react";
import { motion } from "motion/react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Card, CardFlow } from "../../components/card-flow";
import PageLoading from "../../components/page-loading";
import { Tooltip } from "../../ui/tooltip";
import { useProvider } from "../../hooks/useProvider";
import { usePageCover } from "../../hooks/usePageCover";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/*  顶部过滤药丸                                                                */
/* -------------------------------------------------------------------------- */

type FilterId = "all" | "music" | "podcasts" | "audiobooks";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "podcasts", label: "Podcasts" },
  { id: "audiobooks", label: "Audiobooks" },
];

const FilterRow: React.FC<{
  active: FilterId;
  onChange: (id: FilterId) => void;
}> = ({ active, onChange }) => (
  <div className="flex items-center gap-2 px-1 pt-2 pb-6">
    {FILTERS.map((f) => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        className={cn(
          "h-9 rounded-full px-4 text-sm font-medium transition-colors",
          active === f.id
            ? "bg-white text-black"
            : "bg-white/[0.08] text-white hover:bg-white/[0.14]",
        )}
      >
        {f.label}
      </button>
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Section header                                                              */
/* -------------------------------------------------------------------------- */

const SectionNavBtn: React.FC<{
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <Tooltip content={label}>
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  </Tooltip>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-between px-1 pb-3 pt-6">
    <h2 className="font-title text-2xl font-bold tracking-tight text-white">
      {title}
    </h2>
    <div className="flex items-center gap-1">
      <SectionNavBtn label="Previous">
        <ChevronLeft size={18} />
      </SectionNavBtn>
      <SectionNavBtn label="Next">
        <ChevronRight size={18} />
      </SectionNavBtn>
      <SectionNavBtn label="More">
        <MoreHorizontal size={18} />
      </SectionNavBtn>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */

const Home: React.FC = () => {
  const provider = useProvider();
  const { data, isLoading } = useQuery({
    queryKey: ["personalized", provider.name],
    queryFn: async () => provider.personalized(),
  });
  const [filter, setFilter] = React.useState<FilterId>("all");

  // 主页没有单一封面，清掉氛围色，回到默认暗色
  usePageCover(undefined);

  if (isLoading) return <PageLoading />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full px-6 pb-12 pt-6"
    >
      <FilterRow active={filter} onChange={setFilter} />

      {/* Made For You / 推荐歌单 */}
      <SectionHeader title="Made For You" />
      <CardFlow>
        {data?.playlists?.map((playlist) => (
          <Link
            to="/playlist/$playlistId"
            params={{ playlistId: playlist.id! }}
            key={playlist.id}
          >
            <Card
              title={playlist.name!}
              thumbnail={playlist.image!}
              shape="rounded"
            />
          </Link>
        ))}
      </CardFlow>

      {/* Your favorite artists */}
      <SectionHeader title="Your favorite artists" />
      <CardFlow>
        {data?.artists?.map((ar) => (
          <Link
            to="/artist/$artistId"
            params={{ artistId: ar.id! }}
            key={ar.id}
          >
            <Card
              shape="circular"
              title={ar.name!}
              subTitle={ar.alias?.[0]}
              thumbnail={ar.image!}
            />
          </Link>
        ))}
      </CardFlow>

      {/* Albums for You */}
      <SectionHeader title="Albums for You" />
      <CardFlow>
        {data?.albums?.map((al) => (
          <Link
            to="/album/$albumId"
            params={{ albumId: al.id! }}
            key={al.id}
          >
            <Card
              title={al.name!}
              subTitle={al.artist?.name}
              thumbnail={al.image!}
            />
          </Link>
        ))}
      </CardFlow>
    </motion.div>
  );
};

export const Route = createLazyFileRoute("/home/")({ component: Home });
