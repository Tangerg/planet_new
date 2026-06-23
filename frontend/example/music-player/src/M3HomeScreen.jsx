// MD3 Home — tonal cards, expressive headlines, FAB-like quick-tiles
const M3HomeScreen = ({ data, onPlay, currentId, playing, accent,
  onOpenPlaylist, onOpenAlbum, onOpenArtist, onOpenLiked }) => {

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // Quick tiles — large MD3 hero card row.
  // data.quick items are descriptors (id/title/subtitle/coverSeed); pair with real tracks for play.
  const quick = (data.quick || []).slice(0, 8).map((q, i) => {
    const t = data.allTracks[i % data.allTracks.length];
    return { id: q.id, title: q.title, coverSeed: q.coverSeed, ...t, _tileTitle: q.title };
  });

  return (
    <div style={{ padding: "8px 32px 32px" }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "12px 0 24px" }}>
        <div>
          <h1 className="m-display-m" style={{ margin: 0, color: "var(--m3-on-surface)" }}>{greeting}</h1>
          <p className="m-body-m" style={{ margin: "8px 0 0" }}>Here's what we lined up for you</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="m-chip" data-selected="1">All</button>
          <button className="m-chip">Music</button>
          <button className="m-chip">Podcasts</button>
        </div>
      </div>

      {/* Quick tiles grid — 4×2 tonal pills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {quick.map((t, i) => {
          const isCurrent = currentId === t.id;
          const tones = [
            ["var(--m3-primary-container)", "var(--m3-on-pc)"],
            ["var(--m3-secondary-container)", "var(--m3-on-sc)"],
            ["var(--m3-tertiary-container)", "var(--m3-on-tc)"],
            ["var(--m3-surface-high)", "var(--m3-on-surface)"],
          ];
          const [bg, fg] = tones[i % 4];
          return (
            <div key={t.id} onClick={() => onPlay(t)}
              className="m-card hoverable"
              style={{
                background: bg, color: fg, padding: 0,
                display: "flex", alignItems: "center", overflow: "hidden",
                height: 80, gap: 12,
              }}>
              <Cover seed={t.coverSeed} size={80} radius={0}/>
              <span style={{ font: "var(--type-title-m)", flex: 1, paddingRight: 8 }}>{t._tileTitle || t.title}</span>
              <button className="m-icon-btn" data-variant="filled-tonal"
                onClick={(e) => { e.stopPropagation(); onPlay(t); }}
                style={{ marginRight: 12, background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
                <span className="msym fill">{isCurrent && playing ? "pause" : "play_arrow"}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Made for you carousel */}
      <Section title="Made for you" subtitle="Mixes refreshed daily">
        {(data.madeFor || []).map(pl => {
          const real = MOCK.playlists.find(p => p.name === pl.title) || MOCK.playlists[0];
          return (
            <PlaylistCard key={pl.id}
              pl={{ name: pl.title, description: pl.subtitle, coverSeed: pl.coverSeed }}
              onClick={() => onOpenPlaylist(real.id)}
              onPlay={() => onPlay({ ...real.tracks[0], playlistId: real.id })}
              accent={accent}/>
          );
        })}
      </Section>

      <Section title="Recently played">
        {(data.recent || []).map(item => {
          const al = MOCK.albums.find(a => a.name === item.title);
          return (
            <PlaylistCard key={item.id}
              pl={{ name: item.title, description: item.subtitle, coverSeed: item.coverSeed }}
              onClick={() => al ? onOpenAlbum(al.id) : null}
              onPlay={() => al ? onPlay({ ...al.tracks[0], playlistId: al.id }) : onPlay(data.allTracks[0])}
              accent={accent}/>
          );
        })}
      </Section>

      <Section title="Popular albums" subtitle="From across the network">
        {(data.popular || []).map(item => (
          <PlaylistCard key={item.id}
            pl={{ name: item.title, description: item.subtitle, coverSeed: item.coverSeed }}
            onClick={() => {}} onPlay={() => onPlay(data.allTracks[0])}
            accent={accent}/>
        ))}
      </Section>

      <Section title="Your top artists">
        {MOCK.artists.slice(0, 6).map(a => (
          <ArtistCard key={a.id} artist={a} onClick={() => onOpenArtist(a.id)}/>
        ))}
      </Section>
    </div>
  );
};

const Section = ({ title, subtitle, children }) => (
  <section style={{ marginBottom: 32 }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h2 className="m-headline-s" style={{ margin: 0, color: "var(--m3-on-surface)" }}>{title}</h2>
        {subtitle && <p className="m-body-m" style={{ margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      <button className="m-btn" data-variant="text">Show all</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
      {children}
    </div>
  </section>
);

const PlaylistCard = ({ pl, onClick, onPlay, accent }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div className="m-card hoverable"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <Cover seed={pl.coverSeed} size="100%" radius={20}/>
        <button className="m-icon-btn" data-variant="filled"
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          style={{
            position: "absolute", right: 12, bottom: 12, width: 48, height: 48,
            background: "var(--m3-primary)", color: "var(--m3-on-primary)",
            opacity: hover ? 1 : 0, transform: hover ? "translateY(0)" : "translateY(8px)",
            transition: "all 200ms ease",
            boxShadow: "0 6px 12px rgba(0,0,0,.4)",
          }}>
          <span className="msym fill">play_arrow</span>
        </button>
      </div>
      <div>
        <div style={{ font: "var(--type-title-m)", color: "var(--m3-on-surface)", marginBottom: 4 }}>{pl.name}</div>
        <div style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)" }}>{pl.description || pl.year || pl.subtitle}</div>
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, onClick }) => (
  <div className="m-card hoverable" onClick={onClick}
    style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
    <Cover seed={artist.coverSeed} size="100%" radius="50%" style={{ aspectRatio: "1" }}/>
    <div>
      <div style={{ font: "var(--type-title-m)", color: "var(--m3-on-surface)", marginBottom: 4 }}>{artist.name}</div>
      <div style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)" }}>Artist</div>
    </div>
  </div>
);

window.M3HomeScreen = M3HomeScreen;
