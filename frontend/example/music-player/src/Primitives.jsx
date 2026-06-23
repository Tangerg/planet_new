// Reusable, "cosmetic" Sonance components.

const Pill = ({ children, variant = "dark", uppercase = false, onClick, style = {} }) => {
  const variants = {
    primary: { bg: "#1ed760", color: "#000", radius: 500, padding: "14px 32px", weight: 700 },
    dark:    { bg: "#1f1f1f", color: "#fff", radius: 9999, padding: "8px 16px",  weight: 700 },
    light:   { bg: "#eeeeee", color: "#181818", radius: 500, padding: "10px 20px", weight: 700 },
    outline: { bg: "transparent", color: "#fff", radius: 9999, padding: "6px 18px", weight: 700, border: "1px solid #7c7c7c" },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      background: v.bg, color: v.color, border: v.border || "none",
      borderRadius: v.radius, padding: v.padding,
      fontFamily: "var(--font-ui)", fontWeight: v.weight,
      fontSize: 14, letterSpacing: uppercase ? "0.14em" : "0.01em",
      textTransform: uppercase ? "uppercase" : "none",
      cursor: "pointer", transition: "transform 120ms, background 120ms, border-color 120ms",
      ...style,
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
    onMouseUp={(e)   => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={(e)=> e.currentTarget.style.transform = "scale(1)"}
    >{children}</button>
  );
};

const CircleBtn = ({ children, size = 40, bg = "transparent", color = "#b3b3b3", hoverColor = "#fff", onClick, style = {} }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: bg, color: hover ? hoverColor : color,
        border: "none", borderRadius: "50%",
        width: size, height: size,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "color 120ms, transform 120ms, background 120ms",
        ...style,
      }}>{children}</button>
  );
};

const PlayCircle = ({ size = 56, onClick, playing = false }) => (
  <button onClick={onClick} style={{
    background: "#1ed760", color: "#000",
    border: "none", borderRadius: "50%",
    width: size, height: size,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    boxShadow: "rgba(0,0,0,0.5) 0px 8px 16px",
    transition: "transform 120ms, background 120ms",
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
  >
    {playing ? <I.Pause size={size * 0.42}/> : <I.Play size={size * 0.42}/>}
  </button>
);

const Cover = ({ seed = 0, size = "100%", radius = 6, children, style = {} }) => {
  const palettes = [
    ["#3b1d4a", "#1ed760"],
    ["#0d3a3a", "#7adfae"],
    ["#3a0d10", "#f3727f"],
    ["#1a2e5a", "#539df5"],
    ["#4a3a0d", "#ffa42b"],
    ["#2a0d3a", "#a44dff"],
    ["#0a3a2a", "#1ed760"],
    ["#5a1a3a", "#ff5577"],
    ["#0d1f3a", "#88ccff"],
    ["#3a3a0d", "#e0e060"],
    ["#1a0d3a", "#7755ff"],
    ["#3a2a0d", "#dd9944"],
  ];
  const [a, b] = palettes[seed % palettes.length];
  return (
    <div style={{
      width: size, aspectRatio: "1", borderRadius: radius,
      background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      position: "relative", flexShrink: 0,
      ...style,
    }}>{children}</div>
  );
};

const SearchPill = ({ value, onChange, placeholder = "What do you want to play?", focused }) => {
  const [f, setF] = React.useState(false);
  const isFocused = focused !== undefined ? focused : f;
  return (
    <div style={{
      background: "#1f1f1f",
      borderRadius: 500,
      boxShadow: isFocused
        ? "inset 0 0 0 2px #fff, 0 0 0 2px #000"
        : "inset 0 0 0 1px #2a2a2a, 0 1px 0 #121212",
      display: "flex", alignItems: "center",
      padding: "0 16px", height: 44, gap: 12,
      transition: "box-shadow 120ms",
      width: "100%", maxWidth: 360,
    }}>
      <I.Search size={18} stroke={2.5}/>
      <input
        value={value || ""} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        placeholder={placeholder}
        style={{
          background: "transparent", border: "none", outline: "none",
          color: "#fff", fontFamily: "var(--font-ui)", fontSize: 14, flex: 1,
        }}/>
    </div>
  );
};

const Badge = ({ children, variant = "dark" }) => {
  const styles = {
    dark:    { bg: "#272727", color: "#fff" },
    accent:  { bg: "#1ed760", color: "#000" },
    outline: { bg: "transparent", color: "#b3b3b3", border: "1px solid #4d4d4d" },
  };
  const s = styles[variant];
  return (
    <span style={{
      background: s.bg, color: s.color, border: s.border || "none",
      padding: "3px 8px", borderRadius: 2,
      fontSize: 10.5, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
      lineHeight: 1.4,
    }}>{children}</span>
  );
};

const NowPlayingDot = ({ size = 14 }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: size, height: size,
  }}>
    <span style={{
      width: "55%", height: "55%", background: "#1ed760", borderRadius: "50%",
      animation: "sonance-pulse 1s ease-in-out infinite",
    }}/>
  </span>
);

Object.assign(window, { Pill, CircleBtn, PlayCircle, Cover, SearchPill, Badge, NowPlayingDot });
