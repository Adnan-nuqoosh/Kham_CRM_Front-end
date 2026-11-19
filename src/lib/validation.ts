export type FieldErrors = Record<string, string>;

/** Strip letters / symbols that do not belong in a phone number. */
export function sanitizePhone(value: string): string {
  // Keep leading + once; digits, spaces, (), -, .
  let out = value.replace(/[^\d+\s().-]/g, "");
  // Only allow + at the start.
  out = out.replace(/(?!^)\+/g, "");
  if (out.includes("+") && !out.startsWith("+")) {
    out = out.replace(/\+/g, "");
  }
  return out.slice(0, 30);
}

/** Letters (incl. Arabic), spaces, hyphen, apostrophe — no digits. */
export function sanitizePersonName(value: string): string {
  return value
    .replace(/[0-9]/g, "")
    .replace(/[^\p{L}\p{M}\s'.-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 100);
}

export function sanitizeEmail(value: string): string {
  return value.replace(/\s/g, "").slice(0, 255);
}

export function sanitizeDigits(value: string, max = 12): string {
  return value.replace(/\D/g, "").slice(0, max);
}

export function isEmail(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 255) return false;
  // Practical email check (aligned with common HTML5 + API expectations).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Allow international formats with optional +, spaces, dashes, parentheses. */
export function isPhone(value: string): boolean {
  const v = value.trim();
  if (v.length < 7 || v.length > 30) return false;
  if (/[A-Za-z\u0600-\u06FF]/.test(v)) return false;
  if (!/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isPersonName(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/\d/.test(v)) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u.test(v);
}

export function isUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v.includes("://") ? v : `https://${v}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function requiredText(
  value: string,
  label: string,
  opts: { min?: number; max?: number } = {},
): string | null {
  const v = value.trim();
  const min = opts.min ?? 1;
  const max = opts.max ?? 255;
  if (!v) return `${label} is required.`;
  if (v.length < min) return `${label} must be at least ${min} characters.`;
  if (v.length > max) return `${label} must be at most ${max} characters.`;
  return null;
}

export function validateCheckout(input: {
  name: string;
  phone: string;
  email: string;
  requireEmail: boolean;
  address: string;
  countryCode: string;
  city: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const nameErr = requiredText(input.name, "Full name", { min: 2, max: 100 });
  if (nameErr) errors.name = nameErr;
  else if (!isPersonName(input.name)) {
    errors.name = "Full name can only contain letters and spaces.";
  }

  if (!input.phone.trim()) errors.phone = "Phone is required.";
  else if (!isPhone(input.phone)) {
    errors.phone =
      "Enter a valid phone number using digits only (7–15 digits).";
  }

  if (input.requireEmail) {
    if (!input.email.trim()) errors.email = "Email is required.";
    else if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
  }

  const addressErr = requiredText(input.address, "Address", {
    min: 5,
    max: 255,
  });
  if (addressErr) errors.address = addressErr;

  if (!input.countryCode.trim()) errors.countryCode = "Country is required.";
  if (!input.city.trim()) errors.city = "City is required.";

  return errors;
}

export function validateLogin(input: {
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Password is required.";
  return errors;
}

export function validateRegister(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const firstErr = requiredText(input.firstName, "First name", {
    min: 1,
    max: 100,
  });
  if (firstErr) errors.firstName = firstErr;
  else if (!isPersonName(input.firstName)) {
    errors.firstName = "First name can only contain letters.";
  }
  if (input.lastName.trim()) {
    if (input.lastName.trim().length > 100) {
      errors.lastName = "Last name must be at most 100 characters.";
    } else if (!isPersonName(input.lastName)) {
      errors.lastName = "Last name can only contain letters.";
    }
  }
  if (!input.phone.trim()) errors.phone = "Phone is required.";
  else if (!isPhone(input.phone)) {
    errors.phone =
      "Enter a valid phone number using digits only (7–15 digits).";
  }
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Password is required.";
  else if (input.password.length < 12) {
    errors.password = "Password must be at least 12 characters.";
  }
  if (!input.passwordConfirm) {
    errors.passwordConfirm = "Please confirm your password.";
  } else if (input.password !== input.passwordConfirm) {
    errors.passwordConfirm = "Passwords do not match.";
  }
  return errors;
}

export function validatePartner(input: {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const contactErr = requiredText(input.contactName, "Contact name", {
    min: 2,
    max: 100,
  });
  if (contactErr) errors.contactName = contactErr;
  else if (!isPersonName(input.contactName)) {
    errors.contactName = "Contact name can only contain letters and spaces.";
  }
  const companyErr = requiredText(input.companyName, "Brand / company", {
    min: 2,
    max: 150,
  });
  if (companyErr) errors.companyName = companyErr;
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
  if (input.phone.trim() && !isPhone(input.phone)) {
    errors.phone =
      "Enter a valid phone number using digits only (7–15 digits).";
  }
  if (input.website.trim() && !isUrl(input.website)) {
    errors.website = "Enter a valid website URL.";
  }
  const messageErr = requiredText(input.message, "Message", {
    min: 10,
    max: 3000,
  });
  if (messageErr) errors.message = messageErr;
  return errors;
}

export function validateNewsletter(email: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isEmail(email)) errors.email = "Enter a valid email address.";
  return errors;
}

export function validateReview(input: {
  orderItemId: string;
  rating: number;
  title: string;
  body: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const id = Number(input.orderItemId);
  if (!input.orderItemId.trim()) {
    errors.orderItemId = "Order item id is required.";
  } else if (!Number.isInteger(id) || id < 1) {
    errors.orderItemId = "Enter a valid order item id.";
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = "Rating must be between 1 and 5.";
  }
  if (input.title.trim().length > 150) {
    errors.title = "Title must be at most 150 characters.";
  }
  if (input.body.trim().length > 3000) {
    errors.body = "Review must be at most 3000 characters.";
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function inputClass(hasError: boolean, base: string): string {
  return hasError
    ? `${base} border-red-700/50 focus:border-red-700`
    : base;
}
