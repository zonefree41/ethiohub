import React from "react";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import Submit from "./pages/Submit.jsx";
import Listing from "./pages/Listing.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminTransportationVerification from "./pages/admin/AdminTransportationVerification.jsx";
import AdminTransportationDashboard from "./pages/admin/AdminTransportationDashboard.jsx";
import AdminHousingRequests from "./pages/admin/AdminHousingRequests.jsx";
import OwnerTransportationDashboard from "./pages/owner/OwnerTransportationDashboard.jsx";
import OwnerTravelDashboard from "./pages/owner/OwnerTravelDashboard.jsx";
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
import ActivateOwner from "./pages/owner/ActivateOwner.jsx";
import DeleteData from "./pages/DeleteData.jsx";
import Footer from "./components/Footer.jsx";
import Pricing from "./pages/Pricing.jsx";
import Location from "./pages/Location.jsx";
import Saved from "./pages/Saved.jsx";
import { trackPageView } from "./utils/analytics.js";
import TransportationQuotePage
  from "./pages/TransportationQuotePage.jsx";
  import HousingRequests from "./pages/HousingRequests.jsx";
  import SubmitHousingRequest from "./pages/SubmitHousingRequest.jsx";
  import SubmitTravelRequest from "./pages/SubmitTravelRequest";
  import AdminTravelDashboard from "./pages/admin/AdminTravelDashboard.jsx";
  import BeautyWorkspace from "./pages/owner/workspaces/BeautyWorkspace.jsx";
  import HousingWorkspace from "./pages/owner/workspaces/HousingWorkspace.jsx";
  import ImmigrationWorkspace from "./pages/owner/workspaces/ImmigrationWorkspace.jsx";
  import InsuranceWorkspace from "./pages/owner/workspaces/InsuranceWorkspace.jsx";
  import NotaryWorkspace from "./pages/owner/workspaces/NotaryWorkspace.jsx";
  import PrintingWorkspace from "./pages/owner/workspaces/PrintingWorkspace.jsx";
  import RealEstateWorkspace from "./pages/owner/workspaces/RealEstateWorkspace.jsx";
  import RestaurantWorkspace from "./pages/owner/workspaces/RestaurantWorkspace.jsx";
  import TaxWorkspace from "./pages/owner/workspaces/TaxWorkspace.jsx";
  import TranslatorWorkspace from "./pages/owner/workspaces/TranslatorWorkspace.jsx";
  import TutorWorkspace from "./pages/owner/workspaces/TutorWorkspace.jsx";
  import AutoRepairWorkspace from "./pages/owner/workspaces/AutoRepairWorkspace.jsx";
  import CargoShippingWorkspace from "./pages/owner/workspaces/CargoShippingWorkspace.jsx";
  import ChurchCommunityWorkspace from "./pages/owner/workspaces/ChurchCommunityWorkspace.jsx";
  import EventsEntertainmentWorkspace from "./pages/owner/workspaces/EventsEntertainmentWorkspace.jsx";
  import TravelAirlineServicesWorkspace from "./pages/owner/workspaces/TravelAirlineServicesWorkspace.jsx";

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

  const transportationQuoteMatch =
  path.match(/^\/transportation-quote\/([^/]+)$/);
  
  React.useEffect(() => {
  trackPageView(path);
}, [path]);

  if (path.startsWith("/admin/login")) return <AdminLogin />;

if (path.startsWith("/admin/transportation-verification")) {
  return <AdminTransportationVerification />;
}

if (path.startsWith("/owner/travel-requests")) {
  return <OwnerTravelDashboard />;
}

if (path.startsWith("/admin/transportation-requests")) {
  return <AdminTransportationDashboard />;
}

if (path.startsWith("/submit-housing-request")) {
  return <SubmitHousingRequest />;
}

if (path.startsWith("/submit-travel-request")) {
  return <SubmitTravelRequest />;
}

if (path.startsWith("/admin/travel-requests")) {
  return <AdminTravelDashboard />;
}

