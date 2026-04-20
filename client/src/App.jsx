import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { lazy, Suspense } from "react";
const ShopsPage = lazy(() => import("./pages/ShopsPage"));
const LoginPage = lazy(() => import("./pages/Login"));
const SignupPage = lazy(() => import("./pages/Signup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
import "./index.css";

function ProtectedRoute({ role, element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return element;
}

import { CheckCircle, X } from "lucide-react";

function Toast({ message, onClose }) {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 lg:top-auto lg:bottom-12 lg:right-12 lg:left-auto lg:translate-x-0 z-[1000] animate-fadeUp">
      <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.03] p-5 pr-8 flex items-center gap-4 min-w-[320px]">
        <div className="w-10 h-10 rounded-2xl bg-[#228B2210] flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-[#228B22]" />
        </div>
        <div>
          <p className="text-[14px] font-normal text-[#1D1D1F] leading-tight">{message}</p>
        </div>
        <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1D1D1F]/20 hover:text-[#1D1D1F] transition-all transform active:scale-95">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function GlobalToast() {
  const { successMsg, setSuccessMsg } = useAuth();
  if (!successMsg) return null;
  return <Toast message={successMsg} onClose={() => setSuccessMsg("")} />;
}

function AppRoutes() {
  return (
    <>
      <GlobalToast />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-10 h-10 border-4 border-[#014421]/20 border-t-[#014421] rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<ProtectedRoute role="admin" element={<AdminDashboard />} />} />
          <Route path="/owner" element={<ProtectedRoute role="owner" element={<OwnerDashboard />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
