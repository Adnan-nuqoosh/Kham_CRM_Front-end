import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group flex flex-col leading-none tracking-wide", className)}
      aria-label="KHAM Cairo home"
    >
      <span
        className={cn(
          "font-display text-2xl font-medium tracking-[0.18em] sm:text-[1.65rem]",
          light ? "text-cream" : "text-ink",
        )}
      >
        KHAM
        <sup className="ms-0.5 text-[0.55em] tracking-normal">®</sup>
      </span>
      <span
        className={cn(
          "mt-0.5 text-[0.62rem] font-medium tracking-[0.42em]",
          light ? "text-cream/70" : "text-muted",
        )}
      >
        CAIRO
      </span>
    </Link>
  );
}

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" aria-hidden>
      <path
        d="M12 21c6-3 9-8.2 9-13.2C21 5 16 3 12 3S3 5 3 7.8C3 12.8 6 18 12 21Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M12 21V8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