if (path.startsWith("/housing-requests")) {
  return <HousingRequests />;
}

if (path.startsWith("/admin/housing-requests")) {
  return <AdminHousingRequests />;
}

if (path.startsWith("/admin")) return <AdminDashboard />;

  if (path.startsWith("/owner/login")) return <OwnerLogin />;
if (path.startsWith("/owner/register")) return <OwnerRegister />;
if (path.startsWith("/owner/forgot-password")) return <ForgotPassword />;
if (path.startsWith("/owner/reset-password/")) return <ResetPassword />;
if (path.startsWith("/owner/activate/")) return <ActivateOwner />;
if (path.startsWith("/owner/listings/edit/")) return <EditListing />;
if (path.startsWith("/owner/dashboard")) return <OwnerDashboard />;
if (path.startsWith("/owner/transportation")) {
  return <OwnerTransportationDashboard />;
}
if (path.startsWith("/owner/workspaces/beauty")) {
  return <BeautyWorkspace />;
}
if (path.startsWith("/owner/workspaces/housing")) {
  return <HousingWorkspace />;
}
if (path.startsWith("/owner/workspaces/immigration")) {
  return <ImmigrationWorkspace />;
}
if (path.startsWith("/owner/workspaces/insurance")) {
  return <InsuranceWorkspace />;
}
if (path.startsWith("/owner/workspaces/notary")) {
  return <NotaryWorkspace />;
}
if (path.startsWith("/owner/workspaces/printing")) {
  return <PrintingWorkspace />;
}
if (path.startsWith("/owner/workspaces/real-estate")) {
  return <RealEstateWorkspace />;
}
if (path.startsWith("/owner/workspaces/restaurant")) {
  return <RestaurantWorkspace />;
}
if (path.startsWith("/owner/workspaces/tax")) {
  return <TaxWorkspace />;
}
if (path.startsWith("/owner/workspaces/translator")) {
  return <TranslatorWorkspace />;
}
if (path.startsWith("/owner/workspaces/tutor")) {
  return <TutorWorkspace />;
}
if (path.startsWith("/owner/workspaces/auto-repair")) {
  return <AutoRepairWorkspace />;
}
if (path.startsWith("/owner/workspaces/cargo-shipping")) {
  return <CargoShippingWorkspace />;
}
if (path.startsWith("/owner/workspaces/church-community")) {
  return <ChurchCommunityWorkspace />;
}
if (path.startsWith("/owner/workspaces/events-entertainment")) {
  return <EventsEntertainmentWorkspace />;
}
if (path.startsWith("/owner/workspaces/travel-airline-services")) {
  return <TravelAirlineServicesWorkspace />;
}
if (path.startsWith("/listing/")) return <Listing />;

  if (path.startsWith("/submit")) return <><Submit /><Footer /></>;
if (path.startsWith("/listing/")) return <><Listing /><Footer /></>;
if (path.startsWith("/location/")) return <><Location /><Footer /></>;
if (path.startsWith("/category/")) return <><Category /><Footer /></>;

if (path.startsWith("/success")) return <><PaymentSuccess /><Footer /></>;
if (path.startsWith("/payment-cancelled")) return <><PaymentCancelled /><Footer /></>;

if (path.startsWith("/pricing")) return <><Pricing /><Footer /></>;

if (path.startsWith("/privacy")) return <><Privacy /><Footer /></>;
if (path.startsWith("/terms")) return <><Terms /><Footer /></>;
if (path.startsWith("/contact")) return <><Contact /><Footer /></>;
if (path.startsWith("/delete-data")) return <><DeleteData /><Footer /></>;
if (path.startsWith("/saved")) return <><Saved /><Footer /></>;

if (transportationQuoteMatch) {
  const quoteToken = transportationQuoteMatch[1];

  return (
    <TransportationQuotePage
      quoteToken={quoteToken}
    />
  );
}

return <><Home /><Footer /></>;
}