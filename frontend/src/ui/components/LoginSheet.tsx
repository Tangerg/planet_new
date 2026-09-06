// ============================================================
// LoginSheet — provider login as a bottom sheet. For NCM it shows a QR to scan
// with the mobile app and polls until authorized; the credential is persisted
// by the provider, so on success we just mark logged-in and close.
// ============================================================
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { LoginFlow, LoginStatus } from "@contexts/identity";
import { warnReadFailure } from "@shared/debug";
import { Sheet } from "@/components/Sheet";
import { useAccent } from "@/hooks/accent";

type LoginViewStatus = LoginStatus["state"] | "failed";

const STATUS_LABEL_KEY: Record<LoginViewStatus, string> = {
  pending: "login.pending",
  scanned: "login.scanned",
  authorized: "login.authorized",
  expired: "login.expired",
  failed: "login.failed",
};

export function LoginSheet({
  open,
  onClose,
  beginLogin,
  markLoggedIn,
  sourceName,
}: {
  open: boolean;
  onClose: () => void;
  beginLogin: () => Promise<LoginFlow>;
  markLoggedIn: () => void;
  /** The source being logged into, already resolved — the sheet stays a leaf. */
  sourceName: string;
}) {
  const { t } = useTranslation();
  const accent = useAccent();
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [status, setStatus] = useState<LoginViewStatus>("pending");

  useEffect(() => {
    if (!open) {
      setFlow(null);
      setStatus("pending");
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void beginLogin()
      .then((f) => {
        if (!alive) return;
        setFlow(f);
        if (f.kind !== "qr") {
          const error = new Error(`Unsupported login flow: ${f.kind}`);
          warnReadFailure("identity.login.flow", error);
          setStatus("failed");
          return;
        }
        const tick = async () => {
          try {
            const next = await f.poll();
            if (!alive) return;
            setStatus(next.state);
            if (next.state === "authorized") {
              markLoggedIn();
              onClose();
              return;
            }
            if (next.state === "expired") return; // stop; user reopens to retry
            timer = setTimeout(tick, 2000);
          } catch (error) {
            if (!alive) return;
            warnReadFailure("identity.login.poll", error);
            setStatus("failed");
          }
        };
        timer = setTimeout(tick, 2000);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        warnReadFailure("identity.login.begin", error);
        setStatus("failed");
      });
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [beginLogin, markLoggedIn, onClose, open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      label={t("login.label")}
      overlayClassName="z-[79]"
      className="z-[80] rounded-t-[26px]"
      style={{
        background: "rgba(16,16,22,.97)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <div className="flex flex-col items-center gap-5 px-12 py-11">
        <div className="text-[20px] font-light">{t("login.title", { source: sourceName })}</div>
        {flow?.kind === "qr" && flow.image ? (
          <img
            src={flow.image}
            alt={t("login.qrAlt")}
            className="h-[220px] w-[220px] rounded-2xl bg-white p-2.5"
          />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded-2xl bg-white/10" />
        )}
        <div className="mlabel text-[11px]" style={{ color: accent }}>
          {t(STATUS_LABEL_KEY[status])}
        </div>
      </div>
    </Sheet>
  );
}
