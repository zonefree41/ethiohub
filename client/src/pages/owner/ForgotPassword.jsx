import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Forgot Password | HubEthio";
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await apiPost("/api/owner/auth/forgot-password", {
        email,
      });

      setMessage(
        data.message || "If an account exists, a reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    }
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a href="/owner/login" className="owner-auth-back">
          ← Back to Login
        </a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">Account Recovery</p>
          <h1>Forgot Password</h1>
          <p>
            Enter your business owner email address. If an account exists, we’ll
            send a password reset link.
          </p>
        </div>

        {message && <div className="owner-auth-success">{message}</div>}
        {error && <div className="owner-auth-error">Error: {error}</div>}

        <form onSubmit={submit} className="owner-auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />

          <button type="submit">Send Reset Link</button>
        </form>

        <div className="owner-auth-links">
          <a href="/owner/login">Remembered your password? Login</a>
        </div>
      </div>
    </main>
  );
}