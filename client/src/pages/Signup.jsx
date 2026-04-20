import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, User, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState("customer");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Clear fields when role changes
    useEffect(() => {
        setName("");
        setUsername("");
        setPassword("");
        setError("");
    }, [selectedRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,128}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be 8-128 characters long and include at least one uppercase letter, one lowercase letter, one numeric digit, and one special character.");
            setLoading(false);
            return;
        }

        const result = await signup({
            name,
            email: username.trim(),
            password,
            role: selectedRole
        });

        setLoading(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        if (result.role === "owner") navigate("/owner", { replace: true });
        else navigate("/shops", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-outfit relative">
            {/* Brand/Logo - Responsive Positioning */}
            <div className="absolute top-8 left-8 md:top-10 md:left-10 z-10">
                <div className="flex items-center gap-3 select-none">
                    <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-normal text-xl shadow-lg shadow-[#014421]/20 transition-transform">E</div>
                    <span className="font-normal text-[22px] tracking-tighter text-[#1D1D1F]">ELaBada</span>
                </div>
            </div>

            <div className="w-full max-w-[520px] mt-20 md:mt-0 bg-white rounded-[40px] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.12)] border border-black/[0.03] px-10 py-4 md:px-14 md:py-4 flex flex-col gap-6 animate-scaleIn">
                <div className="flex flex-col items-center text-center space-y-4 mt-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (window.history.length > 2) navigate(-1);
                            else navigate("/");
                        }}
                        className="self-start w-fit p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-[#1D1D1F] group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-1 mt-4">
                        <h2 className="text-[24px] font-bold text-[#1D1D1F] tracking-tight">Create account</h2>
                        <p className="text-[14px] font-normal text-[#8E8E93]">Start your journey with ELaBada today</p>
                    </div>
                </div>

                {/* Minimalist Role Toggle */}
                <div className="flex flex-col space-y-4">
                    <div className="flex p-1.5 bg-[#F3F4F6] rounded-2xl gap-1">
                        {["customer", "owner"].map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className={`flex-1 py-3.5 rounded-xl text-[14px] font-normal transition-all ${selectedRole === role
                                    ? "bg-white text-[#014421] shadow-sm"
                                    : "text-[#8E8E93] hover:text-[#1D1D1F]"
                                    }`}
                            >
                                {role === "customer" ? "As customer" : "As shop owner"}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={200}
                                    className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-6 text-[14px] font-normal text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    maxLength={200}
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
                                    maxLength={200}
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
                            className="w-full h-14 bg-[#014421] text-white rounded-2xl font-normal text-[14px] flex items-center justify-center gap-3 hover:opacity-90 shadow-2xl shadow-[#014421]/10 transition-all mt-4 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Register"}
                        </button>
                    </form>
                </div>

                <div className="pt-6 border-t border-black/[0.04] text-center mb-4">
                    <p className="text-[14px] font-normal text-[#8E8E93]">
                        Already have an account? <Link to="/" className="text-[#014421] font-bold hover:underline ml-1">Log in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
