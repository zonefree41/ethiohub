import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function ResetPassword() {
  const token = window.location.pathname.split("/").pop();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Reset Password | HubEthio";
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data = await apiPost("/api/owner/auth/reset-password", {
        token,
        password,
      });

      setMessage(data.message || "Password reset successfully.");
    } catch (err) {
      setError(err.message || "Failed to reset password");
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
          <h1>Reset Password</h1>
          <p>Enter your new password below.</p>
        </div>

        {message && <div className="owner-auth-success">{message}</div>}
        {error && <div className="owner-auth-error">Error: {error}</div>}

        <form onSubmit={submit} className="owner-auth-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
          />

          <button type="submit">Reset Password</button>
        </form>

        {message && (
          <div className="owner-auth-links">
            <a href="/owner/login">Go to login</a>
          </div>
        )}
      </div>
    </main>
  );
}