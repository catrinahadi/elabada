import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState("customer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(email.trim(), password);
        setLoading(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        if (result.role === "admin") navigate("/admin", { replace: true });
        else if (result.role === "owner") navigate("/owner", { replace: true });
        else navigate("/", { replace: true });
    };

    const roles = [
        { key: "customer", label: "Customer" },
        { key: "owner", label: "Shop Owner" },
        { key: "admin", label: "Administrator" }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-outfit">
            <div className="w-full max-w-[1000px] bg-white rounded-[48px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] flex flex-col md:flex-row border border-black/[0.03]">

                {/* Left Side - Visual Branding */}
                <div className="w-full md:w-[42%] bg-[#1D1D1F] p-12 md:p-16 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="relative z-10">
                        <Link to="/" className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#014421]/20">E</div>
                            <span className="font-black text-2xl tracking-tighter">ELaBada</span>
                        </Link>
                    </div>

                    {/* Subtle aesthetic patterns */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#014421]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7B1113]/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 p-12 md:p-20 flex flex-col justify-center bg-[#FDFDFD]">
                    <div className="max-w-[400px] w-full mx-auto space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter capitalize transition-all">Sign In</h2>
                            <p className="text-sm font-bold text-[#8E8E93]">Choose your role to access your portal</p>
                        </div>

                        {/* Minimalist Role Selection */}
                        <div className="flex p-1.5 bg-[#F3F4F6] rounded-2xl gap-1">
                            {roles.map(r => (
                                <button
                                    key={r.key}
                                    onClick={() => setSelectedRole(r.key)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-[900] uppercase tracking-widest transition-all ${selectedRole === r.key
                                        ? "bg-white text-[#014421] shadow-sm"
                                        : "text-[#8E8E93] hover:text-[#1D1D1F]"
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-6 text-sm font-bold text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-14 text-sm font-bold text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F] transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-[#7B1113]/5 border border-[#7B1113]/10 rounded-2xl animate-shake">
                                    <p className="text-[10px] font-black text-[#7B1113] uppercase tracking-widest leading-relaxed text-center">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-[#1D1D1F] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#014421] hover:scale-[1.02] shadow-xl shadow-black/5 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {loading ? "Signing In..." : (
                                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>

                        <div className="pt-8 border-t border-black/[0.04] text-center space-y-4">
                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                No Account yet? <Link to="/signup" className="text-[#014421] hover:underline font-black">Create account</Link>
                            </p>
                            <Link to="/" className="text-[10px] font-black text-[#555] uppercase tracking-widest hover:text-black transition-colors block">
                                Continue as Guest
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
