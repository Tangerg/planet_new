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
import { useTranslation } from "react-i18next";
import { LOCALES, LOCALE_LABELS } from "@/i18n";

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
    <div className="flex items-center justify-between border-b border-white/[0.08] py-4">
      <div>
        <div className="text-[16px] font-light">{label}</div>
        {sub && <div className="mlabel mt-[5px] text-[10px] text-white/40">{sub}</div>}
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
  options: { value: string; label: string }[];
  onChange: (o: string) => void;
}) {
  return (
    <div className="border-b border-white/[0.08] py-4">
      <div className="mb-3 text-[16px] font-light">{label}</div>
      <ToggleGroup
        ariaLabel={label}
        className="seg"
        value={value}
        onValueChange={onChange}
        items={options}
      />
    </div>
  );
}

/** Plain string options (token values shown as-is, e.g. STD / HQ / SQ). */
const seg = (...values: string[]) => values.map((v) => ({ value: v, label: v }));

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
  const { t, i18n } = useTranslation();
  const s = settings;
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [k]: v }));
  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 90% at 80% 0%, #14161d, #0a0a0d)" }}
    >
      <div className="mx-auto max-w-[620px] px-10 pb-[60px] pt-[70px]">
        <div className="text-[36px] font-extralight tracking-[0.02em]">{t("settings.title")}</div>
        <div className="mlabel mt-2 text-white/40">{t("settings.subtitle")}</div>

        <div className="mt-[38px]">
          <div className="mlabel mb-1" style={{ color: accent }}>
            {t("settings.accent")}
          </div>
          <div className="flex gap-3 border-b border-white/[0.08] py-4">
            {accentOptions.map((col) => (
              <Button
                key={col}
                onClick={() => setAccent(col)}
                aria-label={col}
                className="grid h-[38px] w-[38px] place-items-center rounded-full"
                style={{
                  background: col,
                  border: accent === col ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: accent === col ? `0 0 18px -2px ${col}` : "none",
                }}
              >
                {accent === col && (
                  <span className="text-[#06060a]">
                    <Icon.check size={16} />
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-[30px]">
          <div className="mlabel mb-1" style={{ color: accent }}>
            {t("settings.playback")}
          </div>
          <SetSeg
            label={t("settings.audioQuality")}
            value={s.quality}
            options={seg("STD", "HQ", "SQ")}
            onChange={(v) => up("quality", v)}
          />
          <SetSeg
            label={t("settings.npOpens")}
            value={s.npMode}
            options={seg("COVER", "LYRICS")}
            onChange={(v) => up("npMode", v)}
          />
          <SetToggle
            label={t("settings.crossfade")}
            sub={t("settings.crossfadeSub")}
            on={s.crossfade}
            onClick={() => up("crossfade", !s.crossfade)}
          />
          <SetToggle
            label={t("settings.gapless")}
            on={s.gapless}
            onClick={() => up("gapless", !s.gapless)}
          />
        </div>

        <div className="mt-[30px]">
          <div className="mlabel mb-1" style={{ color: accent }}>
            {t("settings.interface")}
          </div>
          <SetSeg
            label={t("settings.language")}
            value={i18n.resolvedLanguage ?? "en"}
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
            onChange={(v) => void i18n.changeLanguage(v)}
          />
          <SetToggle
            label={t("settings.waves")}
            sub={t("settings.wavesSub")}
            on={s.waves}
            onClick={() => up("waves", !s.waves)}
          />
          <SetToggle
            label={t("settings.reduceMotion")}
            on={s.reduceMotion}
            onClick={() => up("reduceMotion", !s.reduceMotion)}
          />
        </div>
      </div>
    </FadeIn>
  );
}
