import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";

/** Small "clear queue" text button shared by the Queue screen and the Up Next sheet. */
export function QueueClearButton({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      className="mlabel flex items-center gap-1 px-2 py-1 text-[10px] text-white/50 hover:text-white"
      onClick={onClear}
      aria-label={t("queue.clear")}
    >
      <Icon.close size={13} />
      {t("common.clear")}
    </Button>
  );
}
