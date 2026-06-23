// Home — sections of cards, with onAlbum/onArtist hooks
const CardItem = ({ item, idx, onPlay, onClick, currentId, playing, isCircle, accent }) => {
  const [hover, setHover] = React.useState(false);
  const isCurrent = currentId === item.id && playing;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#1f1f1f" : "#181818",
        borderRadius: 8, padding: 16, gap: 14,
        display: "flex", flexDirection: "column",
        cursor: "pointer", transition: "background 200ms",
        position: "relative",
      }}>
      <div style={{ position: "relative" }}>
        <Cover seed={idx} size="100%" radius={isCircle ? "50%" : 6}/>
        <div style={{
          position: "absolute", right: 8, bottom: 8,
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 200ms, transform 200ms",
        }}>
          <button onClick={(e) => { e.stopPropagation(); onPlay && onPlay(item); }} style={{
            background: accent || "#1ed760", color: "#000", border: "none", borderRadius: "50%",
            width: 48, height: 48, display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "rgba(0,0,0,0.5) 0 8px 16px",
          }}>
            <I.Play size={20}/>
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title || item.name}</div>
        <div style={{ color: "#b3b3b3", fontSize: 14, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.subtitle}</div>
      </div>
    </div>
  );
};

const Section = ({ title, items, onPlay, onClickItem, currentId, playing, offset = 0, isCircle, accent }) => (
  <section style={{ marginBottom: 32 }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      <a style={{ color: "#b3b3b3", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer" }}>Show all</a>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
      {items.map((item, i) => (
        <CardItem key={item.id} item={item} idx={i + offset} onPlay={onPlay} accent={accent} isCircle={isCircle}
          onClick={() => onClickItem && onClickItem(item)}
          currentId={currentId} playing={playing}/>
      ))}
    </div>
  </section>
);

const Greeting = () => {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return <h1 style={{ color: "#fff", fontFamily: "var(--font-title)", fontSize: 32, fontWeight: 700, margin: "8px 0 24px", letterSpacing: "-0.02em" }}>{g}</h1>;
};

const QuickRow = ({ items, onPlay, currentId, playing, onClickItem, accent }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
    {items.slice(0, 6).map((item, i) => {
      const [hover, setHover] = React.useState(false);
      const isCurrent = currentId === item.id && playing;
      return (
        <div key={item.id}
          onClick={() => onClickItem && onClickItem(item)}
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{
            background: hover ? "#272727" : "#1a1a1a",
            borderRadius: 6, display: "flex", alignItems: "center",
            cursor: "pointer", transition: "background 200ms",
            overflow: "hidden", position: "relative",
          }}>
          {item.id === "qi-0-0" ? (
            <div style={{
              width: 64, height: 64, flexShrink: 0,
              background: "linear-gradient(135deg, #4a3aa6 0%, #cbcbcb 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.HeartF size={20} fill style={{ color: "#fff" }}/>
            </div>
          ) : (
            <Cover seed={i} size={64} radius={0}/>
          )}
          <span style={{ color: isCurrent ? (accent || "#1ed760") : "#fff", fontWeight: 700, fontSize: 15, padding: "0 12px", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
          <div style={{ paddingRight: 16, opacity: hover ? 1 : 0, transition: "opacity 200ms" }}>
            <button onClick={(e) => { e.stopPropagation(); onPlay && onPlay(item); }} style={{
              background: accent || "#1ed760", color: "#000", border: "none", borderRadius: "50%",
              width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "rgba(0,0,0,0.5) 0 8px 16px",
            }}>
              <I.Play size={16}/>
            </button>
          </div>
        </div>
      );
    })}
  </div>
);

const HomeScreen = ({ data, onPlay, currentId, playing, accent, onOpenPlaylist, onOpenAlbum, onOpenArtist, onOpenLiked }) => {
  const open = (it) => {
    if (it.id === "qi-0-0") return onOpenLiked && onOpenLiked();
    if (String(it.id).startsWith("p-dm1")) return onOpenPlaylist && onOpenPlaylist("dm1");
    if (String(it.id).startsWith("p-dw")) return onOpenPlaylist && onOpenPlaylist("dw");
    if (String(it.id).startsWith("p-")) return onOpenPlaylist && onOpenPlaylist("dm1");
    onOpenPlaylist && onOpenPlaylist("dm1");
  };
  const openAlbum = (it) => onOpenAlbum && onOpenAlbum(MOCK.albums[Math.floor(Math.random() * MOCK.albums.length)].id);
  const artistsRow = MOCK.artists.slice(0, 5).map(a => ({ id: a.id, title: a.name, subtitle: "Artist" }));

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <Greeting/>
      <QuickRow items={data.quick} onPlay={onPlay} onClickItem={open} currentId={currentId} playing={playing} accent={accent}/>
      <Section title="Made For You"     items={data.madeFor} offset={6}  onPlay={onPlay} onClickItem={open} accent={accent} currentId={currentId} playing={playing}/>
      <Section title="Recently played"  items={data.recent}  offset={11} onPlay={onPlay} onClickItem={openAlbum} accent={accent} currentId={currentId} playing={playing}/>
      <Section title="Your top artists" items={artistsRow}   offset={1}  onPlay={(a) => onOpenArtist && onOpenArtist(a.id)} onClickItem={(a) => onOpenArtist && onOpenArtist(a.id)} accent={accent} isCircle/>
      <Section title="Popular albums"   items={data.popular} offset={16} onPlay={onPlay} onClickItem={openAlbum} accent={accent} currentId={currentId} playing={playing}/>
      <Section title="Jump back in"     items={data.jumpBack} offset={3} onPlay={onPlay} onClickItem={open} accent={accent} currentId={currentId} playing={playing}/>
    </div>
  );
};

window.HomeScreen = HomeScreen;
