// MD3 Now Playing Bar — floating rounded card at bottom
const fmt = (s) => {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const M3NowPlayingBar = ({
  track, playing, setPlaying, liked, setLiked,
  progress, setProgress, volume, setVolume, muted, setMuted,
  shuffle, setShuffle, repeat, setRepeat,
  onToggleNP, onToggleQueue, onToggleFullscreen, onToggleDevices, onToggleLyrics,
  npOpen, queueOpen, devicesOpen, accent,
  devices, onSelectDevice,
}) => {
  if (!track) return null;
  const dur = 230; // mock seconds
  const cur = (progress / 100) * dur;

  return (
    <div style={{
      position: "relative", height: "100%",
      display: "flex", alignItems: "center", padding: "0 8px",
      background: "var(--m3-surface-low)", borderRadius: "var(--shape-xl)",
    }}>
      {/* Track info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "30%", minWidth: 200, padding: "0 12px" }}>
        <Cover seed={track.coverSeed} size={56} radius={12}/>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span style={{ font: "var(--type-title-s)", color: "var(--m3-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
          <span style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</span>
        </div>
        <button className="m-icon-btn" onClick={setLiked} data-toggled={liked ? "1" : "0"}>
          <span className={"msym s20" + (liked ? " fill" : "")}>{liked ? "favorite" : "favorite_border"}</span>
        </button>
      </div>

      {/* Center transport */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="m-icon-btn" data-toggled={shuffle ? "1" : "0"} onClick={() => setShuffle(!shuffle)} title="Shuffle">
            <span className="msym s20">shuffle</span>
          </button>
          <button className="m-icon-btn" title="Previous">
            <span className="msym fill">skip_previous</span>
          </button>
          <button className="m-icon-btn" data-variant="filled"
            style={{ width: 56, height: 56 }}
            onClick={() => setPlaying(!playing)} title={playing ? "Pause" : "Play"}>
            <span className="msym fill" style={{ fontSize: 32 }}>{playing ? "pause" : "play_arrow"}</span>
          </button>
          <button className="m-icon-btn" title="Next">
            <span className="msym fill">skip_next</span>
          </button>
          <button className="m-icon-btn" data-toggled={repeat !== "off" ? "1" : "0"}
            onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
            title="Repeat">
            <span className="msym s20">{repeat === "one" ? "repeat_one" : "repeat"}</span>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <span style={{ font: "var(--type-label-m)", color: "var(--m3-on-surface-var)", minWidth: 36, textAlign: "right" }}>{fmt(cur)}</span>
          <Progress value={progress} onChange={setProgress}/>
          <span style={{ font: "var(--type-label-m)", color: "var(--m3-on-surface-var)", minWidth: 36 }}>{fmt(dur)}</span>
        </div>
      </div>

      {/* Right utilities */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: "30%", minWidth: 200, justifyContent: "flex-end", padding: "0 12px" }}>
        <button className="m-icon-btn" onClick={onToggleLyrics} title="Lyrics">
          <span className="msym s20">lyrics</span>
        </button>
        <button className="m-icon-btn" onClick={onToggleQueue} title="Queue">
          <span className="msym s20">queue_music</span>
        </button>
        <div style={{ position: "relative" }}>
          <button className="m-icon-btn" onClick={onToggleDevices} title="Devices" data-toggled={devicesOpen ? "1" : "0"}>
            <span className="msym s20">devices</span>
          </button>
          {devicesOpen && (
            <div style={{
              position: "absolute", bottom: "100%", right: 0, marginBottom: 12,
              width: 320, background: "var(--m3-surface-high)", borderRadius: "var(--shape-xl)",
              padding: 8, boxShadow: "0 12px 36px rgba(0,0,0,.5)", zIndex: 10,
            }}>
              <div style={{ padding: "12px 16px", font: "var(--type-title-m)", color: "var(--m3-on-surface)" }}>Connect to a device</div>
              {devices.map(d => (
                <button key={d.id} onClick={() => onSelectDevice(d.id)} style={{
                  appearance: "none", border: 0, cursor: "pointer", textAlign: "left",
                  background: d.active ? "var(--m3-secondary-container)" : "transparent",
                  color: d.active ? "var(--m3-on-sc)" : "var(--m3-on-surface)",
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: "var(--shape-lg)", width: "100%",
                  font: "var(--type-body-l)",
                }}>
                  <span className={"msym" + (d.active ? " fill" : "")}>{
                    d.type === "phone" ? "smartphone" :
                    d.type === "speaker" ? "speaker" :
                    d.type === "tv" ? "tv" :
                    d.type === "headphones" ? "headphones" : "computer"
                  }</span>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span>{d.name}</span>
                    {d.active && <span style={{ font: "var(--type-body-s)", color: "var(--m3-primary)" }}>Listening on this device</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, width: 140 }}>
          <button className="m-icon-btn" onClick={() => setMuted(!muted)}>
            <span className="msym s20">{muted || volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}</span>
          </button>
          <Progress value={muted ? 0 : volume} onChange={(v) => { setMuted(false); setVolume(v); }} small/>
        </div>

        <button className="m-icon-btn" onClick={onToggleNP} title="Now Playing" data-toggled={npOpen ? "1" : "0"}>
          <span className="msym s20">{npOpen ? "right_panel_close" : "right_panel_open"}</span>
        </button>
        <button className="m-icon-btn" onClick={onToggleFullscreen} title="Fullscreen">
          <span className="msym s20">fullscreen</span>
        </button>
      </div>
    </div>
  );
};

const Progress = ({ value, onChange, small }) => {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const onPointer = (e) => {
    if (e.buttons !== 1 && e.type !== "pointerdown") return;
    const r = ref.current.getBoundingClientRect();
    const v = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    onChange(v);
  };
  const h = small ? 4 : 16;
  const fillH = small ? 4 : (hover ? 8 : 4);
  return (
    <div ref={ref}
      onPointerDown={onPointer} onPointerMove={onPointer}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ flex: 1, height: h, display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: fillH, background: "var(--m3-surface-highest)", borderRadius: 999, transition: "height 120ms ease" }}/>
      <div style={{ position: "absolute", left: 0, width: `${value}%`, height: fillH, background: "var(--m3-primary)", borderRadius: 999, transition: "height 120ms ease" }}/>
      {!small && (
        <div style={{
          position: "absolute", left: `${value}%`, transform: "translateX(-50%)",
          width: 4, height: 16, background: "var(--m3-primary)", borderRadius: 2,
          opacity: hover ? 1 : 0, transition: "opacity 120ms ease",
        }}/>
      )}
    </div>
  );
};

window.M3NowPlayingBar = M3NowPlayingBar;
