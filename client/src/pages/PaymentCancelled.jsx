export default function PaymentCancelled() {
  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
      <h1>Payment Cancelled</h1>
      <p>No payment was completed. Your listing was not upgraded.</p>

      <a href="/admin">Return to Admin</a>
    </main>
  );
}