// ============================================================
// Settings — accent, playback and interface preferences.
// ============================================================
import React from "react";
import type { Settings } from "@/model/defaults";
import { Icon } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { Switch } from "@/components/controls/Switch";
import { ToggleGroup } from "@/components/controls/ToggleGroup";

function SetToggle({
  label,
  sub,
  on,
  onClick,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 300 }}>{label}</div>
        {sub && (
          <div
            className="mlabel"
            style={{ color: "rgba(255,255,255,.4)", marginTop: 5, fontSize: 10 }}
          >
            {sub}
          </div>
        )}
      </div>
      <Switch checked={on} onCheckedChange={() => onClick()} aria-label={label} />
    </div>
  );
}

function SetSeg({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (o: string) => void;
}) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ fontSize: 16, fontWeight: 300, marginBottom: 12 }}>{label}</div>
      <ToggleGroup
        ariaLabel={label}
        className="seg"
        value={value}
        onValueChange={onChange}
        items={options.map((o) => ({ value: o, label: o }))}
      />
    </div>
  );
}

type SettingsScreenProps = {
  accent: string;
  setAccent: (col: string) => void;
  accentOptions: string[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export function SettingsScreen({
  accent,
  setAccent,
  accentOptions,
  settings,
  setSettings,
}: SettingsScreenProps) {
  const s = settings;
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [k]: v }));
  return (
    <FadeIn
      className="scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 90% at 80% 0%, #14161d, #0a0a0d)",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "70px 40px 60px" }}>
        <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: ".02em" }}>Preferences</div>
        <div className="mlabel" style={{ color: "rgba(255,255,255,.4)", marginTop: 8 }}>
          Personalize Sonance
        </div>

        <div style={{ marginTop: 38 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Accent
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              padding: "16px 0",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            {accentOptions.map((col) => (
              <Button
                key={col}
                onClick={() => setAccent(col)}
                aria-label={col}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: col,
                  cursor: "pointer",
                  border: accent === col ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: accent === col ? `0 0 18px -2px ${col}` : "none",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {accent === col && (
                  <span style={{ color: "#06060a" }}>
                    <Icon.check size={16} />
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Playback
          </div>
          <SetSeg
            label="Audio quality"
            value={s.quality}
            options={["STD", "HQ", "SQ"]}
            onChange={(v) => up("quality", v)}
          />
          <SetSeg
            label="Now Playing opens"
            value={s.npMode}
            options={["COVER", "LYRICS"]}
            onChange={(v) => up("npMode", v)}
          />
          <SetToggle
            label="Crossfade tracks"
            sub="8 second blend"
            on={s.crossfade}
            onClick={() => up("crossfade", !s.crossfade)}
          />
          <SetToggle
            label="Gapless playback"
            on={s.gapless}
            onClick={() => up("gapless", !s.gapless)}
          />
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Interface
          </div>
          <SetToggle
            label="Flowing waves"
            sub="Animated XMB background"
            on={s.waves}
            onClick={() => up("waves", !s.waves)}
          />
          <SetToggle
            label="Show hot comments"
            on={s.comments}
            onClick={() => up("comments", !s.comments)}
          />
          <SetToggle
            label="Reduce motion"
            on={s.reduceMotion}
            onClick={() => up("reduceMotion", !s.reduceMotion)}
          />
        </div>
      </div>
    </FadeIn>
  );
}
