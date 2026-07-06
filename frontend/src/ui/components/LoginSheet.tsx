// ============================================================
// LoginSheet — provider login as a bottom sheet. For NCM it shows a QR to scan
// with the mobile app and polls until authorized; the credential is persisted
// by the provider, so on success we just mark logged-in and close.
// ============================================================
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LoginFlow, LoginStatus } from "@domain";
import { Sheet } from "@/components/Sheet";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL_KEY: Record<LoginStatus["state"], string> = {
  pending: "login.pending",
  scanned: "login.scanned",
  authorized: "login.authorized",
  expired: "login.expired",
};

export function LoginSheet({
  open,
  onClose,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
}) {
  const { t } = useTranslation();
  const { beginLogin, markLoggedIn } = useAuth();
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [status, setStatus] = useState<LoginStatus["state"]>("pending");

  useEffect(() => {
    if (!open) {
      setFlow(null);
      setStatus("pending");
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void beginLogin().then((f) => {
      if (!alive) return;
      setFlow(f);
      if (f.kind !== "qr") return;
      const tick = async () => {
        const s = await f.poll();
        if (!alive) return;
        setStatus(s.state);
        if (s.state === "authorized") {
          markLoggedIn();
          onClose();
          return;
        }
        if (s.state === "expired") return; // stop; user reopens to retry
        timer = setTimeout(tick, 2000);
      };
      timer = setTimeout(tick, 2000);
    });
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one login attempt per open
  }, [open]);

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
        <div className="text-[20px] font-light">{t("login.title")}</div>
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
