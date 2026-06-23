// Top bar — desktop chrome with traffic lights, history nav, contextual search, profile menu
const TopBar = ({ query, setQuery, mode, accent, onSetActive, history, historyIdx, goBack, goFwd }) => {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);
  const canBack = historyIdx > 0;
  const canFwd  = historyIdx < (history.length - 1);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px",
      background: "rgba(18,18,18,0.6)",
      backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 5,
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CircleBtn size={32} bg="rgba(0,0,0,0.7)" color={canBack ? "#fff" : "#7c7c7c"} onClick={goBack}><I.ChevronL size={18}/></CircleBtn>
        <CircleBtn size={32} bg="rgba(0,0,0,0.7)" color={canFwd ? "#fff" : "#7c7c7c"} onClick={goFwd}><I.Chevron size={18}/></CircleBtn>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", maxWidth: 480 }}>
        <CircleBtn size={48} bg="#1f1f1f" color="#fff" onClick={() => onSetActive("home")}><I.HomeO size={22} stroke={2}/></CircleBtn>
        <div style={{ flex: 1 }}>
          <div style={{
            background: "#1f1f1f", borderRadius: 500,
            display: "flex", alignItems: "center",
            padding: "0 12px 0 16px", height: 48, gap: 10,
            boxShadow: mode === "search" ? "inset 0 0 0 2px #fff" : "inset 0 0 0 1px #2a2a2a",
            transition: "box-shadow 120ms",
          }}>
            <I.Search size={18} stroke={2.5}/>
            <input
              value={query || ""} onChange={(e) => { setQuery(e.target.value); if (e.target.value && mode !== "search") onSetActive("search"); }}
              onFocus={() => onSetActive("search")}
              placeholder="What do you want to play?"
              style={{
                background: "transparent", border: "none", outline: "none",
                color: "#fff", fontFamily: "var(--font-ui)", fontSize: 14, flex: 1,
              }}/>
            <div style={{ width: 1, height: 24, background: "#7c7c7c" }}/>
            <CircleBtn size={36} color="#fff"><I.Library size={20}/></CircleBtn>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        <Pill variant="outline" uppercase>Install App</Pill>
        <div style={{ position: "relative" }}>
          <CircleBtn size={32} bg="rgba(0,0,0,0.7)" color="#fff" onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false); }}>
            <I.Bell size={16}/>
          </CircleBtn>
          {bellOpen && (
            <div style={{
              position: "absolute", right: 0, top: 40, width: 320,
              background: "#272727", borderRadius: 8, padding: 8,
              boxShadow: "rgba(0,0,0,0.5) 0 8px 24px", zIndex: 10,
            }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, padding: "8px 12px" }}>What's New</div>
              {MOCK.notifications.map(n => (
                <div key={n.id} style={{ padding: "10px 12px", borderRadius: 6, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{n.title}</span>
                    <span style={{ color: "#7c7c7c", fontSize: 11, flexShrink: 0 }}>{n.time}</span>
                  </div>
                  <span style={{ color: "#b3b3b3", fontSize: 12 }}>{n.body}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <CircleBtn size={32} bg="rgba(0,0,0,0.7)" color="#fff"><I.Friends size={16}/></CircleBtn>
        <div style={{ position: "relative" }}>
          <div onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false); }} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#5a1a3a,#ff5577)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>L</div>
          {profileOpen && (
            <div style={{
              position: "absolute", right: 0, top: 40, width: 220,
              background: "#272727", borderRadius: 4, padding: 4,
              boxShadow: "rgba(0,0,0,0.5) 0 8px 24px", zIndex: 10,
            }}>
              {["Account","Profile","Upgrade to Premium","Settings","Log out"].map(item => (
                <div key={item} style={{ color: "#fff", padding: "10px 12px", fontSize: 14, cursor: "pointer", borderRadius: 4 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#3e3e3e"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.TopBar = TopBar;
