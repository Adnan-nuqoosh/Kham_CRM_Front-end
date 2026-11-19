"use client";

import Link from "next/link";
import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { friendlyApiError, storeApi } from "@/lib/api";
import { t } from "@/lib/i18n";
import { customerToUser, useShop } from "@/lib/store";
import {
  hasErrors,
  inputClass,
  sanitizeEmail,
  sanitizePersonName,
  sanitizePhone,
  validateLogin,
  validateRegister,
  type FieldErrors,
} from "@/lib/validation";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";

const fieldInput =
  "mt-2 h-11 w-full rounded-full border border-border bg-cream px-4 text-sm text-ink outline-none";

export function SignInModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const user = useShop((s) => s.user);
  const setSession = useShop((s) => s.setSession);
  const syncWishlistFromApi = useShop((s) => s.syncWishlistFromApi);
  const signOut = useShop((s) => s.signOut);
  const locale = useShop((s) => s.locale);
  const copy = t(locale);

  useEffect(() => {
    const on = () => {
      setOpen(true);
      setError(null);
      setFieldErrors({});
    };
    window.addEventListener("kham:open-signin", on);
    return () => window.removeEventListener("kham:open-signin", on);
  }, []);

  if (!open) return null;

  function clearField(key: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nextErrors =
      mode === "login"
        ? validateLogin({ email, password })
        : validateRegister({
            firstName,
            lastName,
            phone,
            email,
            password,
            passwordConfirm,
          });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await storeApi.login({ email: email.trim(), password })
          : await storeApi.register({
              first_name: firstName.trim(),
              last_name: lastName.trim() || null,
              email: email.trim(),
              phone: phone.trim(),
              password,
              password_confirmation: passwordConfirm,
            });
      const session = res.data;
      setSession(customerToUser(session.customer), session.token);
      await syncWishlistFromApi();
      setOpen(false);
      setPassword("");
      setPasswordConfirm("");
      setFieldErrors({});
    } catch (err) {
      setError(
        friendlyApiError(
          err,
          mode === "login"
            ? "Could not sign in. Check your email and password."
            : "Could not create your account. Please check the form.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.account}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 px-8 pb-2 pt-8">
          <h2 className="font-display text-3xl leading-none text-ink">
            {copy.account}
          </h2>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-sand"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.4} />
          </button>
        </div>
        <div className="scrollbar-theme min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-8">
        {user ? (
          <div className="mt-6">
            <p className="text-sm text-muted">
              {locale === "ar" ? "مسجّل الدخول كـ" : "Signed in as"}
            </p>
            <p className="mt-2 font-display text-3xl leading-tight text-ink">
              {user.name}
            </p>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/account/orders"
                onClick={() => setOpen(false)}
                className="text-sm underline underline-offset-4"
              >
                {locale === "ar" ? "طلباتي" : "My orders"}
              </Link>
              <Button
                variant="outline"
                className="border-ink/20"
                onClick={() => {
                  void signOut();
                  setOpen(false);
                }}
              >
                {copy.signOut}
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="flex gap-2 text-xs uppercase tracking-[0.16em]">
              <button
                type="button"
                className={
                  mode === "login" ? "text-ink" : "text-muted hover:text-ink"
                }
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setFieldErrors({});
                }}
              >
                Sign in
              </button>
              <span className="text-muted">/</span>
              <button
                type="button"
                className={
                  mode === "register" ? "text-ink" : "text-muted hover:text-ink"
                }
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setFieldErrors({});
                }}
              >
                Register
              </button>
            </div>
            {mode === "register" ? (
              <>
                <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                  First name
                  <input
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(sanitizePersonName(e.target.value));
                      clearField("firstName");
                    }}
                    autoComplete="given-name"
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    className={inputClass(
                      Boolean(fieldErrors.firstName),
                      fieldInput,
                    )}
                  />
                  <FieldError message={fieldErrors.firstName} />
                </label>
                <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                  Last name
                  <input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(sanitizePersonName(e.target.value));
                      clearField("lastName");
                    }}
                    autoComplete="family-name"
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    className={inputClass(
                      Boolean(fieldErrors.lastName),
                      fieldInput,
                    )}
                  />
                  <FieldError message={fieldErrors.lastName} />
                </label>
                <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                  Phone
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(sanitizePhone(e.target.value));
                      clearField("phone");
                    }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+20 100 000 0000"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    className={inputClass(
                      Boolean(fieldErrors.phone),
                      fieldInput,
                    )}
                  />
                  <FieldError message={fieldErrors.phone} />
                </label>
              </>
            ) : null}
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(sanitizeEmail(e.target.value));
                  clearField("email");
                }}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                className={inputClass(Boolean(fieldErrors.email), fieldInput)}
              />
              <FieldError message={fieldErrors.email} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField("password");
                }}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                aria-invalid={Boolean(fieldErrors.password)}
                className={inputClass(
                  Boolean(fieldErrors.password),
                  fieldInput,
                )}
              />
              <FieldError message={fieldErrors.password} />
              {mode === "register" ? (
                <p className="mt-1 text-[11px] normal-case tracking-normal text-muted">
                  At least 12 characters.
                </p>
              ) : null}
            </label>
            {mode === "register" ? (
              <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                Confirm password
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    clearField("passwordConfirm");
                  }}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.passwordConfirm)}
                  className={inputClass(
                    Boolean(fieldErrors.passwordConfirm),
                    fieldInput,
                  )}
                />
                <FieldError message={fieldErrors.passwordConfirm} />
              </label>
            ) : null}
            {error ? (
              <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm text-ink">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

export function StoryModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("kham:open-story", on);
    return () => window.removeEventListener("kham:open-story", on);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-olive">
        <button
          type="button"
          className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-cream/90 text-ink"
          onClick={() => setOpen(false)}
        >
          <X className="size-5" />
        </button>
        <div className="aspect-video grid place-items-center bg-olive-soft/40 text-cream">
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <Play className="size-10" strokeWidth={1.2} />
            <p className="font-display text-2xl">Our story film</p>
            <p className="max-w-sm text-sm text-cream/70">
              Coming soon — a short film from the hammam and the house atelier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
