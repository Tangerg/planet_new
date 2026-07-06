// ============================================================
// Settings — accent, playback and interface preferences.
// ============================================================
import React from "react";
import type { Settings } from "@/model/defaults";
import { Icon } from "@/infra/icons";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { Switch } from "@/components/controls/Switch";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { useTranslation } from "react-i18next";
import { LOCALES, LOCALE_LABELS } from "@/i18n";
import { useLibrarySourceSettings } from "@/hooks/useLibrarySourceSettings";
import { AUDIO_QUALITY_OPTIONS, NOW_PLAYING_OPEN_OPTIONS } from "@/model/settings-screen";

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

/**
 * On-device music: switch the active source among mounted providers and scan a
 * folder into the local library. A successful scan auto-switches to the local
 * source and invalidates cached catalog reads, so the imported music shows at
 * once (Engine.media reads through the active provider).
 */
function LibrarySection({ accent }: { accent: string }) {
  const { t } = useTranslation();
  const library = useLibrarySourceSettings();
  const statusDescriptor = library.status;
  const status =
    "values" in statusDescriptor
      ? t(statusDescriptor.key, statusDescriptor.values)
      : t(statusDescriptor.key);

  return (
    <div className="mt-[30px]">
      <div className="mlabel mb-1" style={{ color: accent }}>
        {t("settings.library")}
      </div>

      {library.sources.length > 1 && (
        <SetSeg
          label={t("settings.source")}
          value={library.source}
          options={library.options}
          onChange={library.switchSource}
        />
      )}

      <div className="flex items-center justify-between border-b border-white/[0.08] py-4">
        <div>
          <div className="text-[16px] font-light">{t("settings.addFolder")}</div>
          <div className="mlabel mt-[5px] text-[10px] text-white/40">{status}</div>
        </div>
        <Button
          onClick={() => void library.addFolder()}
          disabled={library.scan.phase === "scanning"}
          aria-label={t("settings.addFolder")}
          className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-light disabled:opacity-50"
          style={{ color: accent }}
        >
          <Icon.note size={15} />
          {t("settings.addFolder")}
        </Button>
      </div>
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
            options={AUDIO_QUALITY_OPTIONS}
            onChange={(v) => up("quality", v)}
          />
          <SetSeg
            label={t("settings.npOpens")}
            value={s.npMode}
            options={NOW_PLAYING_OPEN_OPTIONS}
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

        <LibrarySection accent={accent} />

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
