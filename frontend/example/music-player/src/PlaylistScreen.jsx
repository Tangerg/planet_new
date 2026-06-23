// Playlist screen — slim wrapper that delegates to detail patterns from DetailScreens
const PlaylistScreen = ({ playlist, onPlay, current, playing, likedSet, toggleLike, setPlaying, accent }) => (
  <div>
    <DetailHero
      kind={playlist.kind}
      title={playlist.name}
      description={playlist.description}
      owner={playlist.owner}
      count={`${playlist.tracks.length} songs, about ${Math.round(playlist.tracks.length * 3.5)} min`}
      gradient={playlist.gradient}
      coverSeed={playlist.coverSeed}
    />
    <ActionBar playing={playing && current?.playlistId === playlist.id}
      gradient={playlist.gradient} accent={accent}
      onPlay={() => {
        if (current?.playlistId === playlist.id) setPlaying(!playing);
        else onPlay({ ...playlist.tracks[0], playlistId: playlist.id });
      }}/>
    {trackHeader()}
    <div style={{ padding: "8px 24px 24px" }}>
      {playlist.tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} idx={i}
          isCurrent={current?.id === t.id} isPlaying={playing}
          onPlay={(track) => onPlay({ ...track, playlistId: playlist.id })}
          liked={likedSet.has(t.id)} toggleLike={toggleLike} accent={accent}/>
      ))}
    </div>
  </div>
);
window.PlaylistScreen = PlaylistScreen;
