import React from "react";
import { apiPost } from "../../api/http.js";

export default function AdminLogin() {
  const [email, setEmail] = React.useState("admin@example.com");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [error, setError] = React.useState("");

  async function login(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await apiPost("/api/auth/login", { email, password });
      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <a href="/">← Back Home</a>
      <h1>Admin Login</h1>

      {error && <div style={{ border: "1px solid red", padding: 10, marginBottom: 10 }}>Error: {error}</div>}

      <form onSubmit={login} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit" style={{ padding: 12 }}>Login</button>
      </form>
    </div>
  );
}