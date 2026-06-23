// Detail screens: Album, Artist, Liked Songs, Queue page
// Plus enhanced Library

const ROW_TEMPLATE = "32px 4fr 3fr 2fr 60px 60px";

const trackHeader = () => (
  <div style={{
    display: "grid", gridTemplateColumns: ROW_TEMPLATE,
    gap: 16, padding: "8px 16px",
    color: "#b3b3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: "1px solid #282828", margin: "0 24px",
  }}>
    <span style={{ textAlign: "right" }}>#</span>
    <span>Title</span>
    <span>Album</span>
    <span>Date added</span>
    <span></span>
    <span style={{ textAlign: "right" }}><I.Clock size={14}/></span>
  </div>
);

const DetailHero = ({ kind, title, description, owner, count, gradient, coverSeed, big = false, isArtist = false, listeners, verified, scrolled }) => {
  const [a, b] = gradient || ["#3b1d4a", "#1ed760"];
  return (
    <div style={{
      padding: big ? "60px 24px 24px" : "32px 24px 24px",
      background: `linear-gradient(180deg, ${a} 0%, ${b}66 80%, #121212 100%)`,
      display: "flex", gap: 24, alignItems: "flex-end",
      minHeight: big ? 360 : 280,
    }}>
      {isArtist ? (
        <Cover seed={coverSeed} size={232} radius={"50%"} style={{ boxShadow: "rgba(0,0,0,0.5) 0 8px 24px" }}/>
      ) : (
        <Cover seed={coverSeed} size={232} radius={4} style={{ boxShadow: "rgba(0,0,0,0.5) 0 8px 24px" }}/>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8, minWidth: 0 }}>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          display: "flex", alignItems: "center", gap: 6 }}>
          {verified && <I.Verified size={20} fill style={{ color: "#539df5" }}/>}
          {kind}
        </span>
        <h1 style={{
          color: "#fff", fontFamily: "var(--font-title)",
          fontSize: big ? 96 : 72, fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: "-0.03em",
        }}>{title}</h1>
        {description && <p style={{ color: "#cbcbcb", fontSize: 14, margin: "8px 0 4px", maxWidth: 720 }}>{description}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 13 }}>
          {owner && <strong>{owner}</strong>}
          {count && <span style={{ color: "#b3b3b3" }}>{owner ? " · " : ""}{count}</span>}
          {listeners && <span style={{ color: "#cbcbcb" }}>{listeners} monthly listeners</span>}
        </div>
      </div>
    </div>
  );
};

const ActionBar = ({ playing, onPlay, gradient, accent, showFollow, isFollowing, onToggleFollow }) => {
  const [a] = gradient || ["#3b1d4a"];
  return (
    <div style={{
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 24,
      background: `linear-gradient(180deg, ${a}33 0%, transparent 100%)`,
    }}>
      <button onClick={onPlay} style={{
        background: accent || "#1ed760", color: "#000",
        border: "none", borderRadius: "50%",
        width: 56, height: 56, display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "rgba(0,0,0,0.5) 0 8px 16px",
      }}>
        {playing ? <I.Pause size={22}/> : <I.Play size={22}/>}
      </button>
      <CircleBtn size={32} color="#b3b3b3" hoverColor="#fff"><I.Shuffle size={26}/></CircleBtn>
      {showFollow ? (
        <Pill variant="outline" uppercase onClick={onToggleFollow}>{isFollowing ? "Following" : "Follow"}</Pill>
      ) : (
        <CircleBtn size={32} color={accent || "#1ed760"}><I.HeartF size={32}/></CircleBtn>
      )}
      <CircleBtn size={32}><I.Download size={26}/></CircleBtn>
      <CircleBtn size={32}><I.More size={26}/></CircleBtn>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "#b3b3b3", fontSize: 14, fontWeight: 700 }}>
        <span>List</span>
        <I.List size={18}/>
      </div>
    </div>
  );
};

