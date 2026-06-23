// Search — browse genres, full results
const SearchScreen = ({ query, data, onPlay, currentId, playing, accent, onOpenAlbum, onOpenArtist }) => {
  const [filter, setFilter] = React.useState("All");
  const filters = ["All", "Songs", "Artists", "Albums", "Playlists", "Podcasts"];

  if (!query) {
    return (
      <div style={{ padding: "0 24px 24px" }}>
        <h1 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 24, fontWeight: 700, margin: "8px 0 16px" }}>Browse all</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {MOCK.genres.map(([name, color], i) => (
            <div key={name} style={{
              background: color, borderRadius: 8, height: 160,
              padding: 16, position: "relative", overflow: "hidden", cursor: "pointer",
            }}>
              <span style={{ color: "#fff", fontFamily: "var(--font-title)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em" }}>{name}</span>
              <div style={{
                position: "absolute", right: -10, bottom: -10,
                width: 92, height: 92, borderRadius: 6,
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
  const tracksHit  = data.allTracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  const artistsHit = MOCK.artists.filter(a => a.name.toLowerCase().includes(q) || tracksHit.some(t => t.artistId === a.id));
  const albumsHit  = MOCK.albums.filter(a => a.name.toLowerCase().includes(q) || tracksHit.some(t => t.albumId === a.id));
  const top = tracksHit[0];

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", gap: 8, margin: "0 0 24px" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "#fff" : "#1f1f1f",
            color: filter === f ? "#000" : "#fff",
            border: "none", padding: "8px 16px", borderRadius: 9999,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)",
          }}>{f}</button>
        ))}
      </div>

      {(filter === "All") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 32 }}>
          <div>
            <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 22, fontWeight: 700, margin: "8px 0 16px" }}>Top result</h2>
            {top ? (
              <div onClick={() => onOpenArtist(top.artistId)} style={{
                background: "#181818", borderRadius: 8, padding: 20,
                display: "flex", flexDirection: "column", gap: 16,
                cursor: "pointer", position: "relative", height: 220,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#181818"}>
                <Cover seed={top.coverSeed} size={92} radius={6} style={{ boxShadow: "rgba(0,0,0,0.5) 0 8px 24px" }}/>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{top.title}</span>
                  <span style={{ color: "#b3b3b3", fontSize: 14 }}>Song · {top.artist}</span>
                </div>
                <div style={{ position: "absolute", right: 16, bottom: 16 }}>
                  <button onClick={(e) => { e.stopPropagation(); onPlay(top); }} style={{
                    background: accent || "#1ed760", color: "#000", border: "none", borderRadius: "50%",
                    width: 48, height: 48, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "rgba(0,0,0,0.5) 0 8px 16px",
                  }}><I.Play size={20}/></button>
                </div>
              </div>
            ) : <div style={{ color: "#b3b3b3" }}>Nothing matched.</div>}
          </div>

          <div>
            <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 22, fontWeight: 700, margin: "8px 0 16px" }}>Songs</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tracksHit.slice(0, 4).map((t) => {
                const [hover, setHover] = React.useState(false);
                const isCurrent = currentId === t.id;
                return (
                  <div key={t.id}
                    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                    onClick={() => onPlay(t)}
                    style={{
                      display: "grid", gridTemplateColumns: "40px 1fr auto auto",
                      gap: 12, padding: 8, borderRadius: 4, alignItems: "center",
                      background: hover ? "#2a2a2a" : "transparent", cursor: "pointer",
                    }}>
                    <Cover seed={t.coverSeed} size={40} radius={3}/>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                      <span style={{ color: "#b3b3b3", fontSize: 12 }}>{t.artist}</span>
                    </div>
                    <CircleBtn size={28} style={{ opacity: hover ? 1 : 0 }}><I.Heart size={16}/></CircleBtn>
                    <span style={{ color: "#b3b3b3", fontSize: 12, paddingRight: 8 }}>{t.duration}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(filter === "All" || filter === "Artists") && artistsHit.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 22, fontWeight: 700, margin: "8px 0 16px" }}>Artists</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {artistsHit.map(a => (
              <div key={a.id} onClick={() => onOpenArtist(a.id)} style={{
                background: "#181818", borderRadius: 8, padding: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#181818"}>
                <Cover seed={a.coverSeed} size="100%" radius="50%"/>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                  <div style={{ color: "#b3b3b3", fontSize: 13 }}>Artist</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(filter === "All" || filter === "Albums") && albumsHit.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 22, fontWeight: 700, margin: "8px 0 16px" }}>Albums</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {albumsHit.map(a => (
              <div key={a.id} onClick={() => onOpenAlbum(a.id)} style={{
                background: "#181818", borderRadius: 8, padding: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#181818"}>
                <Cover seed={a.coverSeed} size="100%"/>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                  <div style={{ color: "#b3b3b3", fontSize: 13 }}>{a.year} · {a.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

window.SearchScreen = SearchScreen;
