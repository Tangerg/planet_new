// Right-side Now Playing panel — track details, lyrics, queue, related
const NowPlayingPanel = ({ track, onClose, accent, onArtist, onAlbum, queue, history, onPlay, current, lyrics }) => {
  const [tab, setTab] = React.useState("about"); // about | lyrics | queue
  if (!track) return null;
  const lines = lyrics || [];
  const [a, b] = (track.gradient) || ["#3b1d4a", accent || "#1ed760"];

  return (
    <div style={{
      background: "#181818", borderRadius: 8, height: "100%",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px 8px",
      }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{track.title}</span>
        <CircleBtn size={28} onClick={onClose}><I.X size={16}/></CircleBtn>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "0 14px 8px" }}>
        {[["about","About"],["lyrics","Lyrics"],["queue","Queue"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: tab === k ? "#272727" : "transparent",
            color: tab === k ? "#fff" : "#b3b3b3",
            border: "none", padding: "6px 12px", borderRadius: 9999,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-ui)",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 14px 14px" }}>
        {tab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Hero gradient + cover */}
            <div style={{
              borderRadius: 8,
              background: `linear-gradient(180deg, ${a} 0%, ${b}66 100%)`,
              padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            }}>
              <Cover seed={track.coverSeed} size={220} radius={6}
                style={{ boxShadow: "rgba(0,0,0,0.5) 0 16px 32px" }}/>
              <div style={{ alignSelf: "stretch", textAlign: "left" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>{track.title}</div>
                <div onClick={() => onArtist && onArtist(track.artistId)}
                  style={{ color: "#b3b3b3", fontSize: 14, marginTop: 4, cursor: "pointer" }}>
                  {track.artist}
                </div>
              </div>
            </div>

            {/* Album info card */}
            <div onClick={() => onAlbum && onAlbum(track.albumId)} style={{
              background: "#272727", borderRadius: 8, padding: 12,
              display: "flex", flexDirection: "column", gap: 10, cursor: "pointer",
            }}>
              <span style={{
                color: "#b3b3b3", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>From the album</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Cover seed={track.coverSeed} size={56} radius={4}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{track.album}</div>
                  <div style={{ color: "#b3b3b3", fontSize: 12 }}>{track.artist}</div>
                </div>
              </div>
            </div>

            {/* Artist card */}
            <div onClick={() => onArtist && onArtist(track.artistId)} style={{
              background: "#272727", borderRadius: 8, position: "relative", overflow: "hidden",
              cursor: "pointer",
            }}>
              <Cover seed={track.coverSeed + 1} size="100%" radius={0} style={{ aspectRatio: "16 / 7" }}/>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{
                  color: "#b3b3b3", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>About the artist</span>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{track.artist}</div>
                <div style={{ color: "#b3b3b3", fontSize: 13 }}>
                  {(MOCK.artists.find(x => x.id === track.artistId)?.listeners) || "—"} monthly listeners
                </div>
                <div style={{ color: "#cbcbcb", fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
                  {(MOCK.artists.find(x => x.id === track.artistId)?.bio) || ""}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Pill variant="outline" uppercase>Follow</Pill>
                </div>
              </div>
            </div>

            {/* Credits */}
            <div style={{ background: "#272727", borderRadius: 8, padding: 14 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Credits</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Credit who={track.artist}        what="Main Artist, Songwriter"/>
                <Credit who="Avery Dunn"          what="Producer"/>
                <Credit who="Sam Isobe"           what="Mixed by"/>
              </div>
            </div>
          </div>
        )}

        {tab === "lyrics" && (
          <div style={{
            background: `linear-gradient(180deg, ${a} 0%, #181818 100%)`,
            borderRadius: 8, padding: "20px 18px", minHeight: "100%",
          }}>
            {lines.length === 0 ? (
              <div style={{ color: "#b3b3b3", fontSize: 14, padding: 20, textAlign: "center" }}>
                Lyrics not available for this track.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{
                    color: "#fff",
                    fontFamily: "var(--font-title)", fontSize: 18, fontWeight: 700,
                    lineHeight: 1.35, letterSpacing: "-0.01em",
                  }}>{l.line || "\u00a0"}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <QueueGroup label="Now playing" items={[track]} current={current} onPlay={onPlay} accent={accent}/>
            <QueueGroup label="Next up" items={queue || []} current={current} onPlay={onPlay} accent={accent}/>
            {(history && history.length > 0) && (
              <QueueGroup label="History" items={history} current={current} onPlay={onPlay} muted/>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Credit = ({ who, what }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div>
      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{who}</div>
      <div style={{ color: "#b3b3b3", fontSize: 12 }}>{what}</div>
    </div>
    <Pill variant="outline" uppercase>Follow</Pill>
  </div>
);

const QueueGroup = ({ label, items, current, onPlay, muted, accent }) => (
  <div>
    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 8,
      textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((t, i) => {
        const isCurrent = current?.id === t.id && label === "Now playing";
        return (
          <div key={t.id + "-" + i} onClick={() => onPlay && onPlay(t)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 6px", borderRadius: 4, cursor: "pointer",
              opacity: muted ? 0.65 : 1,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#272727"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <Cover seed={t.coverSeed} size={40} radius={3}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
              <div style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.artist}</div>
            </div>
            {isCurrent && <NowPlayingDot size={14}/>}
          </div>
        );
      })}
      {items.length === 0 && (
        <div style={{ color: "#b3b3b3", fontSize: 13, padding: "8px 6px" }}>Nothing queued.</div>
      )}
    </div>
  </div>
);

window.NowPlayingPanel = NowPlayingPanel;