const TrackRow = ({ track, idx, isCurrent, isPlaying, onPlay, liked, toggleLike, accent, showAlbum = true }) => {
  const [hover, setHover] = React.useState(false);
  const showPlay = hover || isCurrent;
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onDoubleClick={() => onPlay(track)}
      style={{
        display: "grid", gridTemplateColumns: ROW_TEMPLATE,
        gap: 16, padding: "8px 16px", borderRadius: 4, alignItems: "center",
        background: hover ? "#2a2a2a" : "transparent",
      }}>
      <span style={{ color: isCurrent ? (accent || "#1ed760") : "#b3b3b3", fontSize: 14, textAlign: "right" }}>
        {showPlay ? (
          isCurrent && isPlaying ? <NowPlayingDot size={14}/>
          : <span onClick={() => onPlay(track)} style={{ cursor: "pointer", color: "#fff" }}><I.Play size={14}/></span>
        ) : (idx + 1)}
      </span>
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
        <Cover seed={track.coverSeed} size={40} radius={3}/>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
          <span style={{ color: "#b3b3b3", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</span>
        </div>
      </div>
      <span style={{ color: "#b3b3b3", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{showAlbum ? track.album : (track.plays || "")}</span>
      <span style={{ color: "#b3b3b3", fontSize: 13 }}>{track.added}</span>
      <span style={{ display: "flex", justifyContent: "center" }}>
        <CircleBtn size={28}
          color={liked ? (accent || "#1ed760") : (hover ? "#fff" : "transparent")}
          hoverColor={liked ? (accent || "#1ed760") : "#fff"}
          onClick={() => toggleLike(track.id)}>
          {liked ? <I.HeartF size={16}/> : <I.Heart size={16}/>}
        </CircleBtn>
      </span>
      <span style={{ color: "#b3b3b3", fontSize: 13, textAlign: "right" }}>{track.duration}</span>
    </div>
  );
};

// ---------- Album screen ----------
const AlbumScreen = ({ album, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent, onArtist }) => {
  const totalSec = album.tracks.reduce((s, t) => s + (t.durSec || 200), 0);
  const totalMin = Math.floor(totalSec / 60);
  return (
    <div>
      <DetailHero
        kind={`Album · ${album.year}`}
        title={album.name}
        owner={album.artist}
        count={`${album.tracks.length} songs, ${totalMin} min`}
        gradient={album.gradient}
        coverSeed={album.coverSeed}
      />
      <ActionBar playing={playing && current?.albumId === album.id}
        gradient={album.gradient} accent={accent}
        onPlay={() => {
          if (current?.albumId === album.id) setPlaying(!playing);
          else onPlay({ ...album.tracks[0], playlistId: album.id });
        }}/>
      {trackHeader()}
      <div style={{ padding: "8px 24px 24px" }}>
        {album.tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} idx={i}
            isCurrent={current?.id === t.id} isPlaying={playing}
            onPlay={(track) => onPlay({ ...track, playlistId: album.id })}
            liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
        ))}
      </div>
    </div>
  );
};

