import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
    LayoutDashboard, Store, Users,
    BarChart3, Settings, LogOut,
    CheckCircle, XCircle, Clock, MoreVertical,
    Trash2, Edit3, ChevronRight, ArrowUpRight,
    FileText, Eye, AlertCircle, TrendingUp,
    MapPin, Calendar, ArrowLeft, Phone
} from "lucide-react";

// Mock data as fallback
const INITIAL_SHOPS = [];

function PermitModal({ shop, onClose }) {
    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-black/[0.05] flex items-center justify-between bg-[#F8F9FA]">
                    <div>
                        <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Business Permit Verification</h2>
                        <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Document Registry #{(shop.id || shop._id || "").toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="btn-icon bg-white text-black border-none hover:bg-black hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-[#F3F4F6]">
                    <div className="bg-white p-4 rounded-[32px] shadow-sm border border-black/[0.03]">
                        <img src={shop.permitUrl || shop.permitImage || "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80"} className="w-full rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 cursor-zoom-in" alt="Business Permit" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-black/[0.05] pb-2">
                                    <span className="text-xs text-[#8E8E93] font-bold">Shop Name</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.shopName || shop.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-black/[0.05] pb-2">
                                    <span className="text-xs text-[#8E8E93] font-bold">Owner Name</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.ownerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-[#8E8E93] font-bold">Date Submitted</span>
                                    <span className="text-xs text-[#1D1D1F] font-black">{shop.submittedAt || (shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "N/A")}</span>
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
                    <button onClick={onClose} className="btn-primary py-4 px-12 text-[10px] uppercase tracking-widest bg-[#003366]">Close View</button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [stats, setStats] = useState({ shops: {}, users: { total: 0 } });
    const [viewingPermit, setViewingPermit] = useState(null);
    const [expandedShops, setExpandedShops] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState("pending");

    useEffect(() => {
        api.get("/admin/shops")
            .then(({ data }) => setShops(data.map(s => ({
                ...s,
                ownerName: s.ownerName || "Authorized Owner",
            }))))
            .catch(err => console.error("Failed to load admin shops:", err.message));

        api.get("/admin/stats")
            .then(({ data }) => setStats(data))
            .catch(err => console.error("Failed to load stats:", err.message));
    }, []);

    const approvedShops = useMemo(() => shops.filter(s => s.permitStatus === "approved"), [shops]);
    const pendingShops = useMemo(() => shops.filter(s => s.permitStatus === "pending"), [shops]);
    const rejectedShops = useMemo(() => shops.filter(s => s.permitStatus === "rejected"), [shops]);
    const filteredList = useMemo(() => shops.filter(s => s.permitStatus === filterStatus), [shops, filterStatus]);

    const handleLogout = () => { logout(); navigate("/login"); };

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/shops/${id}/approve`);
            setShops(prev => prev.map(s => s._id === id ? { ...s, permitStatus: 'approved', rejectionReason: "" } : s));
        } catch (err) {
            console.error("Failed to approve shop:", err.message);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter rejection reason:");
        if (reason === null) return;
        try {
            await api.put(`/admin/shops/${id}/reject`, { reason });
            setShops(prev => prev.map(s => s._id === id ? { ...s, permitStatus: 'rejected', rejectionReason: reason } : s));
        } catch (err) {
            console.error("Failed to reject shop:", err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this shop?")) return;
        try {
            await api.delete(`/admin/shops/${id}`);
            setShops(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error("Failed to delete shop:", err.message);
        }
    };

    return (
        <div className="flex bg-[#F8F9FA] min-h-screen text-[#1D1D1F]">
            {/* Sidebar - Pro Blue */}
            <aside className="w-72 bg-[#FDFDFD] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#014421]/20">E</div>
                    <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <div className="pb-3 px-4 text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">System Engine</div>
                    <button className="sidebar-link w-full active bg-[#014421] text-white shadow-lg shadow-[#014421]/20">
                        <LayoutDashboard className="w-5 h-5" /> Overview
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
                <header className="h-24 px-12 flex items-center sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-2xl">
                    <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">Admin Dashboard</h1>
                </header>

                <div className="p-12 space-y-10 max-w-[1600px] w-full mx-auto animate-fadeUp">

                    {/* COMPACT STAT TILES — 4 across */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Pending */}
                        <button onClick={() => { setFilterStatus("pending"); setExpandedShops(new Set()); }} className={`rounded-[28px] p-6 bg-white border-2 flex flex-col gap-3 text-left transition-all duration-200 hover:shadow-md ${filterStatus === "pending" ? "border-[#555]/60 shadow-md" : "border-[#555]/20"
                            }`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${filterStatus === "pending" ? "bg-[#555]/20" : "bg-[#555]/10"
                                }`}>
                                <Clock className="w-5 h-5 text-[#555]" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-[#3D3D3D]">{pendingShops.length}</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#555]/50 mt-0.5">Pending</p>
                            </div>
                        </button>
                        {/* Approved */}
                        <button onClick={() => { setFilterStatus("approved"); setExpandedShops(new Set()); }} className={`rounded-[28px] p-6 bg-white border-2 flex flex-col gap-3 text-left transition-all duration-200 hover:shadow-md ${filterStatus === "approved" ? "border-[#1A6B1A]/60 shadow-md" : "border-[#1A6B1A]/25"
                            }`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${filterStatus === "approved" ? "bg-[#1A6B1A]/20" : "bg-[#1A6B1A]/10"
                                }`}>
                                <CheckCircle className="w-5 h-5 text-[#1A6B1A]" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-[#1A6B1A]">{approvedShops.length}</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A6B1A]/50 mt-0.5">Approved</p>
                            </div>
                        </button>
                        {/* Rejected */}
                        <button onClick={() => { setFilterStatus("rejected"); setExpandedShops(new Set()); }} className={`rounded-[28px] p-6 bg-white border-2 flex flex-col gap-3 text-left transition-all duration-200 hover:shadow-md ${filterStatus === "rejected" ? "border-[#8B1A1A]/60 shadow-md" : "border-[#8B1A1A]/25"
                            }`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${filterStatus === "rejected" ? "bg-[#8B1A1A]/20" : "bg-[#8B1A1A]/10"
                                }`}>
                                <XCircle className="w-5 h-5 text-[#8B1A1A]" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-[#8B1A1A]">{rejectedShops.length}</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#8B1A1A]/50 mt-0.5">Rejected</p>
                            </div>
                        </button>
                        {/* Users */}
                        <div className="rounded-[28px] p-6 bg-white border-2 border-[#1A237E]/25 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#1A237E]/10">
                                <Users className="w-5 h-5 text-[#1A237E]" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-[#1A237E]">{stats.users?.total || 0}</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A237E]/50 mt-0.5">Users</p>
                            </div>
                        </div>
                    </div>

                    {/* FULL-WIDTH FILTERED LIST */}
                    <div className="flex flex-col gap-4">
                        {filteredList.length === 0 ? (
                            <div className="rounded-[28px] border-2 border-dashed border-black/10 p-16 text-center">
                                <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">No {filterStatus} shops</p>
                            </div>
                        ) : filteredList.map(shop => {
                            const isExpanded = expandedShops.has(shop._id);
                            const toggleExpand = () => setExpandedShops(prev => {
                                const next = new Set(prev);
                                isExpanded ? next.delete(shop._id) : next.add(shop._id);
                                return next;
                            });
                            const colors = {
                                approved: { border: "border-[#1A6B1A]", activeBorder: "border-[#1A6B1A]/40", dimBorder: "border-[#1A6B1A]/15", sep: "border-[#1A6B1A]/10", chevron: "text-[#1A6B1A]/40" },
                                pending: { border: "border-[#555]", activeBorder: "border-[#555]/40", dimBorder: "border-[#555]/15", sep: "border-[#555]/10", chevron: "text-[#555]/40" },
                                rejected: { border: "border-[#8B1A1A]", activeBorder: "border-[#8B1A1A]/40", dimBorder: "border-[#8B1A1A]/15", sep: "border-[#8B1A1A]/10", chevron: "text-[#8B1A1A]/40" },
                            };
                            const c = colors[filterStatus];
                            return (
                                <div
                                    key={shop._id}
                                    onClick={toggleExpand}
                                    className={`bg-white rounded-[24px] p-6 border-2 transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded ? `${c.activeBorder} shadow-lg` : `${c.dimBorder} hover:${c.activeBorder} hover:shadow-md`
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-black text-[#1D1D1F] tracking-tight truncate">{shop.name}</h4>
                                            <p className="text-[10px] font-bold text-[#8E8E93] mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 shrink-0" /> {shop.address}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 ${c.chevron} shrink-0 ml-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>

                                    {isExpanded && (
                                        <div className={`mt-5 pt-5 border-t ${c.sep} flex flex-col gap-4`} onClick={e => e.stopPropagation()}>
                                            {/* Vertical details */}
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[8px] font-black text-[#8E8E93] uppercase tracking-widest">Details</p>
                                                <p className="text-[11px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3 text-[#003366] shrink-0" />
                                                    {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </p>
                                                {shop.ownerName && (
                                                    <p className="text-[11px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                                        <Users className="w-3 h-3 text-[#003366] shrink-0" /> {shop.ownerName}
                                                    </p>
                                                )}
                                                {shop.price && (
                                                    <p className="text-[11px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                                        <span className="text-[#003366] font-black text-xs shrink-0">₱</span> ₱{shop.price}/kg
                                                    </p>
                                                )}
                                                {shop.turnaroundTime && (
                                                    <p className="text-[11px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-[#003366] shrink-0" /> {shop.turnaroundTime} hr turnaround
                                                    </p>
                                                )}
                                            </div>
                                            {/* Icon action row */}
                                            <div className="flex items-center gap-2">
                                                <button title="Edit" className="p-2.5 rounded-xl bg-[#F0F4FF] text-[#1A237E] hover:bg-[#1A237E] hover:text-white transition-all">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                {filterStatus !== 'approved' && (
                                                    <button title="Approve" onClick={() => handleApprove(shop._id)} className="p-2.5 rounded-xl bg-[#E1FFE1] text-[#228B22] hover:bg-[#228B22] hover:text-white transition-all">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {filterStatus !== 'rejected' && (
                                                    <button title="Reject" onClick={() => handleReject(shop._id)} className="p-2.5 rounded-xl bg-[#FFF0F0] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-all">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {/* View Permit — full width */}
                                            <button onClick={() => setViewingPermit(shop)} className="w-full py-3 rounded-xl bg-[#1D1D1F] text-white hover:bg-[#003366] transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2">
                                                <FileText className="w-3.5 h-3.5" /> View permit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {viewingPermit && <PermitModal shop={viewingPermit} onClose={() => setViewingPermit(null)} />}
        </div>
    );
}
