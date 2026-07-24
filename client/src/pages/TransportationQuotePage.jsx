import React from "react";
import { apiGet, apiPatch } from "../api/http.js";

export default function TransportationQuotePage({ quoteToken }) {
  const [quote, setQuote] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [submittingDecision, setSubmittingDecision] =
    React.useState("");
  const [successMessage, setSuccessMessage] =
    React.useState("");

  React.useEffect(() => {
    async function loadQuote() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          `/api/transportation-requests/quote/${quoteToken}`
        );

        setQuote(data);
      } catch (err) {
        console.error(
          "Unable to load transportation quote:",
          err
        );

        setError(
          err.message ||
            "We could not load this transportation quote."
        );
      } finally {
        setLoading(false);
      }
    }

    if (quoteToken) {
      loadQuote();
    } else {
      setError("This transportation quote link is invalid.");
      setLoading(false);
    }
  }, [quoteToken]);

  async function handleDecision(decision) {
    const actionText =
      decision === "Accepted" ? "accept" : "decline";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this quote?`
    );

    if (!confirmed) return;

    try {
      setSubmittingDecision(decision);
      setError("");
      setSuccessMessage("");

      const updatedQuote = await apiPatch(
        `/api/transportation-requests/quote/${quoteToken}/respond`,
        { decision }
      );

      setQuote(updatedQuote);

      setSuccessMessage(
        decision === "Accepted"
          ? "Your quote has been accepted successfully. The transportation provider has been notified."
          : "You declined this quote. The transportation provider has been notified."
      );
    } catch (err) {
      console.error(
        "Transportation quote response failed:",
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
          <div style={styles.loadingIcon}>🚚</div>

          <h1 style={styles.loadingTitle}>
            Loading Your Quote
          </h1>

          <p style={styles.mutedText}>
            Please wait while we securely load your
            transportation quote.
          </p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>

          <h1 style={styles.loadingTitle}>
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

  const displayedStatus =
    quote.status === "Cancelled"
      ? "Declined"
      : quote.status;

  const hasResponded = [
    "Accepted",
    "Declined",
    "Cancelled",
  ].includes(quote.status);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <a href="/" style={styles.brandLink}>
            <div style={styles.brandMark}>H</div>

            <div>
              <div style={styles.brandName}>HubEthio</div>

              <div style={styles.brandTagline}>
                Discover. Connect. Support.
              </div>
            </div>
          </a>
        </header>

        <main style={styles.card}>
          <section style={styles.hero}>
            <div style={styles.heroIcon}>🚚</div>

            <div>
              <p style={styles.eyebrow}>
                TRANSPORTATION QUOTE
              </p>

              <h1 style={styles.title}>
                Your quote is ready
              </h1>

              <p style={styles.subtitle}>
                Review the transportation details below and
                choose whether to accept or decline.
              </p>
            </div>
          </section>

          <div style={styles.statusRow}>
            <div>
              <div style={styles.smallLabel}>
                Transportation provider
              </div>

              <div style={styles.businessName}>
                {quote.businessName ||
                  "Transportation Provider"}
              </div>
            </div>

            <span
              style={{
                ...styles.statusBadge,
                ...(displayedStatus === "Accepted"
                  ? styles.acceptedBadge
                  : displayedStatus === "Declined"
                  ? styles.declinedBadge
                  : styles.quotedBadge),
              }}
            >
              {displayedStatus || "Quoted"}
            </span>
          </div>

          {successMessage && (
            <div style={styles.successBox}>
              <strong>Response submitted</strong>

              <div style={styles.messageText}>
                {successMessage}
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <section style={styles.quoteHighlight}>
            <div>
              <div style={styles.quoteLabel}>
                Total Quote
              </div>

              <div style={styles.quoteAmount}>
                {formatCurrency(quote.quoteAmount)}
              </div>
            </div>

            <div style={styles.arrivalBlock}>
              <div style={styles.quoteLabel}>
                Estimated Arrival
              </div>

              <div style={styles.arrivalText}>
                {quote.estimatedArrival ||
                  "Contact provider for details"}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Trip details
            </h2>

            <div style={styles.routeCard}>
              <div style={styles.routeItem}>
                <div style={styles.pickupDot}></div>

                <div>
                  <div style={styles.smallLabel}>
                    Pickup
                  </div>

                  <div style={styles.detailValue}>
                    {quote.pickupAddress ||
                      "Not provided"}
                  </div>
                </div>
              </div>

              <div style={styles.routeLine}></div>

              <div style={styles.routeItem}>
                <div style={styles.deliveryDot}></div>

                <div>
                  <div style={styles.smallLabel}>
                    Delivery
                  </div>

                  <div style={styles.detailValue}>
                    {quote.deliveryAddress ||
                      "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Request information
            </h2>

            <div style={styles.detailsGrid}>
              <DetailItem
                label="Customer"
                value={quote.customerName}
              />

              <DetailItem
                label="Service"
                value={quote.serviceType}
              />

              <DetailItem
                label="Requested date"
                value={formatDate(quote.requestedDate)}
              />

              <DetailItem
                label="Requested time"
                value={formatTime(quote.requestedTime)}
              />
            </div>
          </section>

          {quote.cargoDetails && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Cargo details
              </h2>

              <div style={styles.notesCard}>
                {quote.cargoDetails}
              </div>
            </section>
          )}

          {quote.ownerNotes && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Provider notes
              </h2>

              <div style={styles.providerNotes}>
                <div style={styles.notesIcon}>📝</div>

                <div>{quote.ownerNotes}</div>
              </div>
            </section>
          )}

          {!hasResponded ? (
            <section style={styles.actionSection}>
              <p style={styles.actionText}>
                Please review the information carefully before
                submitting your response.
              </p>

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.acceptButton,
                    opacity: submittingDecision ? 0.65 : 1,
                  }}
                  disabled={Boolean(submittingDecision)}
                  onClick={() =>
                    handleDecision("Accepted")
                  }
                >
                  {submittingDecision === "Accepted"
                    ? "Accepting..."
                    : "✓ Accept Quote"}
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.declineButton,
                    opacity: submittingDecision ? 0.65 : 1,
                  }}
                  disabled={Boolean(submittingDecision)}
                  onClick={() =>
                    handleDecision("Declined")
                  }
                >
                  {submittingDecision === "Declined"
                    ? "Declining..."
                    : "Decline Quote"}
                </button>
              </div>
            </section>
          ) : (
            <section style={styles.responseComplete}>
              <div style={styles.responseIcon}>
                {displayedStatus === "Accepted"
                  ? "✓"
                  : "×"}
              </div>

              <div>
                <strong>
                  Quote {displayedStatus}
                </strong>

                <p style={styles.responseText}>
                  Your response has already been submitted to
                  the transportation provider.
                </p>
              </div>
            </section>
          )}

          <footer style={styles.footer}>
            <p style={styles.footerText}>
              This secure quote was provided through HubEthio.
            </p>

            <a href="/" style={styles.footerLink}>
              Visit HubEthio.com
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.smallLabel}>{label}</div>

      <div style={styles.detailValue}>
        {value || "Not provided"}
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericAmount);
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Not specified";

  const [hours, minutes] = String(value).split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    padding: "24px 14px 60px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#172d40",
  },

  container: {
    width: "100%",
    maxWidth: "820px",
    margin: "0 auto",
  },

  header: {
    padding: "8px 4px 22px",
  },

  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "11px",
    color: "#172d40",
    textDecoration: "none",
  },

  brandMark: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #00843d, #f59e0b)",
    color: "#ffffff",
    borderRadius: "13px",
    fontSize: "22px",
    fontWeight: "800",
  },

  brandName: {
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.4px",
  },

  brandTagline: {
    marginTop: "2px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },

  card: {
    width: "100%",
    padding: "34px",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.09)",
  },

  hero: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    paddingBottom: "28px",
    borderBottom: "1px solid #e2e8f0",
  },

  heroIcon: {
    flexShrink: 0,
    width: "58px",
    height: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff7ed",
    borderRadius: "17px",
    fontSize: "29px",
  },

  eyebrow: {
    margin: "1px 0 7px",
    color: "#00843d",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.4px",
  },

  title: {
    margin: 0,
    color: "#172d40",
    fontSize: "clamp(30px, 6vw, 45px)",
    lineHeight: 1.05,
    letterSpacing: "-1.5px",
  },

  subtitle: {
    maxWidth: "570px",
    margin: "13px 0 0",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: 1.6,
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    padding: "27px 0",
  },

  smallLabel: {
    marginBottom: "6px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  businessName: {
    color: "#172d40",
    fontSize: "20px",
    fontWeight: "800",
  },

  statusBadge: {
    flexShrink: 0,
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
  },

  quotedBadge: {
    background: "#fff7ed",
    color: "#b45309",
  },

  acceptedBadge: {
    background: "#ecfdf5",
    color: "#047857",
  },

  declinedBadge: {
    background: "#fef2f2",
    color: "#b91c1c",
  },

  quoteHighlight: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    padding: "25px",
    background:
      "linear-gradient(135deg, #083d2c 0%, #00843d 100%)",
    color: "#ffffff",
    borderRadius: "18px",
  },

  quoteLabel: {
    marginBottom: "6px",
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.7px",
    textTransform: "uppercase",
  },

  quoteAmount: {
    fontSize: "clamp(34px, 8vw, 49px)",
    fontWeight: "900",
    letterSpacing: "-1.7px",
  },

  arrivalBlock: {
    maxWidth: "250px",
    textAlign: "right",
  },

  arrivalText: {
    fontSize: "18px",
    fontWeight: "800",
    lineHeight: 1.35,
  },

  section: {
    paddingTop: "29px",
  },

  sectionTitle: {
    margin: "0 0 15px",
    color: "#172d40",
    fontSize: "18px",
  },

  routeCard: {
    padding: "21px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },

  routeItem: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  pickupDot: {
    flexShrink: 0,
    width: "13px",
    height: "13px",
    marginTop: "5px",
    background: "#00843d",
    border: "4px solid #d1fae5",
    borderRadius: "50%",
  },

  deliveryDot: {
    flexShrink: 0,
    width: "13px",
    height: "13px",
    marginTop: "5px",
    background: "#f59e0b",
    border: "4px solid #ffedd5",
    borderRadius: "50%",
  },

  routeLine: {
    width: "2px",
    height: "30px",
    margin: "4px 0 4px 9px",
    background: "#cbd5e1",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "13px",
  },

  detailItem: {
    padding: "17px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },

  detailValue: {
    color: "#1e293b",
    fontSize: "15px",
    fontWeight: "650",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  notesCard: {
    padding: "19px",
    color: "#334155",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
  },

  providerNotes: {
    display: "flex",
    gap: "13px",
    padding: "19px",
    color: "#713f12",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "14px",
    lineHeight: 1.65,
  },

  notesIcon: {
    flexShrink: 0,
    fontSize: "20px",
  },

  actionSection: {
    marginTop: "32px",
    paddingTop: "27px",
    borderTop: "1px solid #e2e8f0",
  },

  actionText: {
    margin: "0 0 17px",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.5,
  },

  buttonGroup: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "12px",
  },

  button: {
    minHeight: "52px",
    padding: "14px 20px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  acceptButton: {
    color: "#ffffff",
    background: "#00843d",
    border: "1px solid #00843d",
  },

  declineButton: {
    color: "#b91c1c",
    background: "#ffffff",
    border: "1px solid #fecaca",
  },

  responseComplete: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginTop: "31px",
    padding: "20px",
    color: "#065f46",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "15px",
  },

  responseIcon: {
    flexShrink: 0,
    width: "31px",
    height: "31px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    background: "#059669",
    borderRadius: "50%",
    fontWeight: "900",
  },

  responseText: {
    margin: "5px 0 0",
    lineHeight: 1.5,
  },

  successBox: {
    marginBottom: "22px",
    padding: "17px",
    color: "#065f46",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "13px",
  },

  errorBox: {
    marginBottom: "22px",
    padding: "17px",
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "13px",
    lineHeight: 1.5,
  },

  messageText: {
    marginTop: "5px",
    lineHeight: 1.5,
  },

  footer: {
    marginTop: "33px",
    paddingTop: "23px",
    borderTop: "1px solid #e2e8f0",
    textAlign: "center",
  },

  footerText: {
    margin: "0 0 7px",
    color: "#94a3b8",
    fontSize: "13px",
  },

  footerLink: {
    color: "#00843d",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
  },

  loadingIcon: {
    marginBottom: "17px",
    fontSize: "45px",
    textAlign: "center",
  },

  loadingTitle: {
    margin: "0 0 10px",
    color: "#172d40",
    fontSize: "31px",
    textAlign: "center",
  },

  mutedText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
    textAlign: "center",
  },

  errorIcon: {
    width: "54px",
    height: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    color: "#ffffff",
    background: "#dc2626",
    borderRadius: "50%",
    fontSize: "29px",
    fontWeight: "900",
  },

  homeLink: {
    display: "block",
    marginTop: "18px",
    color: "#00843d",
    fontWeight: "800",
    textAlign: "center",
    textDecoration: "none",
  },
};