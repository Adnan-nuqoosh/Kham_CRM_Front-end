const ORDER_KEY = "kham:pending_payment_order";
const URL_KEY = "kham:pending_payment_url";

export function rememberPendingPayment(
  orderNumber: string,
  paymentUrl?: string | null,
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ORDER_KEY, orderNumber);
    if (paymentUrl) sessionStorage.setItem(URL_KEY, paymentUrl);
    else sessionStorage.removeItem(URL_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPendingPaymentOrder(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ORDER_KEY);
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ORDER_KEY);
    sessionStorage.removeItem(URL_KEY);
  } catch {
    /* ignore */
  }
}
