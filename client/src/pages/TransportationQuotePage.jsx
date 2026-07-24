import React from "react";
import { apiGet } from "../api/https.js";

export default function TransportationQuotePage({ quoteToken }) {
  const [quote, setQuote] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

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
        console.error("Unable to load transportation quote:", err);

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
      setError("The quote link is invalid.");
      setLoading(false);
    }
  }, [quoteToken]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Transportation Quote</h1>
          <p>Loading your transportation quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Transportation Quote</h1>

          <div style={styles.error}>
            <strong>Unable to load quote</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Transportation Quote</h1>

        <pre style={styles.preview}>
          {JSON.stringify(quote, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fa",
    padding: "40px 16px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "30px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },

  title: {
    marginTop: 0,
    color: "#172d40",
  },

  error: {
    padding: "18px",
    background: "#fff3f3",
    border: "1px solid #f0b8b8",
    borderRadius: "10px",
    color: "#a12626",
  },

  preview: {
    padding: "18px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#f4f4f4",
    borderRadius: "10px",
  },
};