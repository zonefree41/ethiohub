import React from "react";
import { apiPost } from "../../api/http.js";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await apiPost("/api/owner/auth/forgot-password", {
        email,
      });

      setMessage(data.message || "If an account exists, a reset link has been sent.");
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "60px auto", padding: 16 }}>
      <a href="/owner/login">← Back to Login</a>

      <h1>Forgot Password</h1>

      <p>
        Enter your business owner email address. If an account exists, we’ll send
        a reset link.
      </p>

      {message && (
        <div style={{ border: "1px solid green", padding: 12, marginBottom: 12 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ border: "1px solid red", padding: 12, marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Send Reset Link
        </button>
      </form>
    </main>
  );
}