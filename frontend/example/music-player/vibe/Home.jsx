// ============================================================
// Home — split hero (portrait + nav) | gradient recommendation cards
// ============================================================
function HomeHeroNav({ items, onNav }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map(it => (
        <button key={it.key} className="navlink" onClick={() => onNav(it.key)}>{it.label}</button>
      ))}
    </nav>
  );
}

function RecCard({ card, onClick, big }) {
  const [a, b] = artPair(card.seed, card.gradient);
  return (
    <button onClick={onClick} className="grain" style={{
      position: "relative", display: "block", width: "100%", textAlign: "left",
      border: 0, cursor: "pointer", overflow: "hidden",
      height: big ? 150 : 130, color: "#fff",
      background: card.solid
        ? `linear-gradient(110deg, ${a}, ${b})`
        : artBg(card.seed, card.gradient),
    }}>
      {/* darken for legibility on photo cards */}
      {!card.solid && <div style={{ position: "absolute", inset: 0, zIndex: 2,
        background: "linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.05))" }}/>}
      <div style={{ position: "relative", zIndex: 3, height: "100%", display: "flex",
        alignItems: "center", gap: 18, padding: "0 26px" }}>
        <div className="grain" style={{ width: 60, height: 60, flex: "0 0 auto",
          background: artBg(card.seed + 3, card.coverGrad), display: "grid", placeItems: "center",
          color: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.3)" }}>
          {card.icon === "heart" && <Icon.heart size={24} filled/>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 400, letterSpacing: ".01em", textShadow: "0 1px 12px rgba(0,0,0,.35)" }}>
            {card.title}
          </div>
          <div className="mlabel" style={{ marginTop: 6, opacity: .85, textShadow: "0 1px 8px rgba(0,0,0,.4)" }}>
            {card.meta}
          </div>
        </div>
      </div>
    </button>
  );
}

function HomeScreen({ data, artist, onNav, onPlay, accent, playing, mono = true }) {
  const navItems = [
    { key: "search", label: "Search" },
    { key: "library", label: "Playlist" },
    { key: "charts", label: "Top podcasts" },
    { key: "made", label: "Made For You" },
  ];

  const cards = [
    { id: "fav", title: "Songs you like", meta: "in 2 hours", icon: "heart", seed: 7, gradient: ["#101015", "#3a3a42"], coverGrad: ["#2a0420", "#ff4fa3"], big: true },
    { id: "daily", title: "Daily recommendation", meta: "31 Tracks", seed: 2, solid: true, gradient: ["#ff5a3c", "#ff2188"], coverGrad: ["#241003", "#ffb02e"], big: true },
    { id: "p1", title: data.popular[0].title, meta: "16.16M played", seed: 9, coverGrad: ["#13031f", "#b15cff"] },
    { id: "p2", title: data.recent[0].title, meta: "10.52M played", seed: 4, coverGrad: ["#06222b", "#19d3c5"] },
    { id: "p3", title: data.jumpBack[0].title, meta: "8.40K played", seed: 11, coverGrad: ["#031a12", "#1ed98a"] },
  ];

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1.08fr 0.92fr", background: "var(--ink)" }}>
      {/* LEFT — hero */}
      <Art seed={artist.coverSeed} grad={artist.gradient} mono={mono} slotId="home-hero"
        placeholder="drop an artist photo"
        style={{ height: "100%" }} glow={artPair(artist.coverSeed, artist.gradient)[1]}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2,
          background: "linear-gradient(90deg, rgba(8,8,12,.55) 0%, rgba(8,8,12,.15) 45%, rgba(8,8,12,.45) 100%)" }}/>
        <div style={{ position: "relative", zIndex: 3, height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "70px 56px 48px" }}>
          {/* identity */}
          <div className="rise" style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div className="grain" style={{ width: 56, height: 56, borderRadius: "50%",
              background: artBg(artist.coverSeed + 5, ["#5b8cff", "#ff2188"]),
              boxShadow: "0 0 0 2px rgba(255,255,255,.25)" }}/>
            <div>
              <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: ".02em" }}>{artist.name}</div>
              <div style={{ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,.6)" }}>It's over…</div>
            </div>
          </div>
          {/* nav */}
          <div className="rise" style={{ animationDelay: ".08s" }}>
            <HomeHeroNav items={navItems} onNav={onNav}/>
          </div>
        </div>
      </Art>

      {/* RIGHT — stacked recommendation cards */}
      <div className="scroll" style={{ height: "100%", position: "relative", background: "var(--ink)" }}>
        {/* seam equalizer badge */}
        <div style={{ position: "absolute", top: 28, left: -22, zIndex: 10, width: 44, height: 44,
          borderRadius: "50%", background: "rgba(250,249,248,.9)", display: "grid", placeItems: "center",
          boxShadow: "0 6px 20px rgba(0,0,0,.3)" }}>
          <Equalizer playing={playing} color="#19c39a" size={16}/>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {cards.map((c, i) => (
            <div key={c.id} className="rise" style={{ animationDelay: (i * 0.05) + "s" }}>
              <RecCard card={c} big={c.big} onClick={() => onNav("made")}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { HomeScreen });
