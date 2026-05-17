import React from "react";
import { apiPost } from "../api/http.js";
import "./Pricing.css";

export default function Pricing() {
  const [listingId, setListingId] = React.useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("listingId") || "";
});
  const [loadingPlan, setLoadingPlan] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Pricing | HubEthio";
  }, []);

  async function startCheckout(plan) {
    setError("");

    if (!listingId.trim()) {
      setError("Please enter your listing ID before choosing a paid plan.");
      return;
    }

    try {
      setLoadingPlan(plan);

      const data = await apiPost("/api/stripe/create-checkout-session", {
        listingId: listingId.trim(),
        plan,
      });

      if (!data.url) {
        throw new Error("Checkout link was not created.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <main className="pricing-page">
      <div className="pricing-container">
        <a href="/" className="pricing-back">
          ← Back Home
        </a>

        <section className="pricing-hero">
          <p className="pricing-label">HubEthio Pricing</p>
          <h1>Choose the right plan for your business</h1>
          <p>
            Start with a free listing or upgrade to featured placement for more
            visibility across HubEthio.
          </p>
        </section>

        {error && <div className="pricing-error">Error: {error}</div>}

        <section className="pricing-listing-box">
          <h2>Upgrade an existing listing</h2>
          <p>
            Enter the business listing ID you want to upgrade. You can find this
            from the listing URL or owner dashboard.
          </p>

          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Listing ID"
          />
        </section>

        <section className="pricing-grid">
          <article className="pricing-card">
            <h2>Free Listing</h2>
            <p className="pricing-price">$0</p>
            <p className="pricing-note">Best for getting started.</p>

            <ul>
              <li>Basic business profile</li>
              <li>Shows in category/search</li>
              <li>Phone, city, state, and description</li>
              <li>Admin approval required</li>
            </ul>

            <a href="/submit" className="pricing-secondary-btn">
              Submit Free Listing
            </a>
          </article>

          <article className="pricing-card pricing-featured">
            <div className="pricing-popular">Most Popular</div>

            <h2>Featured Monthly</h2>
            <p className="pricing-price">$9.99/mo</p>
            <p className="pricing-note">Great for active local businesses.</p>

            <ul>
              <li>Featured business placement</li>
              <li>Logo and banner image support</li>
              <li>Priority visibility</li>
              <li>Reviews and rating display</li>
            </ul>

            <button
              type="button"
              onClick={() => startCheckout("monthly")}
              disabled={loadingPlan === "monthly"}
            >
              {loadingPlan === "monthly" ? "Opening Checkout..." : "Choose Monthly"}
            </button>
          </article>

          <article className="pricing-card">
            <h2>Featured Yearly</h2>
            <p className="pricing-price">$99/yr</p>
            <p className="pricing-note">Best value for long-term visibility.</p>

            <ul>
              <li>Everything in Featured Monthly</li>
              <li>Annual featured placement</li>
              <li>Save compared to monthly</li>
              <li>Good for established businesses</li>
            </ul>

            <button
              type="button"
              onClick={() => startCheckout("yearly")}
              disabled={loadingPlan === "yearly"}
            >
              {loadingPlan === "yearly" ? "Opening Checkout..." : "Choose Yearly"}
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}