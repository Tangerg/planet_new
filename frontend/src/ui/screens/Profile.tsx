// ============================================================
// Profile — restrained music identity: square image · thin account type · rows.
// ============================================================
import React, { useState } from "react";
import { Account } from "@domain/model/account";
import type { VibeCollection } from "@/model/adapt";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";
import { LoginSheet } from "@/components/LoginSheet";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useAuth } from "@/hooks/useAuth";
import { compactCount } from "@shared/number";

type ProfileScreenProps = {
  accent: string;
  playlists: VibeCollection[];
  onOpenPlaylist: (playlist: VibeCollection) => void;
  mono: boolean;
};

export function ProfileScreen({ accent, playlists, onOpenPlaylist, mono }: ProfileScreenProps) {
  const open = useMorphOpen();
  const { supported, loggedIn, account, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const items = playlists.slice(0, 4);
  const [active, setActive] = useState(0);
  // Real counts once logged in; the anonymous demo identity keeps its placeholder.
  const followers = loggedIn && account ? compactCount(Account.followerCount(account)) : "598";
  const following = loggedIn && account ? compactCount(Account.followingCount(account)) : "6";
  const name = Account.displayName(account, "Lily Tran");
  return (
    <FadeIn className="relative h-full overflow-hidden bg-[#08080b]">
      <Art
        seed={3}
        grad={["#171a18", "#2a2e2a"]}
        images={account?.avatar}
        mono={mono}
        style={{ position: "absolute", inset: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(74% 92% at 18% 18%, rgba(255,255,255,.06), transparent 46%), linear-gradient(90deg, rgba(8,8,11,.58), rgba(8,8,11,.78) 58%, rgba(8,8,11,.9))",
          }}
        />
      </Art>
      <div
        className="relative z-[4] grid h-full px-14 pb-[92px] pt-[84px]"
        style={{ gridTemplateColumns: "minmax(0, 0.58fr) minmax(360px, 0.42fr)" }}
      >
        <div className="min-w-0">
          <div className="mlabel mb-4 text-[11px]" style={{ color: accent }}>
            Netease Cloud Music
          </div>
          <div className="text-[72px] font-extralight leading-none tracking-[0.01em]">Profile</div>

          <div className="mt-[78px] flex min-w-0 items-start gap-10">
            <Art
              images={account?.avatar}
              seed={9}
              grad={["#171a18", "#343932"]}
              className="h-[260px] w-[260px] flex-none"
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,.06), 0 24px 70px -34px rgba(0,0,0,.9)",
              }}
            />
            <div className="min-w-0 pt-[30px]">
              <div className="mlabel mb-[20px] inline-block pb-[8px]" style={{ color: accent }}>
                {loggedIn ? "Connected" : supported ? "Not connected" : "Local profile"}
              </div>
              <div className="max-w-[560px] truncate text-[42px] font-extralight leading-tight">
                {name}
              </div>
              <div className="mt-[30px] flex items-center gap-10">
                <div>
                  <div className="font-mono text-[18px] tracking-[0.1em]">{followers}</div>
                  <div className="mlabel mt-2 text-[10px] text-white/38">Followers</div>
                </div>
                <div className="h-[42px] w-px bg-white/16" />
                <div>
                  <div className="font-mono text-[18px] tracking-[0.1em]">{following}</div>
                  <div className="mlabel mt-2 text-[10px] text-white/38">Following</div>
                </div>
              </div>

              {supported && (
                <Button
                  onClick={loggedIn ? () => void logout() : () => setLoginOpen(true)}
                  className="mlabel mt-[74px] inline-flex items-center gap-3 px-0 py-2 text-[10px] text-white/55"
                >
                  {loggedIn ? "Log out" : "Log in with NetEase"}
                  <Icon.back size={13} className="rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center">
          <div className="w-full max-w-[560px]">
            <div className="mb-[22px] inline-block bg-[rgba(6,6,9,.82)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/85">
              Playlist
            </div>
            <div className="flex flex-col gap-3">
              {items.map((p, i) => {
                const on = i === active;
                return (
                  <Button
                    key={p.id}
                    onClick={(e) =>
                      open(e, {
                        seed: p.coverSeed,
                        grad: p.gradient,
                        image: p.image,
                        run: () => {
                          setActive(i);
                          onOpenPlaylist(p);
                        },
                      })
                    }
                    className="grid min-h-[78px] grid-cols-[48px_minmax(0,1fr)_24px] items-center gap-6 px-0 py-1 text-left"
                    style={{
                      color: on ? accent : "rgba(255,255,255,.78)",
                      background: on
                        ? "linear-gradient(90deg, rgba(18,255,131,.16), transparent 78%)"
                        : "transparent",
                    }}
                  >
                    <Art
                      seed={p.coverSeed}
                      grad={p.gradient}
                      image={p.image}
                      images={p.images}
                      className="h-12 w-12"
                      style={{
                        boxShadow: on ? `0 0 0 1px ${accent}` : "none",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[21px] font-light">{p.name}</div>
                      <div
                        className="mlabel mt-[7px] text-[10px]"
                        style={{ color: on ? accent : "rgba(255,255,255,.32)" }}
                      >
                        {p.trackCount ?? p.tracks.length} tracks
                      </div>
                      {on && (
                        <div className="mt-[15px] h-px w-full" style={{ background: accent }} />
                      )}
                    </div>
                    <Icon.back size={17} className="rotate-180 opacity-60" />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} accent={accent} />
    </FadeIn>
  );
}
