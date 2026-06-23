// Sidebar — left rail with collapsed/expanded states + filter chips
const Sidebar = ({ active, setActive, playlists, accent, collapsed, onToggleCollapse }) => {
  const navItem = (key, icon, iconO, label, onClick) => {
    const isActive = active === key;
    const handleClick = onClick || (() => setActive(key));
    return (
      <div onClick={handleClick}
        title={collapsed ? label : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: collapsed ? "10px" : "10px 12px", borderRadius: 6,
          color: isActive ? "#fff" : "#b3b3b3",
          background: isActive ? "#1f1f1f" : "transparent",
          cursor: "pointer", fontWeight: isActive ? 700 : 600, fontSize: 15,
          transition: "color 120ms, background 120ms",
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
        {isActive ? icon({ size: 22 }) : iconO({ size: 22 })}
        {!collapsed && <span>{label}</span>}
      </div>
    );
  };

  const [filter, setFilter] = React.useState("Playlists");
  const filtered = playlists.filter(p => {
    if (filter === "Playlists") return p.kind === "Playlist";
    if (filter === "Albums") return p.kind === "Album";
    if (filter === "Artists") return p.kind === "Artist";
    return true;
  });

  return (
    <aside style={{
      background: "#000", display: "flex", flexDirection: "column",
      gap: 8, padding: 8, height: "100%", overflow: "hidden",
    }}>
      <div style={{ background: "#121212", borderRadius: 8, padding: collapsed ? "16px 8px" : "16px 12px" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 8px" }}>
            <img src="assets/logo.svg" width={28} height={28} alt=""/>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>Sonance</span>
          </div>
        )}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <img src="assets/logo.svg" width={28} height={28} alt=""/>
          </div>
        )}
        {navItem("home",    I.Home,    I.HomeO,   "Home")}
        {navItem("search",  I.Search,  I.Search,  "Search")}
      </div>

      <div style={{
        background: "#121212", borderRadius: 8, flex: 1,
        display: "flex", flexDirection: "column", minHeight: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: collapsed ? "12px 6px 8px" : "16px 16px 8px" }}>
          <div onClick={() => setActive("library")} title={collapsed ? "Your Library" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              color: active === "library" ? "#fff" : "#b3b3b3",
              cursor: "pointer", fontWeight: 700, fontSize: 15,
              justifyContent: collapsed ? "center" : "flex-start", flex: 1,
            }}>
            <I.Library size={22}/>
            {!collapsed && <span>Your Library</span>}
          </div>
          {!collapsed && (
            <div style={{ display: "flex", gap: 4 }}>
              <CircleBtn size={32}><I.Plus size={18}/></CircleBtn>
              <CircleBtn size={32} onClick={onToggleCollapse}><I.Chevron size={18}/></CircleBtn>
            </div>
          )}
          {collapsed && (
            <CircleBtn size={28} onClick={onToggleCollapse} style={{ position: "absolute", display: "none" }}><I.ChevronL size={16}/></CircleBtn>
          )}
        </div>

        {!collapsed && (
          <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", flexWrap: "wrap" }}>
            {["Playlists", "Albums", "Artists"].map(f => (
              <span key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? "#fff" : "#1f1f1f",
                color: filter === f ? "#000" : "#fff",
                padding: "6px 12px", borderRadius: 9999,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{f}</span>
            ))}
          </div>
        )}

        {!collapsed && (
          <div style={{ padding: "0 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CircleBtn size={28}><I.Search size={14}/></CircleBtn>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              Recents <I.List size={14}/>
            </span>
          </div>
        )}

        <div style={{ overflow: "auto", padding: collapsed ? "0 4px 8px" : "0 8px 8px", flex: 1 }}>
          {filtered.map((p, i) => {
            const isActive = active === "playlist:" + p.id || active === "album:" + p.id || active === "artist:" + p.id || (p.id === "liked" && active === "liked");
            const onClick = () => {
              if (p.id === "liked") setActive("liked");
              else if (p.kind === "Album") setActive("album:" + p.id);
              else if (p.kind === "Artist") setActive("artist:" + p.id);
              else setActive("playlist:" + p.id);
            };
            const isLiked = p.id === "liked";
            const isArtist = p.kind === "Artist";
            return (
              <div key={p.id} onClick={onClick}
                title={collapsed ? p.name : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: collapsed ? 6 : 8, borderRadius: 6, cursor: "pointer",
                  background: isActive ? "#1f1f1f" : "transparent",
                  justifyContent: collapsed ? "center" : "flex-start",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#181818"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                {isLiked ? (
                  <div style={{
                    width: 48, height: 48, borderRadius: 4, flexShrink: 0,
                    background: "linear-gradient(135deg, #4a3aa6 0%, #cbcbcb 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <I.HeartF size={20} fill style={{ color: "#fff" }}/>
                  </div>
                ) : (
                  <Cover seed={p.coverSeed != null ? p.coverSeed : i} size={48} radius={isArtist ? "50%" : 4}/>
                )}
                {!collapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ color: p.playing ? (accent || "#1ed760") : "#fff", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.pinned && <I.Pin size={11} fill style={{ color: accent || "#1ed760", marginRight: 4, verticalAlign: "middle", display: "inline-block" }}/>}
                      {p.name}
                    </span>
                    <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.playing
                        ? <span style={{ display: "inline-flex", gap: 6, alignItems: "center", color: accent || "#1ed760" }}><NowPlayingDot size={12}/> {p.kind}</span>
                        : `${p.kind} · ${p.owner}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
