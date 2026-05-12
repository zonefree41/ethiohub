import React from "react";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import Submit from "./pages/Submit.jsx";
import Listing from "./pages/Listing.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentCancelled from "./pages/PaymentCancelled.jsx";

function usePath() {
  const [path, setPath] = React.useState(
    window.location.pathname + window.location.search
  );

  React.useEffect(() => {
    const onPop = () =>
      setPath(window.location.pathname + window.location.search);

    window.addEventListener("popstate", onPop);

    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return path;
}

export default function App() {
  const path = usePath();

  if (path.startsWith("/admin/login")) return <AdminLogin />;
  if (path.startsWith("/admin")) return <AdminDashboard />;
  if (path.startsWith("/submit")) return <Submit />;
  if (path.startsWith("/listing/")) return <Listing />;
  if (path.startsWith("/category/")) return <Category />;

  if (path.startsWith("/success")) return <PaymentSuccess />;
  if (path.startsWith("/payment-cancelled")) return <PaymentCancelled />;

  return <Home />;
}