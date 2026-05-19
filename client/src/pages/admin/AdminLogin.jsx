import React from "react";
import { apiPost } from "../../api/http.js";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [email, setEmail] = React.useState("");
const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Admin Login | HubEthio";
  }, []);

  async function login(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await apiPost("/api/admin/login", { email, password });

      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <a href="/" className="admin-login-back">
          ← Back Home
        </a>

        <div className="admin-login-header">
          <p>HubEthio Admin</p>
          <h1>Admin Login</h1>
          <span>Manage listings, approvals, featured businesses, and platform content.</span>
        </div>

        {error && <div className="admin-login-error">Error: {error}</div>}

        <form onSubmit={login} className="admin-login-form">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            type="email"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />

          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}