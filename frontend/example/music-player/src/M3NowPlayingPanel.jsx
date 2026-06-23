// MD3 Now Playing Panel — right-side rail
const M3NowPlayingPanel = ({ track, onClose, accent, onArtist, onAlbum, queue, history, current, onPlay, lyrics }) => {
  const [tab, setTab] = React.useState("about");
  if (!track) return null;
  return (
    <aside style={{
      height: "100%", background: "var(--m3-surface-low)",
      borderRadius: "var(--shape-xl)", padding: 16,
      display: "flex", flexDirection: "column", gap: 16,
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="m-label-l" style={{ color: "var(--m3-on-surface)" }}>{track.title}</div>
        <button className="m-icon-btn" onClick={onClose}><span className="msym s20">close</span></button>
      </div>
      <div className="m-seg" style={{ alignSelf: "stretch" }}>
        <button data-selected={tab === "about" ? "1" : "0"} onClick={() => setTab("about")} style={{ flex: 1, justifyContent: "center" }}>About</button>
        <button data-selected={tab === "queue" ? "1" : "0"} onClick={() => setTab("queue")} style={{ flex: 1, justifyContent: "center" }}>Queue</button>
        <button data-selected={tab === "lyrics" ? "1" : "0"} onClick={() => setTab("lyrics")} style={{ flex: 1, justifyContent: "center" }}>Lyrics</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 4 }}>
        {tab === "about" && (
          <>
            <Cover seed={track.coverSeed} size="100%" radius={28}/>
            <div>
              <div className="m-headline-s">{track.title}</div>
              <div className="m-body-m" style={{ marginTop: 4, cursor: "pointer" }}
                onClick={() => track.artistId && onArtist(track.artistId)}>{track.artist}</div>
            </div>
            <div className="m-card" data-variant="filled" style={{ background: "var(--m3-surface-mid)" }}>
              <div className="m-label-m">ABOUT THE ARTIST</div>
              <div style={{ font: "var(--type-title-m)", marginTop: 8 }}>{track.artist}</div>
              <div className="m-body-m" style={{ marginTop: 8 }}>An evolving sound that blends rhythmic precision with introspective lyricism.</div>
              <button className="m-btn" data-variant="outlined" style={{ marginTop: 12 }}>Follow</button>
            </div>
            <div className="m-card" data-variant="filled" style={{ background: "var(--m3-surface-mid)" }}>
              <div className="m-label-m">CREDITS</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <div><div className="m-body-s">Performer</div><div style={{ font: "var(--type-title-s)" }}>{track.artist}</div></div>
                <div><div className="m-body-s">Producer</div><div style={{ font: "var(--type-title-s)" }}>Studio Quartz</div></div>
                <div><div className="m-body-s">Songwriter</div><div style={{ font: "var(--type-title-s)" }}>L. Bryne, M. Carr</div></div>
              </div>
            </div>
          </>
        )}
        {tab === "queue" && (
          <>
            <div className="m-label-m">NOW PLAYING</div>
            <M3MiniRow track={current} highlight onClick={() => {}} accent={accent}/>
            <div className="m-label-m" style={{ marginTop: 8 }}>NEXT IN QUEUE</div>
            {queue.length === 0 && <div className="m-body-m">Queue is empty.</div>}
            {queue.map(t => <M3MiniRow key={t.id} track={t} onClick={() => onPlay(t)}/>)}
            {history.length > 0 && (<>
              <div className="m-label-m" style={{ marginTop: 8 }}>RECENTLY PLAYED</div>
              {history.map((t, i) => <M3MiniRow key={t.id + ":" + i} track={t} onClick={() => onPlay(t)}/>)}
            </>)}
          </>
        )}
        {tab === "lyrics" && (
          <div style={{
            background: "linear-gradient(160deg, var(--m3-tertiary-container), var(--m3-primary-container))",
            color: "var(--m3-on-pc)",
            borderRadius: 28, padding: 24, font: "var(--type-headline-s)",
            lineHeight: 1.5, minHeight: 360,
          }}>
            {lyrics ? lyrics.map((l, i) => (
              <div key={i} style={{ opacity: i === 2 ? 1 : 0.55, marginBottom: 12,
                fontSize: i === 2 ? 28 : 22, fontWeight: i === 2 ? 700 : 500 }}>{l}</div>
            )) : <div className="m-body-l">No lyrics available.</div>}
          </div>
        )}
      </div>
    </aside>
  );
};

const M3MiniRow = ({ track, onClick, highlight }) => {
  if (!track) return null;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: 8,
      borderRadius: 12, cursor: "pointer",
      background: highlight ? "var(--m3-secondary-container)" : "transparent",
      color: highlight ? "var(--m3-on-sc)" : "var(--m3-on-surface)",
    }}>
      <Cover seed={track.coverSeed} size={40} radius={8}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "var(--type-title-s)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
        <div style={{ font: "var(--type-body-s)", color: highlight ? "var(--m3-on-sc)" : "var(--m3-on-surface-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</div>
      </div>
    </div>
  );
};

window.M3NowPlayingPanel = M3NowPlayingPanel;
