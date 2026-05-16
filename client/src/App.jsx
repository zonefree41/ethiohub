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
import DeleteData from "./pages/DeleteData.jsx";
import Footer from "./components/Footer.jsx";

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

  if (path.startsWith("/submit")) return <><Submit /><Footer /></>;
if (path.startsWith("/listing/")) return <><Listing /><Footer /></>;
if (path.startsWith("/category/")) return <><Category /><Footer /></>;

if (path.startsWith("/success")) return <><PaymentSuccess /><Footer /></>;
if (path.startsWith("/payment-cancelled")) return <><PaymentCancelled /><Footer /></>;

if (path.startsWith("/privacy")) return <><Privacy /><Footer /></>;
if (path.startsWith("/terms")) return <><Terms /><Footer /></>;
if (path.startsWith("/contact")) return <><Contact /><Footer /></>;
if (path.startsWith("/delete-data")) return <><DeleteData /><Footer /></>;

return <><Home /><Footer /></>;
}