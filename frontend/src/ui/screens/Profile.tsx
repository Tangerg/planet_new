// ============================================================
// Profile — restrained music identity: square image · thin account type · rows.
// ============================================================
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VibeCollection } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";
import { LoginSheet } from "@/components/LoginSheet";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useAuth } from "@/hooks/useAuth";
import { profileScreenModel } from "@/model/profile";

type ProfileScreenProps = {
  accent: string;
  playlists: VibeCollection[];
  onOpenPlaylist: (playlist: VibeCollection) => void;
  mono: boolean;
};

export function ProfileScreen({ accent, playlists, onOpenPlaylist, mono }: ProfileScreenProps) {
  const { t } = useTranslation();
  const open = useMorphOpen();
  const { supported, loggedIn, account, beginLogin, markLoggedIn, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [active, setActive] = useState(0);
  const model = profileScreenModel({
    account,
    activePlaylistIndex: active,
    loggedIn,
    playlists,
    supported,
  });
  const connectionLabel = loggedIn
    ? t("profile.connected")
    : supported
      ? t("profile.notConnected")
      : t("profile.localProfile");
  const authActionLabel = supported ? (loggedIn ? t("profile.logout") : t("profile.login")) : "";
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
            {t("profile.brand")}
          </div>
          <div className="text-[72px] font-extralight leading-none tracking-[0.01em]">
            {t("profile.title")}
          </div>

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
                {connectionLabel}
              </div>
              <div className="flex max-w-[560px] items-center gap-3">
                <div className="min-w-0 truncate text-[42px] font-extralight leading-tight">
                  {model.name}
                </div>
                {model.membership && (
                  <span
                    className="mlabel flex-none rounded-full px-2.5 py-[5px] text-[10px]"
                    style={{
                      color: accent,
                      background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                    }}
                  >
                    {t("profile.premium")}
                  </span>
                )}
              </div>
              <div className="mt-[30px] flex items-center gap-10">
                <div>
                  <div className="font-mono text-[18px] tracking-[0.1em] tabular-nums">
                    {model.followers}
                  </div>
                  <div className="mlabel mt-2 text-[10px] text-white/38">
                    {t("profile.followers")}
                  </div>
                </div>
                <div className="h-[42px] w-px bg-white/16" />
                <div>
                  <div className="font-mono text-[18px] tracking-[0.1em] tabular-nums">
                    {model.following}
                  </div>
                  <div className="mlabel mt-2 text-[10px] text-white/38">
                    {t("profile.following")}
                  </div>
                </div>
              </div>

              {authActionLabel && (
                <Button
                  onClick={loggedIn ? () => void logout() : () => setLoginOpen(true)}
                  className="mlabel mt-[74px] inline-flex items-center gap-3 px-0 py-2 text-[10px] text-white/55"
                >
                  {authActionLabel}
                  <Icon.back size={13} className="rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center">
          <div className="w-full max-w-[560px]">
            <div className="mb-[22px] inline-block bg-[rgba(6,6,9,.82)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/85">
              {t("common.playlist")}
            </div>
            <div className="flex flex-col gap-3">
              {model.playlists.map(({ active: on, playlist: p, trackCount }, i) => {
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
                        ? "linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent 78%)"
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
                        {t("counts.tracks", { count: trackCount })}
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
      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        accent={accent}
        beginLogin={beginLogin}
        markLoggedIn={markLoggedIn}
      />
    </FadeIn>
  );
}
