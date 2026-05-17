import React from "react";
import "./PaymentStatus.css";

export default function PaymentSuccess() {
  React.useEffect(() => {
    document.title = "Payment Successful | HubEthio";
  }, []);

  return (
    <main className="payment-status-page">
      <section className="payment-status-card payment-status-success">
        <div className="payment-status-icon">✅</div>

        <p className="payment-status-label">Payment Complete</p>

        <h1>Payment Successful</h1>

        <p>
          Thank you. Your business listing upgrade is being activated. Your
          listing should show the Featured badge shortly.
        </p>

        <div className="payment-status-actions">
          <a href="/owner/dashboard" className="payment-status-primary">
            Go to Owner Dashboard
          </a>

          <a href="/pricing" className="payment-status-secondary">
            View Pricing
          </a>

          <a href="/" className="payment-status-link">
            Back Home
          </a>
        </div>
      </section>
    </main>
  );
}