import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState("customer");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signup({
            name,
            email: email.trim(),
            password,
            role: selectedRole,
            phone: selectedRole === "owner" ? phone : undefined
        });

        setLoading(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        if (result.role === "owner") navigate("/owner", { replace: true });
        else navigate("/", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-outfit">
            <div className="w-full max-w-[1100px] bg-white rounded-[48px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.06)] flex flex-col md:flex-row border border-black/[0.03]">

                {/* Visual Section */}
                <div className="w-full md:w-[38%] bg-[#1D1D1F] p-12 md:p-16 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-16">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>

                        <div className="space-y-8">
                            <div className="w-12 h-12 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#014421]/20">E</div>
                            <h1 className="text-5xl font-black tracking-tighter leading-[1] mt-6">
                                Join our <br />
                                <span className="text-[#014421]">community.</span>
                            </h1>
                            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px]">
                                Experience the next generation of laundry service management and optimization.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-3">
                            {["Smart Ranking", "Secure Payments", "Live Tracking"].map(feature => (
                                <div key={feature} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-[#014421]" />
                                    <span className="text-[11px] font-bold text-white/60">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#014421]/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7B1113]/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Registration Form */}
                <div className="flex-1 p-12 md:p-20 bg-[#FDFDFD]">
                    <div className="max-w-[440px] w-full mx-auto space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter capitalize">Create Account</h2>
                            <p className="text-sm font-bold text-[#8E8E93]">Start your journey with ELaBada today</p>
                        </div>

                        {/* Minimalist Role Toggle */}
                        <div className="flex p-1.5 bg-[#F3F4F6] rounded-2xl gap-1">
                            {["customer", "owner"].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-[900] uppercase tracking-widest transition-all ${selectedRole === role
                                        ? "bg-white text-[#014421] shadow-sm"
                                        : "text-[#8E8E93] hover:text-[#1D1D1F]"
                                        }`}
                                >
                                    {role === "customer" ? "As Customer" : "As Shop Owner"}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-6 text-sm font-bold text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
                                        required
                                    />
                                </div>
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
                                {selectedRole === "owner" && (
                                    <div className="relative group animate-fadeDown">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="Business Phone Number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full h-14 bg-[#F3F4F6] rounded-2xl pl-12 pr-6 text-sm font-bold text-[#1D1D1F] border border-transparent focus:bg-white focus:border-[#014421]/10 focus:ring-4 focus:ring-[#014421]/5 outline-none transition-all placeholder:text-[#8E8E93]/60"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#014421] transition-colors" />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="Secure Password"
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
                                className="w-full h-15 bg-[#1D1D1F] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#014421] shadow-2xl shadow-black/5 transition-all mt-4 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? "Creating Account..." : "Confirm & Register"}
                            </button>
                        </form>

                        <div className="pt-8 border-t border-black/[0.04] text-center">
                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest leading-none">
                                Already have an account? <Link to="/login" className="text-[#014421] font-black hover:underline ml-1">Log in here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
