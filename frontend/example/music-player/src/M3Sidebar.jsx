// MD3 Sidebar — Navigation Drawer (extended) with pill destinations
// Uses Material Symbols Rounded for icons.

const M3Sidebar = ({ active, setActive, playlists, accent, collapsed, onToggleCollapse }) => {
  const NavItem = ({ id, icon, label }) => {
    const isActive = active === id;
    return (
      <button onClick={() => setActive(id)} style={{
        appearance: "none", border: 0, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
        height: 56, padding: collapsed ? 0 : "0 24px 0 16px",
        width: "100%", justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? "var(--m3-secondary-container)" : "transparent",
        color: isActive ? "var(--m3-on-sc)" : "var(--m3-on-surface-var)",
        borderRadius: "var(--shape-full)",
        font: "var(--type-label-l)", textAlign: "left",
        transition: "background 120ms ease, color 120ms ease",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "color-mix(in oklch, var(--m3-on-surface) 8%, transparent)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
        <span className={"msym" + (isActive ? " fill" : "")}>{icon}</span>
        {!collapsed && <span>{label}</span>}
      </button>
    );
  };

  const PlaylistItem = ({ pl }) => {
    const id = pl.kind === "liked" ? "liked" : ("playlist:" + pl.id);
    const isActive = active === id;
    return (
      <button onClick={() => setActive(id)} style={{
        appearance: "none", border: 0, cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 12,
        height: 56, padding: collapsed ? 0 : "0 24px 0 16px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? "var(--m3-secondary-container)" : "transparent",
        color: isActive ? "var(--m3-on-sc)" : "var(--m3-on-surface)",
        borderRadius: "var(--shape-full)",
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "color-mix(in oklch, var(--m3-on-surface) 6%, transparent)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
        {pl.kind === "liked" ? (
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, var(--m3-primary-container), var(--m3-tertiary-container))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="msym fill s20" style={{ color: "var(--m3-on-pc)" }}>favorite</span>
          </div>
        ) : (
          <Cover seed={pl.coverSeed || 0} size={40} radius={10}/>
        )}
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span style={{ font: "var(--type-title-s)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            <span style={{ font: "var(--type-body-s)", color: "var(--m3-on-surface-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pl.playing ? "● Playing" : (pl.kind === "liked" ? "Playlist" : pl.subtitle || "Playlist")}
            </span>
          </div>
        )}
        {!collapsed && pl.playing && (
          <span className="msym fill s20" style={{ color: "var(--m3-primary)" }}>graphic_eq</span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      height: "100%",
      background: "var(--m3-surface-low)",
      borderRadius: "var(--shape-xl)",
      padding: collapsed ? "16px 8px" : "16px 12px",
      display: "flex", flexDirection: "column", gap: 4,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? 0 : "8px 16px 16px", height: 56,
      }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "var(--m3-primary)", color: "var(--m3-on-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="msym fill s20">graphic_eq</span>
            </div>
            <span style={{ font: "var(--type-title-l)", color: "var(--m3-on-surface)" }}>Sonance</span>
          </div>
        )}
        <button onClick={onToggleCollapse} className="m-icon-btn" title={collapsed ? "Expand" : "Collapse"}>
          <span className="msym">{collapsed ? "menu_open" : "menu"}</span>
        </button>
      </div>

      <NavItem id="home" icon="home" label="Home"/>
      <NavItem id="search" icon="search" label="Explore"/>
      <NavItem id="library" icon="library_music" label="Your library"/>

      <div style={{ height: 1, background: "var(--m3-outline-variant)", margin: "12px 16px" }}/>

      {!collapsed && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px 8px",
        }}>
          <span style={{ font: "var(--type-label-m)", color: "var(--m3-on-surface-var)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Playlists
          </span>
          <button className="m-icon-btn" style={{ width: 32, height: 32 }} title="New playlist">
            <span className="msym s20">add</span>
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {playlists.map(pl => <PlaylistItem key={pl.id} pl={pl}/>)}
      </div>

      {!collapsed && (
        <button className="m-fab" style={{ height: 48, width: "100%", justifyContent: "center", marginTop: 8 }}>
          <span className="msym s20">add</span> Create
        </button>
      )}
    </aside>
  );
};

window.M3Sidebar = M3Sidebar;
