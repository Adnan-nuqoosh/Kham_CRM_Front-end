"use client";

import { useState } from "react";
import { friendlyApiError, storeApi, type PartnerApplicationInput } from "@/lib/api";
import {
  hasErrors,
  inputClass,
  sanitizeEmail,
  sanitizePersonName,
  sanitizePhone,
  validatePartner,
  type FieldErrors,
} from "@/lib/validation";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const PARTNER_TYPES: PartnerApplicationInput["partner_type"][] = [
  "retailer",
  "distributor",
  "influencer",
  "corporate",
  "other",
];

const fieldInput =
  "mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm text-ink outline-none";

export default function ForBrandsPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partnerType, setPartnerType] =
    useState<PartnerApplicationInput["partner_type"]>("retailer");
  const [message, setMessage] = useState("");

  function clearField(key: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Partners</p>
      <h1 className="mt-2 font-display text-5xl">For brands</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        We take on a few ateliers a year. Independent, ingredient-led, from Egypt, Morocco,
        the Gulf and the Levant. If that is you, write.
      </p>
      {sent ? (
        <p className="mt-10 font-display text-2xl">Received. We&apos;ll read it slowly.</p>
      ) : (
        <form
          className="mt-10 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const nextErrors = validatePartner({
              contactName,
              companyName,
              email,
              phone,
              website,
              message,
            });
            setFieldErrors(nextErrors);
            if (hasErrors(nextErrors)) {
              setError("Please fix the highlighted fields.");
              return;
            }
            setBusy(true);
            setError(null);
            void storeApi
              .applyPartner({
                contact_name: contactName.trim(),
                company_name: companyName.trim(),
                email: email.trim(),
                phone: phone.trim() || null,
                website: website.trim() || null,
                partner_type: partnerType,
                message: message.trim() || null,
              })
              .then(() => setSent(true))
              .catch((err) =>
                setError(
                  friendlyApiError(
                    err,
                    "We couldn’t send your application. Please try again.",
                  ),
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          <Field
            label="Contact name"
            value={contactName}
            error={fieldErrors.contactName}
            onChange={(v) => {
              setContactName(sanitizePersonName(v));
              clearField("contactName");
            }}
          />
          <Field
            label="Brand / company"
            value={companyName}
            error={fieldErrors.companyName}
            onChange={(v) => {
              setCompanyName(v.slice(0, 150));
              clearField("companyName");
            }}
          />
          <Field
            label="Website"
            value={website}
            error={fieldErrors.website}
            onChange={(v) => {
              setWebsite(v.trimStart().slice(0, 255));
              clearField("website");
            }}
          />
          <Field
            label="Email"
            type="email"
            value={email}
            error={fieldErrors.email}
            onChange={(v) => {
              setEmail(sanitizeEmail(v));
              clearField("email");
            }}
          />
          <Field
            label="Phone"
            type="tel"
            value={phone}
            error={fieldErrors.phone}
            onChange={(v) => {
              setPhone(sanitizePhone(v));
              clearField("phone");
            }}
          />
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Partner type
            <Select
              label="Partner type"
              fullWidth
              className="mt-2"
              value={partnerType}
              onChange={(v) =>
                setPartnerType(v as PartnerApplicationInput["partner_type"])
              }
              options={PARTNER_TYPES.map((t) => ({
                value: t,
                label: t.replace(/_/g, " "),
              }))}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Tell us what you make
            <textarea
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                clearField("message");
              }}
              aria-invalid={Boolean(fieldErrors.message)}
              className={inputClass(
                Boolean(fieldErrors.message),
                "mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm text-ink outline-none",
              )}
            />
            <FieldError message={fieldErrors.message} />
          </label>
          {error ? (
            <p className="rounded-xl bg-sand/70 px-4 py-3 text-sm">{error}</p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-[0.16em] text-muted">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={inputClass(Boolean(error), fieldInput)}
      />
      <FieldError message={error} />
    </label>
  );
}
