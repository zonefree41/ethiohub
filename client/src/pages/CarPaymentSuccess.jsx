import React from "react";
import "./CarPaymentSuccess.css";

export default function CarPaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("vehicleId");

  return (
    <main className="car-payment-success-page">
      <section className="car-payment-success-card">
        <div className="car-payment-success-icon">✓</div>

        <p className="car-payment-success-brand">
          HubEthio Cars Marketplace
        </p>

        <h1>Payment Successful!</h1>

        <p className="car-payment-success-lead">
          Thank you. Your $7.00 vehicle listing payment
          was received successfully.
        </p>

        <div className="car-payment-success-info">
          <h2>Your car is now pending review</h2>

          <p>
            HubEthio will review your vehicle listing before
            it appears publicly in the Cars Marketplace.
          </p>

          <div className="car-payment-success-steps">
            <div>
              <span>1</span>
              <strong>Payment received</strong>
            </div>

            <div>
              <span>2</span>
              <strong>Admin review</strong>
            </div>

            <div>
              <span>3</span>
              <strong>Published</strong>
            </div>
          </div>
        </div>

        {vehicleId && (
          <p className="car-payment-success-reference">
            Listing reference: {vehicleId}
          </p>
        )}

        <div className="car-payment-success-actions">
          <a href="/cars" className="car-payment-primary">
            Browse Cars
          </a>

          <a href="/sell-car" className="car-payment-secondary">
            Sell Another Car
          </a>
        </div>

        <p className="car-payment-success-note">
          Your listing will not appear publicly until it has
          been approved by HubEthio.
        </p>
      </section>
    </main>
  );
}
