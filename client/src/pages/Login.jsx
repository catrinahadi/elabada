import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ArrowRight, ShieldCheck, User, Lock } from "lucide-react";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState("customer");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Clear fields when role changes
    useEffect(() => {
        setUsername("");
        setPassword("");
        setError("");
    }, [selectedRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(username.trim(), password, selectedRole);
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
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-outfit relative">
            {/* Brand/Logo moved to upper left outside the box */}
            <div className="absolute top-10 left-10 z-10">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-normal text-xl shadow-lg shadow-[#014421]/20">E</div>
                    <span className="font-normal text-[22px] tracking-tighter text-[#1D1D1F]">ELaBada</span>
                </Link>
            </div>

            <div className="w-full max-w-[480px] bg-white rounded-[40px] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.12)] border border-black/[0.03] px-10 py-4 md:px-14 md:py-4 flex flex-col gap-6 animate-scaleIn">
                <div className="flex flex-col items-center text-center space-y-2 mt-4">
                    <h2 className="text-[24px] font-bold text-[#1D1D1F] tracking-tight">Sign in</h2>
                    <p className="text-[14px] font-normal text-[#8E8E93]">Please choose your role to sign in</p>
                </div>

                {/* Minimalist Role Selection */}
                <div className="flex flex-col space-y-3">
                    <div className="flex p-1.5 bg-[#F3F4F6] rounded-2xl gap-1">
                        {roles.map(r => (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setSelectedRole(r.key)}
                                className={`flex-1 py-3 rounded-xl text-[14px] font-normal transition-all ${selectedRole === r.key
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
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-6 text-[14px] font-normal text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
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
                                    className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-14 text-[14px] font-normal text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
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
                                <p className="text-[14px] font-normal text-[#7B1113] leading-relaxed text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-[#014421] text-white rounded-2xl font-normal text-[14px] flex items-center justify-center gap-3 hover:opacity-90 shadow-xl shadow-[#014421]/10 transition-all active:scale-95 disabled:opacity-50 mt-4"
                        >
                            {loading ? "Signing in..." : (
                                <>Sign in <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>

                <div className="pt-6 border-t border-black/[0.04] text-center space-y-4 mb-4">
                    <p className="text-[14px] font-normal text-[#8E8E93]">
                        No account yet? <Link to="/signup" className="text-[#014421] hover:underline font-bold">Create account</Link>
                    </p>
                    <Link to="/" className="text-[14px] font-normal text-[#555] hover:text-black transition-colors block">
                        Continue as guest
                    </Link>
                </div>
            </div>
        </div>
    );
}
