import React from "react";
import {
  apiGet,
  apiPatch,
  isPublicNotFoundError,
} from "../api/http.js";
import hubEthioLogo from "../../resources/icon-only.png";

export default function CargoShippingQuotePage({
  quoteToken,
}) {
  const [quote, setQuote] = React.useState(null);
  const [loading, setLoading] =
    React.useState(true);
  const [error, setError] =
    React.useState("");
  const [
    submittingDecision,
    setSubmittingDecision,
  ] = React.useState("");
  const [
    successMessage,
    setSuccessMessage,
  ] = React.useState("");

  React.useEffect(() => {
    async function loadQuote() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          `/api/cargo-shipping-requests/quote/${quoteToken}`
        );

        setQuote(data);
      } catch (err) {
        console.error(
          "Unable to load Cargo & Shipping quote:",
          err
        );

        if (isPublicNotFoundError(err)) {
          window.location.replace("/");
          return;
        }

        setError(
          err.message ||
            "We could not load this Cargo & Shipping quote."
        );
      } finally {
        setLoading(false);
      }
    }

    if (quoteToken) {
      loadQuote();
    } else {
      window.location.replace("/");
    }
  }, [quoteToken]);

  async function handleDecision(decision) {
    const actionText =
      decision === "Accepted"
        ? "accept"
        : "decline";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this quote?`
    );

    if (!confirmed) return;

    try {
      setSubmittingDecision(decision);
      setError("");
      setSuccessMessage("");

      const data = await apiPatch(
        `/api/cargo-shipping-requests/quote/${quoteToken}/respond`,
        { decision }
      );

      setQuote((current) => ({
        ...current,
        status:
          data?.request?.status ||
          current?.status,
        customerRespondedAt:
          data?.request?.customerRespondedAt ||
          new Date().toISOString(),
      }));

      setSuccessMessage(
        decision === "Accepted"
          ? "Your Cargo & Shipping quote has been accepted successfully."
          : "You declined this Cargo & Shipping quote."
      );
    } catch (err) {
      console.error(
        "Cargo & Shipping quote response failed:",
        err
      );

      setError(
        err.message ||
          "We could not submit your response. Please try again."
      );
    } finally {
      setSubmittingDecision("");
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>📦</div>

          <h1 style={styles.title}>
            Loading Your Shipping Quote
          </h1>

          <p style={styles.muted}>
            Please wait while we securely load
            your Cargo & Shipping quote.
          </p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            Unable to Load Quote
          </h1>

          <div style={styles.errorBox}>
            {error}
          </div>

          <a href="/" style={styles.homeLink}>
            Return to HubEthio
          </a>
        </div>
      </div>
    );
  }

  const hasResponded =
    Boolean(quote.customerRespondedAt) ||
    ["Accepted", "Declined"].includes(
      quote.status
    );

  const origin =
    [
      quote.originCity,
      quote.originState,
      quote.originCountry,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Not specified";

  const destination =
    [
      quote.destinationCity,
      quote.destinationCountry,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Not specified";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <a href="/" style={styles.brand}>
            <img
              src={hubEthioLogo}
              alt="HubEthio"
              style={styles.logo}
            />

            <strong>HubEthio</strong>
          </a>

          <span style={styles.badge}>
            {quote.status}
          </span>
        </header>

        <div style={styles.card}>
          <div style={styles.icon}>📦</div>

          <h1 style={styles.title}>
            Cargo & Shipping Quote
          </h1>

          <p style={styles.muted}>
            Quote from{" "}
            <strong>
              {quote.businessName}
            </strong>
          </p>

          {successMessage && (
            <div style={styles.successBox}>
              {successMessage}
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <div style={styles.details}>
            <div style={styles.detailItem}>
              <span style={styles.label}>
                Service
              </span>
              <strong>
                {quote.serviceType ||
                  "Not specified"}
              </strong>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.label}>
                Origin
              </span>
              <strong>{origin}</strong>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.label}>
                Destination
              </span>
              <strong>{destination}</strong>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.label}>
                Packages
              </span>
              <strong>
                {quote.packageCount || 1}
              </strong>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.label}>
                Weight
              </span>
              <strong>
                {quote.estimatedWeight != null
                  ? `${quote.estimatedWeight} ${
                      quote.weightUnit || "lb"
                    }`
                  : "Not specified"}
              </strong>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.label}>
                Desired Shipping Date
              </span>
              <strong>
                {quote.desiredShippingDate ||
                  "Not specified"}
              </strong>
            </div>
          </div>

          <div style={styles.shipmentBox}>
            <span style={styles.label}>
              Shipment Description
            </span>

            <strong>
              {quote.itemDescription ||
                "Not specified"}
            </strong>
          </div>

          <div style={styles.quoteBox}>
            <span style={styles.label}>
              Shipping Quote
            </span>

            <div style={styles.amount}>
              $
              {Number(
                quote.quoteAmount || 0
              ).toFixed(2)}
            </div>
          </div>

          {quote.quoteNotes && (
            <div style={styles.notesBox}>
              <strong>Quote Notes</strong>

              <p>
                {quote.quoteNotes}
              </p>
            </div>
          )}

          {!hasResponded && (
            <div style={styles.actions}>
              <button
                type="button"
                style={styles.acceptButton}
                disabled={
                  Boolean(submittingDecision)
                }
                onClick={() =>
                  handleDecision("Accepted")
                }
              >
                {submittingDecision ===
                "Accepted"
                  ? "Submitting..."
                  : "Accept Quote"}
              </button>

              <button
                type="button"
                style={styles.declineButton}
                disabled={
                  Boolean(submittingDecision)
                }
                onClick={() =>
                  handleDecision("Declined")
                }
              >
                {submittingDecision ===
                "Declined"
                  ? "Submitting..."
                  : "Decline Quote"}
              </button>
            </div>
          )}

          {hasResponded && (
            <div style={styles.respondedBox}>
              Quote response recorded:
              <strong>
                {" "}
                {quote.status}
              </strong>
            </div>
          )}

          <p style={styles.footerText}>
            HubEthio connects customers with
            independent Cargo & Shipping service
            providers. Shipping rates, customs
            requirements, transit times, insurance,
            pickup, delivery, and cargo handling are
            provided directly by the business.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "32px 16px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#0f172a",
  },

  container: {
    maxWidth: "760px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
    textDecoration: "none",
  },

  logo: {
    width: "42px",
    height: "42px",
    objectFit: "contain",
  },

  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "13px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "30px",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.08)",
  },

  icon: {
    fontSize: "42px",
    textAlign: "center",
    marginBottom: "10px",
  },

  title: {
    textAlign: "center",
    margin: "0 0 10px",
  },

  muted: {
    textAlign: "center",
    color: "#64748b",
    lineHeight: 1.6,
  },

  details: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "12px",
    marginTop: "24px",
  },

  detailItem: {
    padding: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },

  shipmentBox: {
    marginTop: "18px",
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  quoteBox: {
    marginTop: "20px",
    padding: "20px",
    textAlign: "center",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
  },

  amount: {
    fontSize: "34px",
    fontWeight: 900,
    color: "#1d4ed8",
  },

  notesBox: {
    marginTop: "18px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    flexWrap: "wrap",
  },

  acceptButton: {
    flex: 1,
    minHeight: "48px",
    border: 0,
    borderRadius: "11px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  declineButton: {
    flex: 1,
    minHeight: "48px",
    border: 0,
    borderRadius: "11px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  successBox: {
    marginTop: "18px",
    padding: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    color: "#166534",
  },

  errorBox: {
    marginTop: "18px",
    padding: "14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#991b1b",
  },

  respondedBox: {
    marginTop: "22px",
    padding: "15px",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  homeLink: {
    display: "block",
    marginTop: "20px",
    textAlign: "center",
    color: "#1d4ed8",
    fontWeight: 700,
  },

  footerText: {
    marginTop: "24px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.7,
  },
};