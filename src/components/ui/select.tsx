"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  className?: string;
  triggerClassName?: string;
  /** For olive announcement bar */
  tone?: "default" | "light";
  /** Full-width field style (forms) */
  fullWidth?: boolean;
  disabled?: boolean;
};

export function Select({
  value,
  onChange,
  options,
  label,
  className,
  triggerClassName,
  tone = "default",
  fullWidth = false,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const light = tone === "light";

  const longestLabel = options.reduce(
    (longest, opt) => (opt.label.length > longest.length ? opt.label : longest),
    selected?.label ?? "",
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative inline-grid max-w-full text-start",
        fullWidth && "block w-full",
        className,
      )}
    >
      {label ? (
        <span className="sr-only" id={`${listId}-label`}>
          {label}
        </span>
      ) : null}
      {/* Invisible widest option keeps trigger/menu width stable across values */}
      {!fullWidth ? (
        <div
          className={cn(
            "invisible col-start-1 row-start-1 whitespace-nowrap",
            light
              ? "text-[11px] tracking-[0.06em]"
              : "px-3 text-xs uppercase tracking-[0.14em]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "inline-flex items-center justify-between gap-1.5",
              light ? "h-auto" : "h-9",
            )}
          >
            <span>{longestLabel}</span>
            <span className="size-3 shrink-0" />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${listId}-label` : undefined}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "col-start-1 row-start-1 inline-flex w-full items-center justify-between gap-1.5 outline-none transition-colors",
          fullWidth
            ? "h-11 rounded-full border border-border bg-paper px-4 text-sm text-ink hover:bg-cream"
            : light
              ? "bg-transparent text-[11px] tracking-[0.06em] text-cream hover:text-cream/90"
              : "h-9 rounded-full border border-border bg-paper px-3 text-xs uppercase tracking-[0.14em] text-ink hover:bg-cream",
          triggerClassName,
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform duration-200",
            open && "rotate-180",
            light ? "opacity-70" : "text-muted",
          )}
          strokeWidth={1.6}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-activedescendant={`${listId}-${value}`}
          className="absolute start-0 top-full z-50 mt-2 max-h-64 min-w-full w-max overflow-y-auto rounded-xl border border-border bg-paper shadow-[0_16px_40px_-20px_rgb(28_25_22_/_0.45)]"
        >
          {options.map((opt, i) => {
            const active = opt.value === value;
            const first = i === 0;
            const last = i === options.length - 1;
            return (
              <li key={opt.value} role="option" aria-selected={active} id={`${listId}-${opt.value}`}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center whitespace-nowrap px-3 py-2.5 text-start text-sm transition-colors",
                    first && "rounded-t-[0.7rem]",
                    last && "rounded-b-[0.7rem]",
                    active
                      ? "bg-olive text-cream"
                      : "text-ink hover:bg-sand/80",
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
