import React from "react";
import type { ArtistRef } from "@/model/vibe";
import { artistCreditLine } from "@/model/artist-credit";
import { Button } from "@/components/controls/Button";
import { activateOnKey } from "@/lib/keys";
import { useAccent } from "@/hooks/accent";

type ArtistLinkStyle = React.CSSProperties & {
  "--alink-rest"?: string;
  "--alink-hover"?: string;
};

type ArtistLinkProps = {
  name?: string;
  artistId?: string;
  color: string;
  onOpenArtist?: (artist: ArtistRef) => void;
  style?: ArtistLinkStyle;
};

export function ArtistLink({ name, artistId, color, onOpenArtist, style }: ArtistLinkProps) {
  const accent = useAccent();
  if (!(onOpenArtist && artistId)) return <>{name ?? ""}</>;
  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onOpenArtist({ id: artistId, name: name ?? "" });
  };
  return (
    <Button
      className="alink p-0 text-left transition-colors duration-200"
      style={{ font: "inherit", "--alink-rest": color, "--alink-hover": accent, ...style }}
      onClick={open}
      onKeyDown={activateOnKey(open)}
    >
      {name}
    </Button>
  );
}

type ArtistLinksProps = {
  artists?: ArtistRef[];
  fallback?: string;
  fallbackId?: string;
  color: string;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function ArtistLinks({
  artists,
  fallback,
  fallbackId,
  color,
  onOpenArtist,
}: ArtistLinksProps) {
  const creditLine = artistCreditLine({ artists, fallback, fallbackId });
  if (creditLine.kind === "fallback-artist") {
    return (
      <ArtistLink
        name={creditLine.name}
        artistId={creditLine.artistId}
        color={color}
        onOpenArtist={onOpenArtist}
      />
    );
  }
  return (
    <>
      {creditLine.artists.map((a, i) => (
        <React.Fragment key={(a.id || a.name) + i}>
          {i > 0 && <span style={{ color }}>, </span>}
          <ArtistLink name={a.name} artistId={a.id} color={color} onOpenArtist={onOpenArtist} />
        </React.Fragment>
      ))}
    </>
  );
}
