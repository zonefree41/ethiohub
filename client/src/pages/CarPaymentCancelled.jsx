import React from "react";
import { apiPost } from "../api/http.js";
import "./CarPaymentCancelled.css";

export default function CarPaymentCancelled() {
  const params = new URLSearchParams(
    window.location.search
  );

  const vehicleId = params.get("vehicleId");

  const [retrying, setRetrying] =
    React.useState(false);

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Payment Cancelled | HubEthio Cars";
  }, []);

  async function retryPayment() {
    if (!vehicleId) {
      setError(
        "Vehicle listing reference is missing."
      );
      return;
    }

    try {
      setRetrying(true);
      setError("");

      const checkout = await apiPost(
        `/api/cars/${vehicleId}/create-checkout-session`,
        {}
      );

      if (!checkout?.url) {
        throw new Error(
          "Unable to restart payment."
        );
      }

      window.location.href = checkout.url;
    } catch (err) {
      setError(
        err.message ||
          "Unable to restart payment."
      );
    } finally {
      setRetrying(false);
    }
  }

  return (
    <main className="car-payment-cancelled-page">
      <section className="car-payment-cancelled-card">
        <div className="car-payment-cancelled-icon">
          ×
        </div>

        <p className="car-payment-cancelled-brand">
          HubEthio Cars Marketplace
        </p>

        <h1>Payment Cancelled</h1>

        <p className="car-payment-cancelled-lead">
          Your payment was not completed.
          You have not been charged.
        </p>

        <div className="car-payment-cancelled-info">
          <h2>Your vehicle is not under review yet</h2>

          <p>
            Your vehicle information has been saved,
            but HubEthio will not review or publish
            the listing until the $7.00 listing fee
            has been successfully paid.
          </p>
        </div>

        {error && (
          <div className="car-payment-cancelled-error">
            {error}
          </div>
        )}

        <div className="car-payment-cancelled-actions">
          {vehicleId && (
            <button
              type="button"
              onClick={retryPayment}
              disabled={retrying}
            >
              {retrying
                ? "Opening Secure Payment..."
                : "Retry Payment — $7.00"}
            </button>
          )}

          <a href="/cars">
            Back to Cars Marketplace
          </a>
        </div>

        <p className="car-payment-cancelled-note">
          No vehicle will appear publicly until
          payment and HubEthio approval are complete.
        </p>
      </section>
    </main>
  );
}