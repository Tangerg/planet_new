// MD3 Detail screens — Album, Artist, Liked, Playlist (used by main HTML)
// Tonal surfaces, large display headlines, FAB-pattern play button.

const M3DetailHero = ({ kind, title, description, owner, count, gradient, coverSeed, accentColor }) => (
  <div style={{
    padding: "32px 32px 24px",
    background: `linear-gradient(180deg, ${gradient || "var(--m3-surface-mid)"} 0%, var(--m3-surface) 100%)`,
    borderRadius: "var(--shape-xl) var(--shape-xl) 0 0",
    display: "flex", alignItems: "flex-end", gap: 24,
  }}>
    <Cover seed={coverSeed} size={232} radius={28} style={{ boxShadow: "0 16px 48px rgba(0,0,0,.5)" }}/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
      <span className="m-label-m">{kind}</span>
      <h1 className="m-display-l" style={{ margin: 0, color: "var(--m3-on-surface)", letterSpacing: "-1.5px" }}>{title}</h1>
      {description && <p className="m-body-m" style={{ margin: 0, maxWidth: 720 }}>{description}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {owner && <span style={{ font: "var(--type-title-s)", color: "var(--m3-on-surface)" }}>{owner}</span>}
        {count && <span style={{ font: "var(--type-body-m)", color: "var(--m3-on-surface-var)" }}> · {count}</span>}
      </div>
    </div>
  </div>
);

const M3ActionBar = ({ playing, onPlay, accent }) => (
  <div style={{
    padding: "24px 32px",
    display: "flex", alignItems: "center", gap: 16,
    background: "var(--m3-surface)",
  }}>
    <button className="m-fab large" onClick={onPlay}
      style={{ width: 96, height: 96, borderRadius: 28, background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
      <span className="msym fill" style={{ fontSize: 44 }}>{playing ? "pause" : "play_arrow"}</span>
    </button>
    <button className="m-icon-btn" style={{ width: 48, height: 48 }} title="Save">
      <span className="msym" style={{ fontSize: 28 }}>add_circle</span>
    </button>
    <button className="m-icon-btn" style={{ width: 48, height: 48 }} title="Download">
      <span className="msym" style={{ fontSize: 28 }}>download</span>
    </button>
    <button className="m-icon-btn" style={{ width: 48, height: 48 }} title="More">
      <span className="msym" style={{ fontSize: 28 }}>more_horiz</span>
    </button>
    <div style={{ flex: 1 }}/>
    <div className="m-seg">
      <button data-selected="1"><span className="msym s20">view_list</span> List</button>
      <button><span className="msym s20">grid_view</span> Compact</button>
    </div>
  </div>
);

const M3TrackRow = ({ track, idx, isCurrent, isPlaying, onPlay, liked, toggleLike, accent }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div className="track-row"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => onPlay(track)}
      style={{
        display: "grid", gridTemplateColumns: "40px 1fr 1fr auto auto auto",
        gap: 16, padding: "8px 16px", borderRadius: "var(--shape-md)",
        alignItems: "center", cursor: "pointer",
        background: hover ? "var(--m3-surface-mid)" : "transparent",
        color: isCurrent ? "var(--m3-primary)" : "var(--m3-on-surface)",
      }}>
      <div style={{ textAlign: "center", color: "var(--m3-on-surface-var)" }}>
        {hover ? (
          <span className="msym fill" style={{ color: "var(--m3-on-surface)" }}>{isCurrent && isPlaying ? "pause" : "play_arrow"}</span>
        ) : isCurrent && isPlaying ? (
          <span className="msym fill" style={{ color: "var(--m3-primary)", fontSize: 20 }}>graphic_eq</span>
        ) : (
          <span style={{ font: "var(--type-body-m)" }}>{idx + 1}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Cover seed={track.coverSeed} size={40} radius={8}/>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ font: "var(--type-title-s)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
          <span style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</span>
        </div>
      </div>
      <span style={{ font: "var(--type-body-m)", color: "var(--m3-on-surface-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.album}</span>
      <span style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)" }}>{track.plays || ""}</span>
      <button className="m-icon-btn" onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
        style={{ opacity: hover || liked ? 1 : 0 }} data-toggled={liked ? "1" : "0"}>
        <span className={"msym s20" + (liked ? " fill" : "")}>{liked ? "favorite" : "favorite_border"}</span>
      </button>
      <span style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)", minWidth: 36, textAlign: "right" }}>{track.duration}</span>
    </div>
  );
};

const M3TrackHeader = () => (
  <div style={{
    display: "grid", gridTemplateColumns: "40px 1fr 1fr auto auto auto",
    gap: 16, padding: "8px 16px",
    borderBottom: "1px solid var(--m3-outline-variant)",
    margin: "0 32px 8px",
    font: "var(--type-label-m)", color: "var(--m3-on-surface-var)",
    letterSpacing: "0.5px", textTransform: "uppercase",
  }}>
    <span style={{ textAlign: "center" }}>#</span>
    <span>Title</span>
    <span>Album</span>
    <span style={{ minWidth: 80 }}>Plays</span>
    <span style={{ width: 40 }}/>
    <span style={{ textAlign: "right", minWidth: 36 }}>
      <span className="msym s20">schedule</span>
    </span>
  </div>
);

const M3PlaylistScreen = ({ playlist, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent }) => (
  <div>
    <M3DetailHero kind={playlist.kind || "PLAYLIST"} title={playlist.name}
      description={playlist.description}
      owner={playlist.owner}
      count={`${playlist.tracks.length} songs · ${Math.round(playlist.tracks.length * 3.5)} min`}
      gradient={playlist.gradient} coverSeed={playlist.coverSeed}/>
    <M3ActionBar playing={playing && current?.playlistId === playlist.id}
      accent={accent}
      onPlay={() => {
        if (current?.playlistId === playlist.id) setPlaying(!playing);
        else onPlay({ ...playlist.tracks[0], playlistId: playlist.id });
      }}/>
    <M3TrackHeader/>
    <div style={{ padding: "0 32px 32px" }}>
      {playlist.tracks.map((t, i) => (
        <M3TrackRow key={t.id} track={t} idx={i}
          isCurrent={current?.id === t.id} isPlaying={playing}
          onPlay={(track) => onPlay({ ...track, playlistId: playlist.id })}
          liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
      ))}
    </div>
  </div>
);

const M3AlbumScreen = ({ album, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent, onArtist }) => (
  <div>
    <M3DetailHero kind="ALBUM" title={album.name}
      owner={album.artist}
      count={`${album.year} · ${album.tracks.length} songs`}
      gradient={album.gradient} coverSeed={album.coverSeed}/>
    <M3ActionBar playing={playing && current?.playlistId === album.id}
      accent={accent}
      onPlay={() => {
        if (current?.playlistId === album.id) setPlaying(!playing);
        else onPlay({ ...album.tracks[0], playlistId: album.id });
      }}/>
    <M3TrackHeader/>
    <div style={{ padding: "0 32px 32px" }}>
      {album.tracks.map((t, i) => (
        <M3TrackRow key={t.id} track={{ ...t, album: album.name }} idx={i}
          isCurrent={current?.id === t.id} isPlaying={playing}
          onPlay={(track) => onPlay({ ...track, playlistId: album.id })}
          liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
      ))}
    </div>
  </div>
);

const M3ArtistScreen = ({ artist, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent, onAlbum }) => (
  <div>
    <div style={{
      padding: "48px 32px 24px",
      background: `linear-gradient(180deg, ${artist.gradient || "var(--m3-tertiary-container)"} 0%, var(--m3-surface) 100%)`,
      display: "flex", alignItems: "flex-end", gap: 24,
    }}>
      <Cover seed={artist.coverSeed} size={232} radius="50%" style={{ boxShadow: "0 16px 48px rgba(0,0,0,.5)" }}/>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span className="msym fill s20" style={{ color: "var(--m3-primary)" }}>verified</span>
          <span className="m-label-m">VERIFIED ARTIST</span>
        </div>
        <h1 className="m-display-l" style={{ margin: 0, letterSpacing: "-2px" }}>{artist.name}</h1>
        <p className="m-body-m" style={{ marginTop: 12 }}>{(artist.monthlyListeners || "12,481,902")} monthly listeners</p>
      </div>
    </div>
    <div style={{ padding: "24px 32px", display: "flex", gap: 12, alignItems: "center", background: "var(--m3-surface)" }}>
      <button className="m-fab large" onClick={() => onPlay({ ...artist.topTracks[0], playlistId: artist.id })}>
        <span className="msym fill" style={{ fontSize: 44 }}>{playing && current?.playlistId === artist.id ? "pause" : "play_arrow"}</span>
      </button>
      <button className="m-btn" data-variant="outlined">Follow</button>
      <button className="m-icon-btn" style={{ width: 48, height: 48 }}><span className="msym">more_horiz</span></button>
    </div>

    <section style={{ padding: "0 32px 32px" }}>
      <h2 className="m-headline-s" style={{ margin: "16px 0" }}>Popular</h2>
      <div>
        {artist.topTracks.map((t, i) => (
          <M3TrackRow key={t.id} track={t} idx={i}
            isCurrent={current?.id === t.id} isPlaying={playing}
            onPlay={(track) => onPlay({ ...track, playlistId: artist.id })}
            liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
        ))}
      </div>
    </section>

    {artist.discography && (
      <section style={{ padding: "0 32px 32px" }}>
        <h2 className="m-headline-s" style={{ margin: "16px 0" }}>Discography</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {artist.discography.map(al => (
            <div key={al.id} className="m-card hoverable" onClick={() => onAlbum(al.id)}>
              <Cover seed={al.coverSeed} size="100%" radius={20}/>
              <div style={{ marginTop: 12 }}>
                <div style={{ font: "var(--type-title-m)" }}>{al.name}</div>
                <div className="m-body-s" style={{ marginTop: 4 }}>{al.year} · Album</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>
);

const M3LikedSongsScreen = ({ tracks, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent }) => (
  <div>
    <div style={{
      padding: "32px", display: "flex", alignItems: "flex-end", gap: 24,
      background: "linear-gradient(180deg, var(--m3-primary-container) 0%, var(--m3-surface) 100%)",
    }}>
      <div style={{
        width: 232, height: 232, borderRadius: 28,
        background: "linear-gradient(135deg, var(--m3-primary), var(--m3-tertiary))",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 16px 48px rgba(0,0,0,.5)",
      }}>
        <span className="msym fill" style={{ fontSize: 96, color: "var(--m3-on-primary)" }}>favorite</span>
      </div>
      <div style={{ flex: 1 }}>
        <span className="m-label-m">PLAYLIST</span>
        <h1 className="m-display-l" style={{ margin: "12px 0", letterSpacing: "-1.5px" }}>Liked Songs</h1>
        <p className="m-body-m" style={{ margin: 0 }}>{tracks.length} songs you've loved · auto-updated</p>
      </div>
    </div>
    <M3ActionBar playing={playing && current?.playlistId === "liked"}
      accent={accent}
      onPlay={() => {
        if (tracks.length === 0) return;
        if (current?.playlistId === "liked") setPlaying(!playing);
        else onPlay({ ...tracks[0], playlistId: "liked" });
      }}/>
    <M3TrackHeader/>
    <div style={{ padding: "0 32px 32px" }}>
      {tracks.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--m3-on-surface-var)" }}>
          <span className="msym s48" style={{ display: "block", marginBottom: 16 }}>favorite_border</span>
          <p className="m-body-l">Songs you like appear here</p>
        </div>
      ) : tracks.map((t, i) => (
        <M3TrackRow key={t.id} track={t} idx={i}
          isCurrent={current?.id === t.id} isPlaying={playing}
          onPlay={(track) => onPlay({ ...track, playlistId: "liked" })}
          liked={true} toggleLike={toggleLike} accent={accent}/>
      ))}
    </div>
  </div>
);

const M3LibraryScreen = ({ playlists, albums, artists, setActive, accent }) => {
  const [view, setView] = React.useState("grid");
  const [filter, setFilter] = React.useState("All");
  const filters = ["All", "Playlists", "Albums", "Artists"];

  let items = [];
  if (filter === "All" || filter === "Playlists") items = items.concat(playlists.map(p => ({ ...p, type: "playlist" })));
  if (filter === "All" || filter === "Albums")    items = items.concat(albums.map(a => ({ ...a, type: "album" })));
  if (filter === "All" || filter === "Artists")   items = items.concat(artists.map(a => ({ ...a, type: "artist" })));

  return (
    <div style={{ padding: "8px 32px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 24px" }}>
        <h1 className="m-display-m" style={{ margin: 0 }}>Your library</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="m-icon-btn"><span className="msym">search</span></button>
          <button className="m-btn" data-variant="tonal"><span className="msym s20">add</span> New</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {filters.map(f => (
          <button key={f} className="m-chip" data-selected={filter === f ? "1" : "0"} onClick={() => setFilter(f)}>
            {filter === f && <span className="msym s20">check</span>}
            {f}
          </button>
        ))}
      </div>
      <div style={{ display: view === "grid" ? "grid" : "flex",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        flexDirection: "column", gap: view === "grid" ? 16 : 4 }}>
        {items.map(item => (
          <div key={item.type + item.id} className="m-card hoverable"
            onClick={() => setActive(item.type === "album" ? "album:" + item.id
              : item.type === "artist" ? "artist:" + item.id : "playlist:" + item.id)}
            style={{ display: "flex", flexDirection: view === "grid" ? "column" : "row",
              alignItems: view === "grid" ? "stretch" : "center", gap: 12 }}>
            <Cover seed={item.coverSeed} size={view === "grid" ? "100%" : 56}
              radius={item.type === "artist" ? "50%" : 20}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: "var(--type-title-m)" }}>{item.name}</div>
              <div className="m-body-s" style={{ marginTop: 4 }}>
                {item.type === "playlist" ? `Playlist · ${item.owner || "You"}` :
                 item.type === "album" ? `Album · ${item.artist}` : "Artist"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const M3SearchScreen = ({ query, data, onPlay, currentId, playing, accent, onOpenAlbum, onOpenArtist }) => {
  if (!query) {
    return (
      <div style={{ padding: "8px 32px 32px" }}>
        <h2 className="m-headline-s" style={{ margin: "16px 0 24px" }}>Browse all</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {MOCK.genres.map(([name, color], i) => (
            <div key={name} className="m-card hoverable" style={{
              background: color, height: 180, padding: 24,
              position: "relative", overflow: "hidden",
              borderRadius: 28, color: "#fff",
            }}>
              <span className="m-headline-m" style={{ fontSize: 28, lineHeight: 1.1 }}>{name}</span>
              <div style={{
                position: "absolute", right: -16, bottom: -16,
                width: 100, height: 100, borderRadius: 12,
                background: `linear-gradient(135deg, ${color}, #000)`,
                transform: "rotate(25deg)",
              }}/>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = query.toLowerCase();
  const tracks = data.allTracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  const top = tracks[0];

  return (
    <div style={{ padding: "0 32px 32px" }}>
      {top && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 32 }}>
          <div>
            <h2 className="m-headline-s" style={{ margin: "8px 0 16px" }}>Top result</h2>
            <div className="m-card hoverable" onClick={() => onOpenArtist(top.artistId)}
              style={{ height: 240, position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
              <Cover seed={top.coverSeed} size={92} radius={20}/>
              <div>
                <div className="m-headline-s" style={{ marginBottom: 4 }}>{top.title}</div>
                <div className="m-body-m">Song · {top.artist}</div>
              </div>
              <button className="m-icon-btn" data-variant="filled"
                onClick={(e) => { e.stopPropagation(); onPlay(top); }}
                style={{ position: "absolute", right: 16, bottom: 16, width: 56, height: 56,
                  background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
                <span className="msym fill" style={{ fontSize: 28 }}>play_arrow</span>
              </button>
            </div>
          </div>
          <div>
            <h2 className="m-headline-s" style={{ margin: "8px 0 16px" }}>Songs</h2>
            <div>
              {tracks.slice(0, 4).map((t, i) => (
                <M3TrackRow key={t.id} track={t} idx={i}
                  isCurrent={currentId === t.id} isPlaying={playing}
                  onPlay={onPlay}
                  liked={false} toggleLike={() => {}} accent={accent}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  M3DetailHero, M3ActionBar, M3TrackRow, M3TrackHeader,
  M3PlaylistScreen, M3AlbumScreen, M3ArtistScreen, M3LikedSongsScreen,
  M3LibraryScreen, M3SearchScreen,
});
