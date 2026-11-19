"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">404</p>
      <h1 className="mt-3 font-display text-5xl">This page has wandered.</h1>
      <p className="mt-4 text-sm text-muted">Back to the house, or into the collection.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/">
          <Button>Home</Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline">Shop</Button>
        </Link>
      </div>
    </div>
  );
}
