import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function OwnerLogin() {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    document.title = "Business Owner Login | HubEthio";
  }, []);

  function update(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiPost("/api/owner/auth/login", form);

      localStorage.setItem("ownerToken", data.token);
      localStorage.setItem("ownerUser", JSON.stringify(data.user));

      setMessage("✅ Login successful");
      window.location.href = "/owner/dashboard";
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a href="/" className="owner-auth-back">
          ← Back Home
        </a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">Business Portal</p>
          <h1>Business Owner Login</h1>
          <p>Login to manage your HubEthio business listing.</p>
        </div>

        {message && <div className="owner-auth-success">{message}</div>}
        {error && <div className="owner-auth-error">Error: {error}</div>}

        <form onSubmit={submit} className="owner-auth-form">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            placeholder="Email"
            required
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            placeholder="Password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <div className="owner-auth-links">
          <a href="/owner/forgot-password">Forgot password?</a>
          <span>•</span>
          <a href="/owner/register">Create account</a>
        </div>
      </div>
    </main>
  );
}