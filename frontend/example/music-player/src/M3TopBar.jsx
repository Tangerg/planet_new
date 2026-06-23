// MD3 TopBar — Material search bar + nav arrows + account
const M3TopBar = ({ query, setQuery, mode, accent, onSetActive, history, historyIdx, goBack, goFwd }) => {
  const canBack = historyIdx > 0;
  const canFwd  = historyIdx < (history?.length || 0) - 1;
  const [filter, setFilter] = React.useState("All");
  const filters = ["All", "Songs", "Artists", "Albums", "Playlists", "Podcasts"];
  const inputRef = React.useRef(null);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 5,
      background: "linear-gradient(180deg, var(--m3-surface) 0%, var(--m3-surface) 80%, transparent 100%)",
      padding: "16px 32px 8px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="m-icon-btn" disabled={!canBack} onClick={goBack}
            style={{ opacity: canBack ? 1 : 0.4 }}>
            <span className="msym">arrow_back</span>
          </button>
          <button className="m-icon-btn" disabled={!canFwd} onClick={goFwd}
            style={{ opacity: canFwd ? 1 : 0.4 }}>
            <span className="msym">arrow_forward</span>
          </button>
        </div>

        <div style={{ flex: 1, maxWidth: 720 }} onClick={() => { onSetActive("search"); inputRef.current?.focus(); }}>
          <div className="m-search">
            <span className="msym" style={{ color: "var(--m3-on-surface-var)" }}>search</span>
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, podcasts"
              onFocus={() => onSetActive("search")}/>
            {query && (
              <button className="m-icon-btn" onClick={(e) => { e.stopPropagation(); setQuery(""); }}>
                <span className="msym s20">close</span>
              </button>
            )}
            <button className="m-icon-btn" onClick={(e) => e.stopPropagation()} title="Tune">
              <span className="msym s20">tune</span>
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <button className="m-btn" data-variant="text" style={{ height: 40 }}>
          <span className="msym s20">notifications</span>
        </button>
        <button className="m-btn" data-variant="tonal">
          <span className="msym s20">workspace_premium</span> Upgrade
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--m3-tertiary), var(--m3-primary))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--m3-on-tertiary)", font: "var(--type-title-m)",
          cursor: "pointer",
        }}>YL</div>
      </div>

      {mode === "search" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 96 }}>
          {filters.map(f => (
            <button key={f} className="m-chip" data-selected={filter === f ? "1" : "0"} onClick={() => setFilter(f)}>
              {filter === f && <span className="msym s20">check</span>}
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

window.M3TopBar = M3TopBar;
