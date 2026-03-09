import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Bell, Search as SearchIcon } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/[0.04] h-[64px]">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center gap-8">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="brand-logo shadow-[#007AFF]/20">E</div>
          <span className="text-[#1D1D1F] font-normal text-xl tracking-tighter">ELaBada</span>
        </Link>

        <div className="flex-1" />

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-4">
            <button className="btn-icon">
              <Bell className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-black/[0.06] mx-1" />

            <div className="flex items-center gap-3 pr-2">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider leading-none mb-1">Welcome</p>
                <p className="text-sm font-bold text-[#1D1D1F] leading-none">{user.name}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9FE870] to-[#8ED660] flex items-center justify-center shadow-lg shadow-[#9FE870]/20">
                <User className="w-5 h-5 text-[#1D1D1F]" />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-icon group"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        ) : (
          <Link to="/login"
            className="btn-primary">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
