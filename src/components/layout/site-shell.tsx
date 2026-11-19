"use client";

import { Toaster } from "sonner";
import { useEffect, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { AnnouncementBar, Header, MobileNav } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SignInModal, StoryModal } from "@/components/modals";
import { SearchOverlay } from "@/components/search-overlay";
import { CatalogProvider } from "@/lib/catalog-data";
import { useShop } from "@/lib/store";

function ShellInner({ children }: { children: ReactNode }) {
  const locale = useShop((s) => s.locale);
  const hydrateAuth = useShop((s) => s.hydrateAuth);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink">
      <AnnouncementBar />
      <Header />
      <MobileNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <SignInModal />
      <StoryModal />
      <Toaster
        position="bottom-center"
        toastOptions={{
          className:
            "!bg-olive !text-cream !border-none !rounded-full !font-sans",
        }}
      />
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <ShellInner>{children}</ShellInner>
    </CatalogProvider>
  );
}
