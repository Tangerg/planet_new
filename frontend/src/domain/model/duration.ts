/**
 * Rich duration value object: carries a preformatted string alongside the raw
 * milliseconds. Distinct from the bare numeric duration used elsewhere.
 */
export type FormattedDuration = {
  duration: number;
  durationFormatted?: string;
};

export type Progress = FormattedDuration & {
  percent: number;
};

export const InfinityDuration: FormattedDuration = {
  duration: Infinity,
  durationFormatted: "--:--:--",
};
