// Now-playing bar — pinned bottom transport with all extras
const NowPlayingBar = ({
  track, playing, setPlaying, liked, setLiked,
  progress, setProgress, volume, setVolume,
  shuffle, setShuffle, repeat, setRepeat, muted, setMuted,
  onToggleNP, onToggleQueue, onToggleFullscreen, onToggleDevices, onToggleLyrics,
  npOpen, queueOpen, devicesOpen,
  accent, devices, onSelectDevice,
}) => {
  if (!track) return <div style={{ height: 88, background: "#000" }}/>;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const total = track.durSec || 222;
  const cur = (progress / 100) * total;

  const activeDevice = devices.find(d => d.active) || devices[0];
  const onDevice = activeDevice && activeDevice.id !== "d1";

  return (
    <div style={{
      background: "#000", height: 88,
      display: "grid", gridTemplateColumns: "30% 40% 30%",
      alignItems: "center", padding: "0 16px",
      position: "relative",
    }}>
      {/* Connect-to-device popover */}
      {devicesOpen && (
        <div style={{
          position: "absolute", right: 16, bottom: 80, width: 360,
          background: "#272727", borderRadius: 8, padding: 16,
          boxShadow: "rgba(0,0,0,0.5) 0 8px 24px", zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <I.Devices size={28}/>
            <div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Connect to a device</div>
              <div style={{ color: "#b3b3b3", fontSize: 12 }}>Select another device to play on</div>
            </div>
          </div>
          {devices.map(d => (
            <div key={d.id} onClick={() => onSelectDevice(d.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: 10,
                borderRadius: 6, cursor: "pointer",
                background: d.active ? "#1f1f1f" : "transparent",
              }}
              onMouseEnter={(e) => { if (!d.active) e.currentTarget.style.background = "#1f1f1f"; }}
              onMouseLeave={(e) => { if (!d.active) e.currentTarget.style.background = "transparent"; }}>
              {d.icon === "Speaker" ? <I.Speaker size={22}/> : d.icon === "Headphones" ? <I.Headphones size={22}/> : <I.Devices size={22}/>}
              <div style={{ flex: 1 }}>
                <div style={{ color: d.active ? (accent || "#1ed760") : "#fff", fontSize: 14, fontWeight: 700 }}>{d.name}</div>
                <div style={{ color: "#b3b3b3", fontSize: 12 }}>{d.kind}</div>
              </div>
              {d.active && <NowPlayingDot size={14}/>}
            </div>
          ))}
        </div>
      )}

      {/* Left: track info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div onClick={onToggleFullscreen} style={{ position: "relative", cursor: "pointer" }}>
          <Cover seed={track.coverSeed} size={56} radius={4}/>
          <div style={{
            position: "absolute", top: 4, right: 4,
            background: "rgba(0,0,0,0.6)", borderRadius: "50%",
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 120ms",
          }} className="fullscreen-hint">
            <I.Maximize size={12} stroke={2.4} style={{ color: "#fff" }}/>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
          <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</span>
        </div>
        <CircleBtn size={32} color={liked ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={liked ? (accent || "#1ed760") : "#fff"} onClick={() => setLiked(!liked)}>
          {liked ? <I.HeartF size={16}/> : <I.Heart size={16}/>}
        </CircleBtn>
      </div>

      {/* Center: transport + scrubber */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CircleBtn size={28} color={shuffle ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={shuffle ? (accent || "#1ed760") : "#fff"} onClick={() => setShuffle(!shuffle)}>
            <I.Shuffle size={16}/>
            {shuffle && <span style={{ position: "absolute", bottom: -6, width: 4, height: 4, borderRadius: "50%", background: accent || "#1ed760" }}/>}
          </CircleBtn>
          <CircleBtn size={28} hoverColor="#fff"><I.Prev size={16}/></CircleBtn>
          <button onClick={() => setPlaying(!playing)} style={{
            background: "#fff", color: "#000", border: "none", borderRadius: "50%",
            width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            {playing ? <I.Pause size={16}/> : <I.Play size={16}/>}
          </button>
          <CircleBtn size={28} hoverColor="#fff"><I.Next size={16}/></CircleBtn>
          <CircleBtn size={28} color={repeat !== "off" ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={repeat !== "off" ? (accent || "#1ed760") : "#fff"}
            onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}>
            <I.Repeat size={16}/>
            {repeat === "one" && <span style={{ position: "absolute", color: accent || "#1ed760", fontSize: 9, fontWeight: 800, marginLeft: 6, marginTop: -8 }}>1</span>}
          </CircleBtn>
        </div>
        <Scrubber value={progress} onChange={setProgress} cur={fmt(cur)} total={fmt(total)} accent={accent}/>
      </div>

      {/* Right: extras + volume */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        <CircleBtn size={28} color={onDevice ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={onDevice ? (accent || "#1ed760") : "#fff"} onClick={onToggleDevices}>
          {activeDevice?.icon === "Speaker" ? <I.Speaker size={16}/> :
           activeDevice?.icon === "Headphones" ? <I.Headphones size={16}/> :
           <I.Devices size={16}/>}
        </CircleBtn>
        <CircleBtn size={28} color="#b3b3b3" onClick={onToggleLyrics}><I.Lyrics size={16}/></CircleBtn>
        <CircleBtn size={28} color={queueOpen ? (accent || "#1ed760") : "#b3b3b3"} hoverColor={queueOpen ? (accent || "#1ed760") : "#fff"} onClick={onToggleQueue}><I.Queue size={16}/></CircleBtn>
        <VolumeControl volume={volume} setVolume={setVolume} muted={muted} setMuted={setMuted} accent={accent}/>
        <CircleBtn size={28} color="#b3b3b3" hoverColor="#fff" onClick={onToggleNP}>
          {npOpen ? <I.Mini size={16}/> : <I.Maximize size={16}/>}
        </CircleBtn>
      </div>
    </div>
  );
};

const Scrubber = ({ value, onChange, cur, total, accent }) => {
  const [hover, setHover] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 600 }}>
      <span style={{ color: "#b3b3b3", fontSize: 11, width: 36, textAlign: "right" }}>{cur}</span>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ flex: 1, height: 12, display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
        }}>
        <div style={{ width: "100%", height: 4, background: "#4d4d4d", borderRadius: 2, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: value + "%",
            background: hover ? (accent || "#1ed760") : "#fff", borderRadius: 2, transition: "background 120ms" }}/>
          {hover && (
            <div style={{
              position: "absolute", left: `calc(${value}% - 6px)`, top: -4, width: 12, height: 12, borderRadius: "50%",
              background: "#fff",
            }}/>
          )}
        </div>
      </div>
      <span style={{ color: "#b3b3b3", fontSize: 11, width: 36 }}>{total}</span>
    </div>
  );
};

const VolumeControl = ({ volume, setVolume, muted, setMuted, accent }) => {
  const [hover, setHover] = React.useState(false);
  const v = muted ? 0 : volume;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <CircleBtn size={28} color="#b3b3b3" hoverColor="#fff" onClick={() => setMuted(!muted)}>
        <I.Volume size={16}/>
      </CircleBtn>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ width: 96, height: 12, display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMuted(false);
          setVolume(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
        }}>
        <div style={{ width: "100%", height: 4, background: "#4d4d4d", borderRadius: 2, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: v + "%",
            background: hover ? (accent || "#1ed760") : "#fff", borderRadius: 2 }}/>
          {hover && (
            <div style={{
              position: "absolute", left: `calc(${v}% - 6px)`, top: -4, width: 12, height: 12, borderRadius: "50%",
              background: "#fff",
            }}/>
          )}
        </div>
      </div>
    </div>
  );
};

window.NowPlayingBar = NowPlayingBar;
