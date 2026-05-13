import React from "react";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import Submit from "./pages/Submit.jsx";
import Listing from "./pages/Listing.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentCancelled from "./pages/PaymentCancelled.jsx";
import OwnerLogin from "./pages/owner/OwnerLogin.jsx";
import OwnerRegister from "./pages/owner/OwnerRegister.jsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import EditListing from "./pages/owner/EditListing.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Contact from "./pages/Contact.jsx";
import ForgotPassword from "./pages/owner/ForgotPassword.jsx";
import ResetPassword from "./pages/owner/ResetPassword.jsx";

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

  if (path.startsWith("/owner/login")) return <OwnerLogin />;
if (path.startsWith("/owner/register")) return <OwnerRegister />;
if (path.startsWith("/owner/forgot-password")) return <ForgotPassword />;
if (path.startsWith("/owner/reset-password/")) return <ResetPassword />;
if (path.startsWith("/owner/listings/edit/")) return <EditListing />;
if (path.startsWith("/owner/dashboard")) return <OwnerDashboard />;

  if (path.startsWith("/submit")) return <Submit />;
  if (path.startsWith("/listing/")) return <Listing />;
  if (path.startsWith("/category/")) return <Category />;

  if (path.startsWith("/success")) return <PaymentSuccess />;
  if (path.startsWith("/payment-cancelled")) return <PaymentCancelled />;

  if (path.startsWith("/privacy")) return <Privacy />;
if (path.startsWith("/terms")) return <Terms />;
if (path.startsWith("/contact")) return <Contact />;

  return <Home />;
}