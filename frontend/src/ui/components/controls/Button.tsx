import React from "react";
import { cn } from "@/lib/cn";
import "./Button.css";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
};

export function Button({ ref, className, type, ...rest }: ButtonProps) {
  return <button ref={ref} className={cn("btn", className)} type={type ?? "button"} {...rest} />;
}
