// ============================================================
// ForYou — rich editorial home: hero · quick tiles · card rails
// (the structured browsing layer, in the Vibe visual language)
// ============================================================
function MediaCard({ title, sub, seed, grad, round, onClick, onPlay, item }) {
  const handle = (e) => {
    if (!onClick) return;
    const art = e.currentTarget.querySelector(".art");
    const rect = (art || e.currentTarget).getBoundingClientRect();
    if (window.__MORPH) window.__MORPH(rect, seed, grad, onClick); else onClick();
  };
  return (
    <div className={"mcard rise" + (round ? " round" : "")} onClick={handle}
      onMouseEnter={() => window.__AMBIENT && window.__AMBIENT(seed, grad)}
      onContextMenu={item ? (e) => window.__COLLMENU && window.__COLLMENU(e, item) : undefined}>
      <Art seed={seed} grad={grad} className="art" glow={round ? null : artPair(seed, grad)[1]}>
        {onPlay && (
          <button className="playfab" onClick={(e) => { e.stopPropagation(); onPlay(); }} aria-label="Play">
            <Icon.play size={18}/>
          </button>
        )}
      </Art>
      <div className="ttl">{title}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Rail({ title, onAll, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <div className="sech">
        <h2>{title}</h2>
        <button className="all" onClick={onAll}>Show all</button>
      </div>
      <div className="hrail">{children}</div>
    </section>
  );
}

function HeroBanner({ playlist, onOpen, onPlay, accent }) {
  const [a, b] = artPair(playlist.coverSeed, playlist.gradient);
  return (
    <div className="grain rise" style={{ position: "relative", height: 320, overflow: "hidden",
      background: artBg(playlist.coverSeed, playlist.gradient),
      boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)", marginBottom: 40 }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 2,
        background: `linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 45%, rgba(6,6,10,.15) 100%)` }}/>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "0 56px", maxWidth: 640 }}>
        <span className="tag" style={{ alignSelf: "flex-start", background: accent, color: "#06060a" }}>Featured</span>
        <div style={{ fontSize: 46, fontWeight: 200, lineHeight: 1.04, letterSpacing: ".005em", margin: "16px 0 14px" }}>{playlist.name}</div>
        <div style={{ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,.72)", maxWidth: 460, lineHeight: 1.55 }}>{playlist.description}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 26, alignItems: "center" }}>
          <button className="pill-accent" onClick={onPlay} style={{ fontSize: 12, padding: "13px 30px", display: "inline-flex", gap: 10, alignItems: "center" }}>
            <Icon.play size={15}/> Play
          </button>
          <button onClick={(e) => { const banner = e.currentTarget.closest("[data-hero]"); const r = (banner || e.currentTarget).getBoundingClientRect(); window.__MORPH ? window.__MORPH(r, playlist.coverSeed, playlist.gradient, onOpen) : onOpen(); }} className="pill-ghost">Open</button>
          <span className="mlabel" style={{ color: "rgba(255,255,255,.5)", marginLeft: 6 }}>{playlist.tracks.length} tracks</span>
        </div>
      </div>
    </div>
  );
}

function ForYouScreen({ data, onPlay, openPlaylist, openAlbum, openArtist, onNav, accent }) {
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const [chip, setChip] = useState("All");
  const featured = MOCK.playlists[1];
  const tiles = [MOCK.playlists[0], MOCK.playlists[2], MOCK.albums[0], MOCK.playlists[3],
                 MOCK.albums[2], MOCK.playlists[4], MOCK.albums[4], MOCK.playlists[5]];

  return (
    <div className="fade-in scroll" style={{ height: "100%", background: "radial-gradient(120% 80% at 30% -5%, #181922, #0c0c10 55%, #08080b)" }}>
      <div style={{ padding: "60px 56px 50px" }}>
        {/* greeting + chips */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div className="mlabel" style={{ color: accent, marginBottom: 8 }}>{greeting}</div>
            <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: ".01em" }}>For You</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["All", "Music", "Mixes", "Charts"].map(c => (
              <button key={c} className={"chip" + (chip === c ? " on" : "")} onClick={() => setChip(c)}>{c}</button>
            ))}
          </div>
        </div>

        <HeroBanner playlist={featured} accent={accent}
          onOpen={() => openPlaylist(featured)} onPlay={() => onPlay(featured.tracks[0])}/>

        {/* quick tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 44 }}>
          {tiles.map((t, i) => (
            <div key={t.id} className="tile rise" style={{ animationDelay: (i * 0.03) + "s" }}
              onMouseEnter={() => window.__AMBIENT && window.__AMBIENT(t.coverSeed, t.gradient)}
              onContextMenu={(e) => window.__COLLMENU && window.__COLLMENU(e, t)}
              onClick={(e) => {
                const art = e.currentTarget.querySelector(".tart");
                const rect = (art || e.currentTarget).getBoundingClientRect();
                const run = () => (t.tracks && t.artist ? openAlbum(t) : openPlaylist(t));
                window.__MORPH ? window.__MORPH(rect, t.coverSeed, t.gradient, run) : run();
              }}>
              <Art seed={t.coverSeed} grad={t.gradient} className="tart"/>
              <span className="tname">{t.name}</span>
              <button className="tfab" aria-label="Play"
                onClick={(e) => { e.stopPropagation(); onPlay(t.tracks[0]); }}><Icon.play size={15}/></button>
            </div>
          ))}
        </div>

        <Rail title="Made for you" onAll={() => onNav("library")}>
          {MOCK.playlists.map(p => (
            <MediaCard key={p.id} title={p.name} sub={p.kind} seed={p.coverSeed} grad={p.gradient} item={p}
              onClick={() => openPlaylist(p)} onPlay={() => onPlay(p.tracks[0])}/>
          ))}
        </Rail>

        <Rail title="Recently played" onAll={() => onNav("library")}>
          {MOCK.albums.map(al => (
            <MediaCard key={al.id} title={al.name} sub={al.artist} seed={al.coverSeed} grad={al.gradient} item={al}
              onClick={() => openAlbum(al)} onPlay={() => onPlay(al.tracks[0])}/>
          ))}
        </Rail>

        <Rail title="Your artists" onAll={() => onNav("library")}>
          {MOCK.artists.map(ar => (
            <MediaCard key={ar.id} round title={ar.name} sub="Artist" seed={ar.coverSeed} grad={ar.gradient} item={ar}
              onClick={() => openArtist(ar)} onPlay={() => onPlay(ar.tracks ? ar.tracks[0] : data.allTracks.find(t => t.artistId === ar.id))}/>
          ))}
        </Rail>
      </div>
    </div>
  );
}
Object.assign(window, { ForYouScreen, MediaCard, Rail, HeroBanner });
