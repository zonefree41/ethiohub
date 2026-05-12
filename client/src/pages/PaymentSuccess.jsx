import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
      <h1>✅ Payment Successful</h1>
      <p>Thank you. Your business listing has been upgraded to Featured.</p>
      <p>Your listing should now show the ⭐ Featured badge.</p>

      <a href="/">Back to Home</a>
    </main>
  );
}