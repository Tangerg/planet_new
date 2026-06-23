// Fullscreen "Now Playing" — like a hero player
const FullscreenPlayer = ({ track, playing, setPlaying, onClose, progress, setProgress, volume, setVolume, muted, setMuted, shuffle, setShuffle, repeat, setRepeat, liked, setLiked, accent, queue, lyrics, onPlay }) => {
  if (!track) return null;
  const [a, b] = ["#3b1d4a", accent || "#1ed760"];
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const total = track.durSec || 222;
  const cur = (progress / 100) * total;
  const lines = lyrics || [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: `radial-gradient(ellipse at top, ${a} 0%, #0a0a0a 60%, #000 100%)`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Cover seed={track.coverSeed} size={36} radius={3}/>
          <div>
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Now playing</div>
            <div style={{ color: "#b3b3b3", fontSize: 13 }}>{track.album}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <CircleBtn size={36} bg="rgba(0,0,0,0.4)" color="#fff"><I.Share size={18}/></CircleBtn>
          <CircleBtn size={36} bg="rgba(0,0,0,0.4)" color="#fff" onClick={onClose}><I.Mini size={18}/></CircleBtn>
        </div>
      </div>

      {/* Center: cover + info + lyrics column */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, padding: "0 64px", alignItems: "center", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "flex-start", justifySelf: "end", maxWidth: 520 }}>
          <Cover seed={track.coverSeed} size={420} radius={6}
            style={{ boxShadow: "rgba(0,0,0,0.6) 0 16px 48px" }}/>
          <div>
            <div style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{track.title}</div>
            <div style={{ color: "#cbcbcb", fontSize: 22, fontWeight: 600, marginTop: 8 }}>{track.artist}</div>
          </div>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)",
          borderRadius: 12, padding: 32, height: 480, overflow: "auto",
          display: "flex", flexDirection: "column", gap: 14, justifySelf: "start", maxWidth: 520, width: "100%",
        }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Lyrics</div>
          {lines.length === 0 && <div style={{ color: "#b3b3b3", fontSize: 14 }}>Lyrics not available.</div>}
          {lines.map((l, i) => (
            <div key={i} style={{
              color: "#fff", fontFamily: "var(--font-title)",
              fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em",
              opacity: cur >= l.t ? 1 : 0.4,
            }}>{l.line || "\u00a0"}</div>
          ))}
        </div>
      </div>

      {/* Bottom transport */}
      <div style={{ padding: "24px 64px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, width: "100%", maxWidth: 720 }}>
          <span style={{ color: "#fff", fontSize: 12, width: 40, textAlign: "right" }}>{fmt(cur)}</span>
          <div onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setProgress(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
          }} style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 2, cursor: "pointer", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: progress + "%", background: "#fff", borderRadius: 2 }}/>
          </div>
          <span style={{ color: "#fff", fontSize: 12, width: 40 }}>{fmt(total)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <CircleBtn size={32} color={shuffle ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={shuffle ? (accent || "#1ed760") : "#fff"} onClick={() => setShuffle(!shuffle)}><I.Shuffle size={20}/></CircleBtn>
          <CircleBtn size={36} color="#fff"><I.Prev size={22}/></CircleBtn>
          <button onClick={() => setPlaying(!playing)} style={{
            background: "#fff", color: "#000", border: "none", borderRadius: "50%",
            width: 64, height: 64, display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            {playing ? <I.Pause size={28}/> : <I.Play size={28}/>}
          </button>
          <CircleBtn size={36} color="#fff"><I.Next size={22}/></CircleBtn>
          <CircleBtn size={32} color={repeat !== "off" ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={repeat !== "off" ? (accent || "#1ed760") : "#fff"}
            onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}>
            <I.Repeat size={20}/>
          </CircleBtn>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
          <CircleBtn size={28} color={liked ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={liked ? (accent || "#1ed760") : "#fff"} onClick={() => setLiked(!liked)}>
            {liked ? <I.HeartF size={16}/> : <I.Heart size={16}/>}
          </CircleBtn>
          <CircleBtn size={28}><I.Share size={16}/></CircleBtn>
          <CircleBtn size={28}><I.More size={16}/></CircleBtn>
        </div>
      </div>
    </div>
  );
};

window.FullscreenPlayer = FullscreenPlayer;
