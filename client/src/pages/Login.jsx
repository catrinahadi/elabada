import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Eye,
    EyeOff,
    Store,
    Shield,
    ShoppingBag
} from "lucide-react";

/* ── Role cards data ──────────────────────────────────────── */
const ROLES = [
    {
        key: "customer",
        label: "Customer",
        icon: ShoppingBag,
        desc: "Find and book local laundry",
        hint: "customer@elabada.com / cust123",
        color: "text-[#5B4DFF]",
        bg: "bg-[#5B4DFF10]"
    },
    {
        key: "owner",
        label: "Owner",
        icon: Store,
        desc: "Manage your laundry business",
        hint: "owner@elabada.com / owner123",
        color: "text-[#9FE870]",
        bg: "bg-[#9FE87015]"
    },
    {
        key: "admin",
        label: "Admin",
        icon: Shield,
        desc: "System review & control",
        hint: "admin@elabada.com / admin123",
        color: "text-[#1D1D1F]",
        bg: "bg-gray-100"
    }
];

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRoleClick = (role) => {
        setSelected(role.key);
        setError("");
        setEmail(role.hint.split(" / ")[0]);
        setPassword(role.hint.split(" / ")[1]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        await new Promise((r) => setTimeout(r, 600));

        const result = login(email.trim(), password);
        setLoading(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        if (result.role === "admin") {
            navigate("/admin", { replace: true });
        } else if (result.role === "owner") {
            navigate("/owner", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 selection:bg-[#9FE870]">
            <div className="w-full max-w-[900px] flex flex-col md:flex-row bg-white rounded-[48px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-fadeUp">

                {/* Visual Side */}
                <div className="w-full md:w-[45%] bg-[#1D1D1F] p-12 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="brand-logo bg-[#9FE870] text-[#1D1D1F]">E</div>
                            <span className="text-white font-black text-2xl tracking-tighter">
                                ELaBada
                            </span>
                        </div>

                        <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-4">
                            Premium <br />
                            <span className="text-[#9FE870]">Laundry</span> <br />
                            Experience.
                        </h1>

                        <p className="text-white/35 font-bold text-sm max-w-[300px] leading-relaxed">
                            Using TOPSIS computation to rank laundry services in Los Baños
                            based on your unique priorities.
                        </p>
                    </div>

                    {/* Gradient blobs */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#5B4DFF] rounded-full blur-[100px] opacity-20" />
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#9FE870] rounded-full blur-[100px] opacity-10" />
                </div>

                {/* Form Side */}
                <div className="flex-1 p-12 md:p-16 space-y-10">

                    <div>
                        <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-sm text-[#8E8E93] font-bold">
                            Continue as:
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {ROLES.map((role) => (
                            <button
                                key={role.key}
                                type="button"
                                onClick={() => handleRoleClick(role)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2
                  ${selected === role.key
                                        ? "border-[#1D1D1F] bg-[#1D1D1F] text-white shadow-xl -translate-y-1"
                                        : "border-black/[0.04] bg-white hover:border-black/[0.1] text-[#1D1D1F]"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selected === role.key ? "bg-white/10" : role.bg
                                        }`}
                                >
                                    <role.icon
                                        className={`w-5 h-5 ${selected === role.key ? "text-white" : role.color
                                            }`}
                                    />
                                </div>

                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {role.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">

                            {/* Email */}
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full bg-[#F3F4F6] rounded-2xl px-5 py-4 text-sm font-semibold 
                             placeholder:text-[#8E8E93] focus:outline-none 
                             focus:ring-2 focus:ring-[#1D1D1F10]"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-[#F3F4F6] rounded-2xl px-5 py-4 text-sm font-semibold 
                             placeholder:text-[#8E8E93] focus:outline-none 
                             focus:ring-2 focus:ring-[#1D1D1F10]"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F]"
                                >
                                    {showPw ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 animate-shake">
                                <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !selected}
                            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all
                ${loading || !selected
                                    ? "bg-[#E5E5EA] text-[#8E8E93]"
                                    : "bg-[#1D1D1F] text-white hover:bg-[#333] active:scale-95"
                                }`}
                        >
                            {loading ? "Authenticating..." : "Sign In"}
                        </button>

                    </form>

                    <div className="text-center">
                        <Link
                            to="/"
                            className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest hover:text-[#1D1D1F] transition-colors"
                        >
                            Continue as Guest →
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}