// ---------- Artist screen ----------
const ArtistScreen = ({ artist, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent, onAlbum }) => {
  const albumsByArtist = MOCK.albums.filter(a => a.artistId === artist.id);
  const popular = MOCK.allTracks
    ? MOCK.allTracks.filter(t => t.artistId === artist.id).slice(0, 5)
    : (MOCK.data.allTracks || []).filter(t => t.artistId === artist.id).slice(0, 5);
  const isFollowingState = React.useState(true);
  const [following, setFollowing] = isFollowingState;
  return (
    <div>
      <DetailHero
        kind="Artist" verified={artist.verified}
        title={artist.name}
        listeners={artist.listeners}
        gradient={artist.gradient}
        coverSeed={artist.coverSeed}
        isArtist big
      />
      <ActionBar playing={playing && current?.artistId === artist.id}
        gradient={artist.gradient} accent={accent}
        showFollow isFollowing={following} onToggleFollow={() => setFollowing(!following)}
        onPlay={() => {
          if (current?.artistId === artist.id) setPlaying(!playing);
          else if (popular.length) onPlay({ ...popular[0], playlistId: artist.id });
        }}/>
      <div style={{ padding: "8px 24px 32px" }}>
        <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 24, fontWeight: 700, margin: "16px 0 12px", letterSpacing: "-0.01em" }}>Popular</h2>
        {popular.map((t, i) => (
          <PopularRow key={t.id} track={t} idx={i}
            isCurrent={current?.id === t.id} isPlaying={playing}
            onPlay={(track) => onPlay({ ...track, playlistId: artist.id })}
            liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
        ))}

        <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 24, fontWeight: 700, margin: "32px 0 12px", letterSpacing: "-0.01em" }}>Discography</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {albumsByArtist.map((al) => (
            <div key={al.id} onClick={() => onAlbum(al.id)}
              style={{
                background: "#181818", borderRadius: 8, padding: 16,
                display: "flex", flexDirection: "column", gap: 12, cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#181818"}>
              <Cover seed={al.coverSeed} size="100%"/>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{al.name}</div>
                <div style={{ color: "#b3b3b3", fontSize: 13 }}>{al.year} · Album</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 24, fontWeight: 700, margin: "32px 0 12px", letterSpacing: "-0.01em" }}>About</h2>
        <div style={{
          background: "#181818", borderRadius: 8, padding: 20,
          display: "flex", gap: 20, alignItems: "flex-start",
        }}>
          <Cover seed={artist.coverSeed + 2} size={160} radius={6}/>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{artist.listeners}</div>
            <div style={{ color: "#b3b3b3", fontSize: 13, marginBottom: 16 }}>Monthly Listeners</div>
            <p style={{ color: "#cbcbcb", fontSize: 14, lineHeight: 1.5, maxWidth: 640, margin: 0 }}>{artist.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PopularRow = ({ track, idx, isCurrent, isPlaying, onPlay, liked, toggleLike, accent }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onDoubleClick={() => onPlay(track)}
      style={{
        display: "grid", gridTemplateColumns: "32px 56px 1fr 1fr 60px 60px",
        gap: 16, padding: "8px 16px", borderRadius: 4, alignItems: "center",
        background: hover ? "#2a2a2a" : "transparent",
      }}>
      <span style={{ color: isCurrent ? (accent || "#1ed760") : "#b3b3b3", fontSize: 14, textAlign: "right" }}>
        {(hover || isCurrent) ? (
          isCurrent && isPlaying ? <NowPlayingDot size={14}/>
          : <span onClick={() => onPlay(track)} style={{ cursor: "pointer", color: "#fff" }}><I.Play size={14}/></span>
        ) : (idx + 1)}
      </span>
      <Cover seed={track.coverSeed} size={40} radius={3}/>
      <span style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
      <span style={{ color: "#b3b3b3", fontSize: 13 }}>{track.plays}</span>
      <span style={{ display: "flex", justifyContent: "center" }}>
        <CircleBtn size={28}
          color={liked ? (accent || "#1ed760") : (hover ? "#fff" : "transparent")}
          hoverColor={liked ? (accent || "#1ed760") : "#fff"}
          onClick={() => toggleLike(track.id)}>
          {liked ? <I.HeartF size={16}/> : <I.Heart size={16}/>}
        </CircleBtn>
      </span>
      <span style={{ color: "#b3b3b3", fontSize: 13, textAlign: "right" }}>{track.duration}</span>
    </div>
  );
};

// ---------- Liked Songs screen ----------
const LikedSongsScreen = ({ tracks, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent }) => {
  const total = tracks.length;
  const min = tracks.reduce((s, t) => s + (t.durSec || 200), 0);
  return (
    <div>
      <div style={{
        padding: "60px 24px 24px",
        background: "linear-gradient(180deg, #4a3aa6 0%, #5b4ec1aa 60%, #121212 100%)",
        display: "flex", gap: 24, alignItems: "flex-end",
        minHeight: 360,
      }}>
        <div style={{
          width: 232, height: 232, borderRadius: 4,
          background: "linear-gradient(135deg, #4a3aa6 0%, #cbcbcb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "rgba(0,0,0,0.5) 0 8px 24px",
        }}>
          <I.HeartF size={88} fill style={{ color: "#fff" }}/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Playlist</span>
          <h1 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 96, fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: "-0.03em" }}>Liked Songs</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 13, marginTop: 8 }}>
            <strong>Lily</strong>
            <span style={{ color: "#b3b3b3" }}>· {total} songs, {Math.floor(min/60)} hr {Math.round((min/60 - Math.floor(min/60))*60)} min</span>
          </div>
        </div>
      </div>
      <ActionBar playing={playing && current?.playlistId === "liked"}
        gradient={["#4a3aa6", "#cbcbcb"]} accent={accent}
        onPlay={() => {
          if (tracks.length === 0) return;
          if (current?.playlistId === "liked") setPlaying(!playing);
          else onPlay({ ...tracks[0], playlistId: "liked" });
        }}/>
      {trackHeader()}
      <div style={{ padding: "8px 24px 24px" }}>
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} idx={i}
            isCurrent={current?.id === t.id} isPlaying={playing}
            onPlay={(track) => onPlay({ ...track, playlistId: "liked" })}
            liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
        ))}
        {tracks.length === 0 && (
          <div style={{ color: "#b3b3b3", padding: 40, textAlign: "center" }}>
            Songs you like will appear here. Search for something you like.
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Library screen ----------
const LibraryScreen = ({ playlists, albums, artists, setActive, accent }) => {
  const [filter, setFilter] = React.useState("All");
  const [view, setView] = React.useState("grid"); // grid | list
  const [sort, setSort] = React.useState("Recents");

  const items = React.useMemo(() => {
    let xs = [];
    if (filter === "All" || filter === "Playlists") {
      xs = xs.concat(playlists.map(p => ({
        ...p, _kind: "Playlist", _coverShape: 4,
        _onClick: () => setActive("playlist:" + p.id),
      })));
    }
    if (filter === "All" || filter === "Albums") {
      xs = xs.concat(albums.map(a => ({
        ...a, _kind: `Album · ${a.artist}`, _coverShape: 4,
        _onClick: () => setActive("album:" + a.id),
      })));
    }
    if (filter === "All" || filter === "Artists") {
      xs = xs.concat(artists.map(a => ({
        ...a, _kind: "Artist", _coverShape: "50%",
        _onClick: () => setActive("artist:" + a.id),
      })));
    }
    return xs;
  }, [filter, playlists, albums, artists]);

  const filters = ["All", "Playlists", "Albums", "Artists", "Downloaded"];

  return (
    <div style={{ padding: "0 24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 16px" }}>
        <h1 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Your Library</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill variant="dark" onClick={() => {}}>+ New playlist</Pill>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "#fff" : "#1f1f1f",
              color: filter === f ? "#000" : "#fff",
              border: "none", padding: "6px 14px", borderRadius: 9999,
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)",
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CircleBtn size={32}><I.Search size={16}/></CircleBtn>
          <div style={{ color: "#b3b3b3", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span>{sort}</span>
            <CircleBtn size={28}>{view === "grid" ? <I.Grid size={16}/> : <I.List size={16}/>}</CircleBtn>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {items.map((it) => (
            <div key={it.id + it._kind} onClick={it._onClick}
              style={{
                background: "#181818", borderRadius: 8, padding: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 12, transition: "background 200ms",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#181818"}>
              <Cover seed={it.coverSeed || 0} size="100%" radius={it._coverShape}/>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                <div style={{ color: "#b3b3b3", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it._kind}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((it) => (
            <div key={it.id + it._kind} onClick={it._onClick}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: 8, borderRadius: 4, cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <Cover seed={it.coverSeed || 0} size={56} radius={it._coverShape}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                <div style={{ color: "#b3b3b3", fontSize: 13 }}>{it._kind}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.AlbumScreen = AlbumScreen;
window.ArtistScreen = ArtistScreen;
window.LikedSongsScreen = LikedSongsScreen;
window.LibraryScreen = LibraryScreen;
window.TrackRow = TrackRow;
window.trackHeader = trackHeader;
