import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CollectionsPage from "./pages/CollectionsPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Navbar from "./components/Navbar";
import { useAtomValue } from "jotai";
import { authUserAtom } from "./store/auth";
import { Navigate} from "react-router-dom";
import AdminPage from "./pages/AdminPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import CartDrawer from "./components/CartDrawer";
import CheckoutFailurePage from "./pages/CheckoutFailurePage.tsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.tsx";
import OrderDetailsPage from "./pages/OrderDetailsPage.tsx";

export default function AppRoutes() {
  const user = useAtomValue(authUserAtom);
  return (
    <div className="relative min-h-screen">
      {/* Background Video */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://play.vidyard.com/oPRB3PXipUFzqMAjHwDdUV/type/background" type="video/mp4" />
        </video>
        {/* Semi-transparent overlay for better text readability */}
        <div className="absolute inset-0 backdrop-blur-sm"></div>
      </div>

      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:collection" element={<CollectionsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/checkout/success/" element={<PaymentSuccessPage />} />
        <Route path="/checkout/failure" element={<CheckoutFailurePage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/admin" element={user?.role === 'admin' || user?.role === 'superadmin' ? <AdminPage /> : <Navigate to="/login" replace />} />
      </Routes>
      <CartDrawer />
    </div>
  );
}


