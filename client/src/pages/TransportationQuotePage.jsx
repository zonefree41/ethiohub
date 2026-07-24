import React from "react";

export default function TransportationQuotePage({ quoteToken }) {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "60px auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Transportation Quote</h1>

      <p>
        <strong>Quote Token:</strong>
      </p>

      <code
        style={{
          display: "block",
          padding: "12px",
          background: "#f5f5f5",
          borderRadius: "8px",
          wordBreak: "break-all",
        }}
      >
        {quoteToken}
      </code>

      <p style={{ marginTop: "30px" }}>
        Loading transportation quote...
      </p>
    </div>
  );
}