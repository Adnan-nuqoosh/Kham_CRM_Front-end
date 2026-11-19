import { ApiClientError } from "./client";

/** Map API / network failures to customer-facing copy. Never surface env keys or codes. */
export function friendlyApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(err instanceof ApiClientError)) {
    if (err instanceof TypeError) {
      return "We couldn’t reach the store right now. Check your connection and try again.";
    }
    return fallback;
  }

  switch (err.code) {
    case "CHECKOUT_DISABLED":
      return "Checkout isn’t available at the moment. Your bag is saved — please try again later or contact us.";
    case "STORE_LOGIN_REQUIRED":
    case "UNAUTHENTICATED":
      return "Please sign in to continue.";
    case "VALIDATION_ERROR":
      return firstValidationMessage(err) || "Please check your details and try again.";
    case "RATE_LIMITED":
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a moment and try again.";
    case "NOT_FOUND":
      return "We couldn’t find what you’re looking for.";
    default:
      break;
  }

  if (err.status === 401) return "Please sign in to continue.";
  if (err.status === 403) return "You don’t have permission to do that.";
  if (err.status === 404) return "We couldn’t find what you’re looking for.";
  if (err.status === 409) return "That request was already processed. Refresh and check your orders.";
  if (err.status === 422) {
    return firstValidationMessage(err) || "Please check your details and try again.";
  }
  if (err.status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (err.status === 503) {
    return "This service is temporarily unavailable. Please try again shortly.";
  }
  if (err.status >= 500) {
    return "Our store is having a moment. Please try again in a little while.";
  }

  const raw = (err.message || "").trim();
  if (!raw || looksTechnical(raw)) return fallback;
  return raw;
}

function firstValidationMessage(err: ApiClientError): string | null {
  const values = Object.values(err.errors || {});
  for (const msgs of values) {
    if (Array.isArray(msgs) && msgs[0]) return String(msgs[0]);
  }
  return null;
}

function looksTechnical(message: string): boolean {
  return (
    /STOREFRONT_|CHECKOUT_ENABLED|SQLSTATE|Exception|stack|Illuminate\\|\\App\\|at vendor/i.test(
      message,
    ) ||
    /Request failed \(\d+\)/.test(message)
  );
}
