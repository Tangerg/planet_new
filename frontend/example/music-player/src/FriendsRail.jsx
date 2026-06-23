// Right-side Friends rail
const FriendsRail = ({ friends, onClose, accent }) => (
  <div style={{
    background: "#000", height: "100%", overflow: "hidden",
    display: "flex", flexDirection: "column", padding: 8, boxSizing: "border-box",
  }}>
    <div style={{
      background: "#121212", borderRadius: 8, height: "100%",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "16px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Friend Activity</div>
        <div style={{ display: "flex", gap: 4 }}>
          <CircleBtn size={28}><I.Friends size={16}/></CircleBtn>
          <CircleBtn size={28} onClick={onClose}><I.X size={16}/></CircleBtn>
        </div>
      </div>
      <div style={{ overflow: "auto", padding: "0 4px 8px" }}>
        {friends.map(f => (
          <div key={f.id} style={{
            display: "flex", gap: 10, padding: "8px 10px", borderRadius: 4, cursor: "pointer",
            opacity: f.idle ? 0.78 : 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#1f1f1f"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Cover seed={f.seed} size={36} radius={"50%"}/>
              {!f.idle && (
                <span style={{
                  position: "absolute", right: -2, bottom: -2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: accent || "#1ed760", border: "2px solid #121212",
                }}/>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                <span style={{ color: "#b3b3b3", fontSize: 11, flexShrink: 0 }}>{f.minutes}m</span>
              </div>
              <div style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <I.Mic size={10}/> {f.artist} · <span style={{ color: "#cbcbcb" }}>{f.track}</span>
              </div>
              <div style={{ color: "#7c7c7c", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                on {f.on}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

window.FriendsRail = FriendsRail;
