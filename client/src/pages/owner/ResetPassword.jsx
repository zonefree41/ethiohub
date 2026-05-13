import React from "react";
import { apiPost } from "../../api/http.js";

export default function ResetPassword() {
  const token = window.location.pathname.split("/").pop();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

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
    <main style={{ maxWidth: 460, margin: "60px auto", padding: 16 }}>
      <a href="/owner/login">← Back to Login</a>

      <h1>Reset Password</h1>

      <p>Enter your new password below.</p>

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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          minLength={6}
          style={{ padding: 12 }}
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength={6}
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Reset Password
        </button>
      </form>

      {message && (
        <p>
          <a href="/owner/login">Go to login</a>
        </p>
      )}
    </main>
  );
}