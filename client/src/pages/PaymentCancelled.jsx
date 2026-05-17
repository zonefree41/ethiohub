import React from "react";
import "./PaymentStatus.css";

export default function PaymentCancelled() {
  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("listingId") || "";
  const tryAgainUrl = listingId
    ? `/pricing?listingId=${listingId}`
    : "/pricing";

  React.useEffect(() => {
    document.title = "Payment Cancelled | HubEthio";
  }, []);

  return (
    <main className="payment-status-page">
      <section className="payment-status-card payment-status-cancelled">
        <div className="payment-status-icon">⚠️</div>

        <p className="payment-status-label">Checkout Cancelled</p>

        <h1>Payment Cancelled</h1>

        <p>
          No payment was completed. Your listing was not upgraded. You can try
          again anytime.
        </p>

        <div className="payment-status-actions">
          <a href={tryAgainUrl} className="payment-status-primary">
            Try Again
          </a>

          <a href="/owner/dashboard" className="payment-status-secondary">
            Owner Dashboard
          </a>

          <a href="/" className="payment-status-link">
            Back Home
          </a>
        </div>
      </section>
    </main>
  );
}