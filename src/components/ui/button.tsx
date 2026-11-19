import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-olive text-cream hover:bg-olive-soft border border-olive",
  outline:
    "border border-olive/25 bg-transparent text-ink hover:bg-sand",
  ghost: "text-ink hover:bg-sand/80",
  cream: "bg-cream text-olive hover:bg-paper border border-cream",
  invert:
    "border border-cream/35 bg-cream/10 text-cream hover:bg-cream/20",
  link: "text-ink underline-offset-4 hover:underline px-0 h-auto rounded-none",
} as const;

const sizes = {
  sm: "h-9 px-4 text-xs tracking-[0.14em] uppercase",
  md: "h-11 px-6 text-xs tracking-[0.16em] uppercase",
  lg: "h-12 px-8 text-xs tracking-[0.18em] uppercase",
  icon: "size-11 p-0",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  pill = true,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  pill?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,transform,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50",
        pill ? "rounded-full" : "rounded-md",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
