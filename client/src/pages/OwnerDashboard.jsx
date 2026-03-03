import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard, Store, MessageSquare,
    Bell, LogOut, ChevronRight,
    TrendingUp, Users, DollarSign, Star, MoreVertical,
    PlusCircle, Edit3, Trash2, ArrowUpRight, Clock,
    FileText, Mail, ShieldCheck, MapPin, XCircle, CheckCircle, Plus, Zap, AlertTriangle
} from "lucide-react";

// Mock Data
const MOCK_SHOPS = [
    { id: "s1", name: "Fresh & Clean Laundry", address: "Lopez Avenue, Los Baños", price: 45, status: "Approved", rating: 4.8, reviews: 127, permitEmail: "permit_101@elabada.com", image: "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
    { id: "s2", name: "QuickWash Express", address: "National Highway, Los Baños", price: 50, status: "Pending", rating: 4.9, reviews: 203, permitEmail: "express_wash@elabada.com", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
];

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn p-10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-[32px] bg-[#80000010] flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-[#800000]" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{title}</h2>
                    <p className="text-sm font-bold text-[#8E8E93] mt-2">{message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <button onClick={onCancel} className="py-4 rounded-2xl bg-[#F8F9FA] text-[#1D1D1F] font-black uppercase text-[10px] tracking-widest hover:bg-[#E5E5EA] transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="py-4 rounded-2xl bg-[#800000] text-white font-black uppercase text-[10px] tracking-widest hover:bg-black transition-colors shadow-lg shadow-[#800000]/20">Confirm Delete</button>
                </div>
            </div>
        </div>
    );
}

export default function OwnerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarTab, setSidebarTab] = useState("overview");
    const [shops, setShops] = useState(MOCK_SHOPS);
    const [deletingId, setDeletingId] = useState(null);

    const handleLogout = () => { logout(); navigate("/login"); };

    const confirmDelete = () => {
        setShops(prev => prev.filter(s => s.id !== deletingId));
        setDeletingId(null);
    };

    return (
        <div className="flex bg-[#F8F9FA] min-h-screen text-[#1D1D1F]">
            {/* Sidebar - High Contrast */}
            <aside className="w-72 bg-[#E6FCE6] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="brand-logo bg-[#800000]">E</div>
                    <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <div className="pb-3 px-4 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Owner Panel</div>
                    <button
                        onClick={() => setSidebarTab("overview")}
                        className={`sidebar-link w-full ${sidebarTab === "overview" ? "active bg-[#014421] text-white shadow-lg shadow-[#014421]/20" : "text-[#014421]/60 hover:bg-[#014421]/5"}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button
                        onClick={() => setSidebarTab("listings")}
                        className={`sidebar-link w-full ${sidebarTab === "listings" ? "active bg-[#014421] text-white shadow-lg shadow-[#014421]/20" : "text-[#014421]/60 hover:bg-[#014421]/5"}`}
                    >
                        <Store className="w-5 h-5" /> Active Listings
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-black/[0.05]">
                    <button onClick={handleLogout} className="sidebar-link w-full text-[#800000] hover:bg-[#80000008] transition-colors">
                        <LogOut className="w-5 h-5" /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-24 px-12 flex items-center justify-between sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-6">
                        {sidebarTab !== "overview" && (
                            <button
                                onClick={() => setSidebarTab("overview")}
                                className="h-10 w-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter lowercase">
                            {sidebarTab === "overview" ? "Owner Dashboard" : "Management Console"}
                        </h1>
                    </div>
                </header>

                <div className="p-12 space-y-12 max-w-[1600px] w-full mx-auto animate-fadeUp">

                    {sidebarTab === "overview" ? (
                        <>
                            {/* Welcome Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-gradient-to-br from-[#003366] to-[#001A33] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-white/60 text-xs font-black uppercase tracking-[0.4em] mb-4">Operations Center</p>
                                        <h2 className="text-6xl font-black tracking-tighter mb-4 leading-none">Welcome,<br />{user?.name || 'Maria'}</h2>
                                        <p className="text-white/40 text-sm font-bold max-w-md">Your laundry network is performing optimally. Check your active listings for recent compliance updates.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
                                    <ArrowUpRight className="absolute bottom-12 right-12 w-12 h-12 text-white/10 group-hover:text-white/40 group-hover:rotate-45 transition-all duration-500" />
                                </div>

                                <div className="bg-white rounded-[48px] p-10 border border-black/[0.04] shadow-sm flex flex-col justify-between group hover:border-[#80000020] transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 rounded-3xl bg-[#80000010] flex items-center justify-center">
                                            <Clock className="w-8 h-8 text-[#800000]" />
                                        </div>
                                        <span className="bg-[#228B2215] text-[#228B22] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Live Sync</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-2">Permit Response</p>
                                        <h3 className="text-5xl font-black text-[#1D1D1F] tracking-tighter">Fast</h3>
                                        <p className="text-xs font-bold text-[#228B22] mt-2">Top 5% in Region</p>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Stats Tiles */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <button
                                    onClick={() => setSidebarTab("listings")}
                                    className="bg-white p-8 rounded-[40px] border border-black/[0.04] shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-[#00336610] flex items-center justify-center mb-6">
                                        <ShieldCheck className="w-6 h-6 text-[#003366]" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-4xl font-black text-[#1D1D1F]">Inbox</h4>
                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Permit Status</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSidebarTab("listings")}
                                    className="bg-white p-8 rounded-[40px] border border-black/[0.04] shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all group border-b-4 border-b-[#80000020]"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-[#80000010] flex items-center justify-center mb-6">
                                        <Store className="w-6 h-6 text-[#800000]" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-4xl font-black text-[#1D1D1F]">{shops.length}</h4>
                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Active Listings</p>
                                    </div>
                                </button>

                                <div className="bg-white p-8 rounded-[40px] border border-black/[0.04] shadow-sm flex flex-col justify-between group">
                                    <div className="w-12 h-12 rounded-2xl bg-[#228B2210] flex items-center justify-center mb-6">
                                        <MessageSquare className="w-6 h-6 text-[#228B22]" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-4xl font-black text-[#1D1D1F]">330</h4>
                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest leading-tight">Total Reviews</p>
                                    </div>
                                </div>

                                <div className="bg-[#1D1D1F] p-8 rounded-[40px] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                                    <TrendingUp className="w-8 h-8 text-[#228B22] mb-6" />
                                    <div className="relative z-10">
                                        <h4 className="text-4xl font-black">+24%</h4>
                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Revenue Growth Estimate</p>
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-12 animate-fadeUp">
                            <div className="flex items-center justify-between border-b border-black/[0.05] pb-10">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-[#800000]" />
                                        <h2 className="text-5xl font-black tracking-tighter text-[#1D1D1F]">Shop Registry</h2>
                                    </div>
                                    <p className="text-lg font-bold text-[#8E8E93]">Manage your laundry network and compliance certifications.</p>
                                </div>
                                <button className="bg-[#228B22] hover:bg-[#1A6A1A] text-white px-10 py-5 rounded-[32px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-[#228B22]/20 flex items-center gap-3 transition-all active:scale-95">
                                    <Plus className="w-5 h-5" /> New Registration
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-10">
                                {shops.map(shop => (
                                    <div key={shop.id} className="bg-white rounded-[56px] p-12 flex flex-col lg:flex-row items-center gap-12 border border-black/[0.04] shadow-sm hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] hover:border-[#00336610] transition-all group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent pointer-events-none" />

                                        <div className="relative shrink-0">
                                            <div className="w-48 h-48 rounded-[72px] overflow-hidden bg-[#F3F4F6] border-8 border-white shadow-2xl relative group-hover:scale-110 transition-transform duration-1000">
                                                <img src={shop.image} className="w-full h-full object-cover transition-all duration-1000" alt="" />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                            </div>
                                            <div className="absolute -bottom-4 -right-4 bg-white p-5 rounded-[36px] shadow-2xl border border-black/5">
                                                {shop.status === 'Approved' ? (
                                                    <CheckCircle className="w-10 h-10 text-[#228B22]" />
                                                ) : (
                                                    <Clock className="w-10 h-10 text-[#FFB017]" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-10 relative z-10">
                                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${shop.status === 'Approved' ? 'bg-[#228B2215] text-[#228B22]' : 'bg-[#FF3B3015] text-[#FF3B30]'}`}>
                                                            {shop.status} Verification
                                                        </span>
                                                        <h3 className="text-5xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shop.name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-base font-bold text-[#8E8E93]">
                                                        <MapPin className="w-5 h-5 text-[#003366]" /> {shop.address}
                                                    </div>
                                                </div>
                                                <div className="bg-[#F8F9FA] p-8 rounded-[40px] border border-black/[0.02] text-right min-w-[200px]">
                                                    <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-2 leading-none">Market Rate</p>
                                                    <p className="text-4xl font-black text-[#800000] tracking-tighter">₱{shop.price}<span className="text-sm">/kg</span></p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-black/[0.05]">
                                                <div className="flex items-center gap-5 p-2 transition-colors cursor-pointer group/item" onClick={() => window.open(shop.permitUrl, '_blank')}>
                                                    <div className="w-16 h-16 rounded-[24px] bg-[#F8F9FA] group-hover/item:bg-[#003366] flex items-center justify-center shadow-sm transition-all group-hover/item:rotate-12">
                                                        <FileText className="w-7 h-7 text-[#003366] group-hover/item:text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Official Permit</p>
                                                        <p className="text-sm font-black text-[#1D1D1F] group-hover/item:text-[#003366] transition-colors uppercase tracking-tighter">View Document</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-5 p-2">
                                                    <div className="w-16 h-16 rounded-[24px] bg-[#F8F9FA] flex items-center justify-center shadow-sm">
                                                        <Zap className="w-7 h-7 text-[#FFB017]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Processing (TS)</p>
                                                        <p className="text-sm font-black text-[#1D1D1F] uppercase tracking-tighter">24HR Turnaround</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-5 p-2">
                                                    <div className="w-16 h-16 rounded-[24px] bg-[#F8F9FA] flex items-center justify-center shadow-sm">
                                                        <Star className="w-7 h-7 text-[#228B22]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Global Score</p>
                                                        <p className="text-sm font-black text-[#1D1D1F] uppercase tracking-tighter">{shop.rating} / 5.0</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col gap-5 pt-8 lg:pt-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-black/[0.05] relative z-10">
                                            <button className="btn-icon h-20 w-20 rounded-[32px] bg-[#F8F9FA] hover:bg-[#003366] hover:text-white border-none shadow-sm transition-all"><Edit3 className="w-7 h-7" /></button>
                                            <button onClick={() => setDeletingId(shop.id)} className="btn-icon h-20 w-20 rounded-[32px] bg-[#F8F9FA] hover:bg-[#800000] hover:text-white border-none shadow-sm transition-all text-[#8E8E93]"><Trash2 className="w-7 h-7" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {deletingId && (
                <ConfirmationModal
                    title="Nullify Registry?"
                    message="Are you sure you want to permanently delete this listing? This action cannot be reversed within the current sync cycle."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingId(null)}
                />
            )}
        </div>
    );
}
