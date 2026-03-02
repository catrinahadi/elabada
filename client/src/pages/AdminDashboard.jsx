import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard, Store, Users, Shield,
    BarChart3, Settings, LogOut,
    CheckCircle, XCircle, Clock, MoreVertical,
    Trash2, Edit3, ChevronRight, ArrowUpRight,
    FileText, Eye, AlertCircle, TrendingUp,
    MapPin, Calendar, ShieldCheck, ArrowLeft
} from "lucide-react";

// Mock Data
const INITIAL_SHOPS = [
    { id: "s1", shopName: "Fresh & Clean Laundry", ownerName: "Juan Dela Cruz", address: "Lopez Avenue, Los Baños", price: 45, permitStatus: "pending", submittedAt: "2h ago", image: "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
    { id: "s2", shopName: "QuickWash Express", ownerName: "Maria Santos", address: "National Highway, Los Baños", price: 50, permitStatus: "approved", submittedAt: "1d ago", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
    { id: "s3", shopName: "Elite Washers", ownerName: "Ricardo Dalisay", address: "Poblacion, Los Baños", price: 60, permitStatus: "rejected", submittedAt: "3d ago", image: "https://images.unsplash.com/photo-1570624040263-54876f161989?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
    { id: "s4", shopName: "Laba Laban", ownerName: "Sisa", address: "Anos, Los Baños", price: 40, permitStatus: "pending", submittedAt: "5h ago", image: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=250&fit=crop", permitUrl: "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80" },
];

function PermitModal({ shop, onClose }) {
    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-black/[0.05] flex items-center justify-between bg-[#F8F9FA]">
                    <div>
                        <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Business Permit Verification</h2>
                        <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Document Registry #{shop.id.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="btn-icon bg-white text-black border-none hover:bg-black hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-[#F3F4F6]">
                    <div className="bg-white p-4 rounded-[32px] shadow-sm border border-black/[0.03]">
                        <img src={shop.permitUrl} className="w-full rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 cursor-zoom-in" alt="Business Permit" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-[#003366] tracking-[0.2em]">Application Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-black/[0.05] pb-2">
                                    <span className="text-xs text-[#8E8E93] font-bold">Shop Name</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.shopName}</span>
                                </div>
                                <div className="flex justify-between border-b border-black/[0.05] pb-2">
                                    <span className="text-xs text-[#8E8E93] font-bold">Representative</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.ownerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-[#8E8E93] font-bold">Submission Date</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.submittedAt}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-[#800000] tracking-[0.2em]">Compliance Check</h3>
                            <div className="flex items-center gap-3 bg-[#E1FFE1] p-4 rounded-2xl border border-[#228B22]/10">
                                <ShieldCheck className="w-5 h-5 text-[#228B22]" />
                                <span className="text-[10px] font-black text-[#228B22] uppercase tracking-widest">Digital Signature Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-white border-t border-black/[0.05] flex justify-end">
                    <button className="btn-primary py-4 px-12 text-[10px] uppercase tracking-widest bg-[#003366]">Approve Document</button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarTab, setSidebarTab] = useState("overview");
    const [overviewSubView, setOverviewSubView] = useState("main"); // main, pending, approved, rejected
    const [shops, setShops] = useState(INITIAL_SHOPS);
    const [viewingPermit, setViewingPermit] = useState(null);

    const filteredShops = useMemo(() => {
        if (sidebarTab === "registry") return shops.filter(s => s.permitStatus === "approved");
        // If in overview sub-view, filter by that sub-view status
        if (overviewSubView === "pending") return shops.filter(s => s.permitStatus === "pending");
        if (overviewSubView === "approved") return shops.filter(s => s.permitStatus === "approved");
        if (overviewSubView === "rejected") return shops.filter(s => s.permitStatus === "rejected");
        return [];
    }, [shops, sidebarTab, overviewSubView]);

    const handleLogout = () => { logout(); navigate("/login"); };
    const handleApprove = (id) => setShops(prev => prev.map(s => s.id === id ? { ...s, permitStatus: 'approved' } : s));
    const handleReject = (id) => setShops(prev => prev.map(s => s.id === id ? { ...s, permitStatus: 'rejected' } : s));
    const handleDelete = (id) => { if (window.confirm("Permanently delete this shop?")) setShops(prev => prev.filter(s => s.id !== id)); };

    return (
        <div className="flex bg-[#F8F9FA] min-h-screen text-[#1D1D1F]">
            {/* Sidebar - Pro Blue */}
            <aside className="w-72 bg-white border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="brand-logo bg-[#003366]">E</div>
                    <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter uppercase">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <div className="pb-3 px-4 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">System Engine</div>
                    <button
                        onClick={() => { setSidebarTab("overview"); setOverviewSubView("main"); }}
                        className={`sidebar-link w-full ${sidebarTab === "overview" ? "active bg-[#003366] text-white" : "text-[#8E8E93]"}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button
                        onClick={() => setSidebarTab("registry")}
                        className={`sidebar-link w-full ${sidebarTab === "registry" ? "active bg-[#003366] text-white" : "text-[#8E8E93]"}`}
                    >
                        <Store className="w-5 h-5" /> Shop Registry
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
                        {sidebarTab === "overview" && overviewSubView !== "main" && (
                            <button
                                onClick={() => setOverviewSubView("main")}
                                className="h-10 w-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-[#003366] hover:text-white transition-all shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter capitalize">
                            {sidebarTab === "registry" ? "Verified Shop Registry" :
                                overviewSubView === "main" ? "Admin Dashboard" :
                                    `${overviewSubView} Permits`}
                        </h1>
                    </div>
                </header>

                <div className="p-12 space-y-16 max-w-[1600px] w-full mx-auto animate-fadeUp">

                    {sidebarTab === "overview" && overviewSubView === "main" && (
                        <>
                            {/* CONTROL CENTER STYLE TILES */}
                            <section className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[11px] font-black uppercase text-[#8E8E93] tracking-[0.4em]">Operational Status</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    {/* PENDING */}
                                    <button
                                        onClick={() => setOverviewSubView("pending")}
                                        className="md:col-span-2 row-span-2 relative overflow-hidden rounded-[48px] p-10 bg-white text-[#1D1D1F] border border-black/[0.04] hover:border-[#00336620] transition-all duration-500 group flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center bg-[#00336610] group-hover:bg-[#003366] transition-colors">
                                                <Clock className="w-8 h-8 text-[#003366] group-hover:text-white" />
                                            </div>
                                            <ArrowUpRight className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black uppercase tracking-[0.3em] mb-2 text-[#8E8E93]">Pending Verification</p>
                                            <div className="flex items-baseline gap-4">
                                                <h3 className="text-8xl font-black tracking-tighter leading-none">{shops.filter(s => s.permitStatus === 'pending').length}</h3>
                                                <span className="text-xs font-bold text-[#8E8E93]">Applications</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* APPROVED */}
                                    <button
                                        onClick={() => setOverviewSubView("approved")}
                                        className="rounded-[48px] p-8 bg-white text-[#1D1D1F] border border-black/[0.04] hover:border-[#228B2220] transition-all duration-500 group flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-[#228B2210] group-hover:bg-[#228B22] transition-colors">
                                            <CheckCircle className="w-7 h-7 text-[#228B22] group-hover:text-white" />
                                        </div>
                                        <div className="text-left py-4">
                                            <h3 className="text-5xl font-black tracking-tighter">{shops.filter(s => s.permitStatus === 'approved').length}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">Approved Nodes</p>
                                        </div>
                                    </button>

                                    {/* REJECTED */}
                                    <button
                                        onClick={() => setOverviewSubView("rejected")}
                                        className="rounded-[48px] p-8 bg-white text-[#1D1D1F] border border-black/[0.04] hover:border-[#80000020] transition-all duration-500 group flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-[#80000010] group-hover:bg-[#800000] transition-colors">
                                            <XCircle className="w-7 h-7 text-[#800000] group-hover:text-white" />
                                        </div>
                                        <div className="text-left py-4">
                                            <h3 className="text-5xl font-black tracking-tighter">{shops.filter(s => s.permitStatus === 'rejected').length}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">Rejected Permits</p>
                                        </div>
                                    </button>

                                    <div className="bg-[#1D1D1F] text-white rounded-[48px] p-8 flex flex-col justify-between shadow-xl">
                                        <TrendingUp className="w-8 h-8 text-[#9FE870]" />
                                        <div>
                                            <h4 className="text-4xl font-black tracking-tight">+14.2%</h4>
                                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Network Growth</p>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-black/[0.04] rounded-[48px] p-8 flex flex-col justify-between shadow-sm">
                                        <Users className="w-8 h-8 text-[#003366]" />
                                        <div>
                                            <h4 className="text-4xl font-black tracking-tight text-[#1D1D1F]">3.2k</h4>
                                            <p className="text-[9px] font-black uppercase text-[#8E8E93] tracking-widest">Total Users</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-8 animate-fadeUp">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[11px] font-black uppercase text-[#8E8E93] tracking-[0.4em]">System Intelligence</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-black/[0.04] shadow-sm flex flex-col gap-8 group cursor-pointer hover:border-[#00336620] transition-all" onClick={() => alert("Permit Velocity Analytics Deep-Dive Coming Soon")}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-black text-[#1D1D1F] tracking-tight group-hover:text-[#003366] transition-colors">Permit Velocity</h3>
                                                <p className="text-xs font-bold text-[#8E8E93]">Average processing speed per region</p>
                                            </div>
                                            <BarChart3 className="w-6 h-6 text-[#003366]" />
                                        </div>
                                        <div className="flex-1 flex items-end gap-3 h-48">
                                            {[60, 40, 90, 70, 50, 80, 100, 60, 75, 45, 85, 95].map((h, i) => (
                                                <div key={i} className="flex-1 bg-[#F0F4F8] rounded-t-xl relative group/bar overflow-hidden">
                                                    <div className={`absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-1000 ${i % 3 === 0 ? 'bg-[#800000]' : i % 2 === 0 ? 'bg-[#003366]' : 'bg-[#228B22]'}`} style={{ height: `${h}%` }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div onClick={() => alert("Analyzing Discrepancies...")} className="bg-[#800000] rounded-[40px] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all">
                                        <div className="relative z-10">
                                            <AlertCircle className="w-10 h-10 mb-6 text-white/60" />
                                            <h3 className="text-3xl font-black tracking-tighter leading-tight mb-2">Priority Flag:<br />Validation Required</h3>
                                            <p className="text-sm font-bold text-white/50 leading-relaxed">System detected inconsistent permits in Region IV-A. Manual verification mandated.</p>
                                        </div>
                                        <button className="relative z-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10">Analyze Discrepancies</button>
                                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* LIST VIEW (Internal for Registry or Overview Sub-views) */}
                    {(sidebarTab === "registry" || (sidebarTab === "overview" && overviewSubView !== "main")) && (
                        <section className="space-y-10">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-4xl font-black tracking-tighter text-[#1D1D1F]">
                                    {sidebarTab === "registry" ? "Verified Network Nodes" : `${overviewSubView.toUpperCase()} ENTRIES`}
                                </h2>
                                <p className="text-sm font-bold text-[#8E8E93]">
                                    {sidebarTab === "registry" ? "Listing all active compliant shops." : "Action required for selected permit entries."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {filteredShops.length > 0 ? filteredShops.map(shop => (
                                    <div key={shop.id} className="bg-white rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-12 border border-black/[0.02] shadow-sm hover:shadow-xl hover:border-[#00336610] transition-all group">
                                        <div className="relative shrink-0">
                                            <img src={shop.image} className="w-32 h-32 rounded-[48px] object-cover shadow-lg border-2 border-white grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                            <div className="absolute -bottom-2 -right-2 bg-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border border-black/5">
                                                <Shield className={`w-5 h-5 ${shop.permitStatus === 'approved' ? 'text-[#228B22]' : 'text-[#1D1D1F]'}`} />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-3xl font-black text-[#1D1D1F] tracking-tighter mb-1 uppercase">{shop.shopName}</h4>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#8E8E93] uppercase tracking-tighter">
                                                        <MapPin className="w-3.5 h-3.5 text-[#003366]" /> {shop.address}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest mb-1.5">Owner Metadata</p>
                                                    <p className="text-sm font-black text-[#1D1D1F] tracking-tight">{shop.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-8 pt-6 border-t border-black/[0.04]">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Submitted Registry</p>
                                                    <p className="text-xs font-bold text-[#1D1D1F] flex items-center gap-2 uppercase">
                                                        <Calendar className="w-3 h-3 text-[#003366]" /> {shop.submittedAt}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Rate (₱/kg)</p>
                                                    <p className="text-xs font-black text-[#800000]">₱{shop.price}.00</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Shop ID</p>
                                                    <p className="text-xs font-bold text-[#1D1D1F] uppercase">{shop.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setViewingPermit(shop)} className="btn-icon h-16 w-16 rounded-[28px] bg-[#F8F9FA] hover:bg-[#E1EFFF] hover:text-[#003366] border-none text-[10px] font-black uppercase flex-col gap-1 pb-1" title="View Document">
                                                <Eye className="w-6 h-6" /> <span className="text-[8px] tracking-widest">VIEW</span>
                                            </button>
                                            <div className="h-10 w-[1px] bg-black/[0.05]" />
                                            {shop.permitStatus !== 'approved' && (
                                                <button onClick={() => handleApprove(shop.id)} className="btn-icon h-16 w-16 rounded-[28px] bg-[#E1FFE1] text-[#228B22] hover:bg-[#228B22] hover:text-white border-none shadow-sm" title="Approve"><CheckCircle className="w-6 h-6" /></button>
                                            )}
                                            {shop.permitStatus !== 'rejected' && (
                                                <button onClick={() => handleReject(shop.id)} className="btn-icon h-16 w-16 rounded-[28px] bg-[#FFF0F0] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white border-none shadow-sm" title="Reject"><XCircle className="w-6 h-6" /></button>
                                            )}
                                            <button onClick={() => handleDelete(shop.id)} className="btn-icon h-16 w-16 rounded-[28px] bg-[#F8F9FA] text-[#8E8E93] hover:bg-black hover:text-white border-none shadow-sm" title="Delete Permanent"><Trash2 className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-40 text-center space-y-6 rounded-[64px] bg-white border border-black/[0.03] shadow-inner font-black text-[#D1D1D6] flex flex-col items-center">
                                        <Shield className="w-24 h-24 mb-4 opacity-10" />
                                        <p className="text-xl tracking-[0.4em] uppercase">Null Registry</p>
                                        <p className="text-[10px] text-[#8E8E93] tracking-widest max-w-sm">System holds no entries for this classification.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {viewingPermit && <PermitModal shop={viewingPermit} onClose={() => setViewingPermit(null)} />}
        </div>
    );
}
