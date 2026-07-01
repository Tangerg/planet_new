import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";

type Props = {
  count: number;
  onOpen: () => void;
};

export function UpNextHandle({ count, onOpen }: Props) {
  return (
    <Button
      onClick={onOpen}
      aria-label="Up Next"
      className="absolute bottom-[22px] left-1/2 z-[9] flex -translate-x-1/2 items-center gap-[9px] rounded-full px-[18px] py-[9px] text-white/[0.82]"
      style={{
        background: "rgba(10,10,13,.62)",
        border: "1px solid rgba(255,255,255,.14)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 8px 24px -10px rgba(0,0,0,.7)",
      }}
    >
      <span className="mlabel text-[10px]">Up Next · {count}</span>
      <span className="grid rotate-90 place-items-center">
        <Icon.back size={14} />
      </span>
    </Button>
  );
}
