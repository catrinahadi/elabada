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
    MapPin, Calendar, ArrowLeft, Phone, Menu, ShieldCheck, X, Banknote
} from "lucide-react";


// Mock data as fallback
const INITIAL_SHOPS = [];

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn p-8 space-y-6" onClick={e => e.stopPropagation()}>
                <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{title}</h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-6 py-3.5 rounded-2xl border border-black/5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-all">{cancelText}</button>
                    <button onClick={onConfirm} className={`flex-1 px-6 py-3.5 rounded-2xl text-[14px] font-medium text-white transition-all shadow-lg ${type === 'danger' ? 'bg-[#800000] hover:bg-[#600000] shadow-[#800000]/20' : 'bg-[#003366] hover:bg-[#002244] shadow-[#003366]/20'}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-6 right-6 lg:top-auto lg:bottom-12 lg:right-12 z-[500] animate-fadeDown lg:animate-fadeUp">
            <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.03] p-5 pr-8 flex items-center gap-4 min-w-[320px]">
                <div className="w-10 h-10 rounded-2xl bg-[#228B2210] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#228B22]" />
                </div>
                <div>
                    <p className="text-[14px] font-normal text-[#1D1D1F] leading-tight">{message}</p>
                </div>
                <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1D1D1F]/20 hover:text-[#1D1D1F]">
                    <X className="w-4 h-4" />
                </button>
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
    const [confirmingApproval, setConfirmingApproval] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [expandedShops, setExpandedShops] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState("pending");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        window.addEventListener('click', handleClickOutside);

        api.get("/admin/shops")
            .then(({ data }) => setShops(data.map(s => ({
                ...s,
                ownerName: s.ownerName || "Authorized Owner",
            }))))
            .catch(err => console.error("Failed to load admin shops:", err.message));

        api.get("/admin/stats")
            .then(({ data }) => setStats(data))
            .catch(err => console.error("Failed to load stats:", err.message));

        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const approvedShops = useMemo(() => shops.filter(s => s.permitStatus === "approved"), [shops]);
    const pendingShops = useMemo(() => shops.filter(s => s.permitStatus === "pending"), [shops]);
    const rejectedShops = useMemo(() => shops.filter(s => s.permitStatus === "rejected"), [shops]);
    const filteredList = useMemo(() => {
        if (filterStatus === "all") return shops;
        return shops.filter(s => s.permitStatus === filterStatus);
    }, [shops, filterStatus]);

    const handleLogout = () => { logout(); navigate("/login"); };

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/shops/${id}/approve`);
            setShops(prev => prev.map(s => s._id === id ? { ...s, permitStatus: 'approved', rejectionReason: "" } : s));
            setConfirmingApproval(null);
            setSuccessMsg("Establishment approved successfully.");
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
        <div className="flex bg-[#F8F9FA] min-h-screen text-[#1D1D1F] relative">


            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-20 lg:h-24 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-normal text-xl shadow-lg shadow-[#014421]/20">E</div>
                        <span className="text-[#1D1D1F] font-normal text-2xl tracking-tighter">ELaBada</span>
                    </div>
                    <button onClick={handleLogout} className="text-[#800000] hover:bg-[#800000]/[0.05] p-3 rounded-2xl transition-all flex items-center gap-2 text-[14px] font-normal">
                        <LogOut className="w-4 h-4" /> Log out
                    </button>
                </header>

                <div className="p-6 md:p-12 space-y-8 md:space-y-12 max-w-[1600px] w-full mx-auto animate-fadeUp">
                    <div className="px-4">
                        <h2 className="text-4xl font-normal tracking-tight text-[#1D1D1F]">Admin Dashboard</h2>
                    </div>

                    {/* PREMIUM STAT TILES */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                        {/* Total Establishments */}
                        <div className="rounded-[40px] p-8 bg-white border border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#00336610] flex items-center justify-center shadow-inner">
                                <Store className="w-6 h-6 text-[#003366]" />
                            </div>
                            <div>
                                <h3 className="text-5xl font-black tracking-tighter text-[#003366]">{shops.length}</h3>
                                <p className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-[0.1em] mt-1">Total Establishments</p>
                            </div>
                        </div>
                        {/* Active Listings */}
                        <div className="rounded-[40px] p-8 bg-white border border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#228B2210] flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-[#228B22]" />
                            </div>
                            <div>
                                <h3 className="text-5xl font-black tracking-tighter text-[#228B22]">{approvedShops.length}</h3>
                                <p className="text-[12px] font-bold text-[#228B22] uppercase tracking-[0.1em] mt-1">Active Listings</p>
                            </div>
                        </div>
                        {/* Rejected Requests */}
                        <div className="rounded-[40px] p-8 bg-white border border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#80000010] flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-[#800000]" />
                            </div>
                            <div>
                                <h3 className="text-5xl font-black tracking-tighter text-[#800000]">{rejectedShops.length}</h3>
                                <p className="text-[12px] font-bold text-[#800000] uppercase tracking-[0.1em] mt-1">Rejected Requests</p>
                            </div>
                        </div>
                        {/* Awaiting Review */}
                        <div className="rounded-[40px] p-8 bg-white border border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B15] flex items-center justify-center">
                                <Clock className="w-6 h-6 text-[#F59E0B]" />
                            </div>
                            <div>
                                <h3 className="text-5xl font-black tracking-tighter text-[#F59E0B] font-outfit">{pendingShops.length}</h3>
                                <p className="text-[12px] font-bold text-[#F59E0B] uppercase tracking-[0.1em] mt-1">Awaiting Review</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 space-y-8 px-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-normal text-[#1D1D1F] tracking-tight">Registry Management</h2>
                        </div>


                        {/* Shop List Section */}
                        <div className="space-y-6">
                            <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-3 mb-4 -mx-4 px-4">
                                {['all', 'pending', 'approved', 'rejected'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-6 py-3 rounded-2xl text-[14px] font-normal transition-all capitalize border-2 shrink-0 whitespace-nowrap ${filterStatus === s ? 'bg-[#003366] text-white border-[#003366] shadow-xl' : 'bg-white text-[#8E8E93] border-black/[0.05] hover:border-black/20'}`}
                                    >
                                        {s === 'all' ? 'All Registry' : s}
                                    </button>
                                ))}
                            </div>



                            <div className="flex flex-col gap-3 overflow-x-auto lg:overflow-visible no-scrollbar pb-72">
                                {/* Table Header */}
                                <div className="hidden lg:grid grid-cols-[80px_2fr_2fr_1fr_1fr_1.5fr_1.5fr] items-center px-12 py-3 mb-2 text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">
                                    <span>Ref #</span>
                                    <span>Establishment</span>
                                    <span>Locale</span>
                                    <span>Price</span>
                                    <span>Lead Time</span>
                                    <span>Timestamp</span>
                                    <span className="text-right">Actions</span>
                                </div>


                                {filteredList.map((shop, idx) => (
                                    <div
                                        key={shop._id}
                                        className={`bg-white rounded-[32px] px-10 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] flex flex-col lg:grid lg:grid-cols-[80px_2fr_2fr_1fr_1fr_1.5fr_1.5fr] items-start lg:items-center gap-4 lg:gap-0 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative ${openDropdownId === shop._id ? 'z-50' : 'z-0'}`}
                                    >
                                        <span className="text-[14px] font-normal text-[#1D1D1F]/20 lg:block hidden tracking-tight tabular-nums truncate">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </span>

                                        {/* Establishment */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] flex items-center justify-center shrink-0 border border-black/[0.03]">
                                                <Store className="w-5 h-5 text-[#1D1D1F]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-[15px] font-normal text-[#1D1D1F] tracking-tight truncate leading-tight">{shop.name}</h4>
                                                <span className="text-[13px] text-[#8E8E93] truncate">Owner: {shop.ownerName}</span>
                                            </div>
                                        </div>

                                        {/* Locale */}
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-[14px] font-normal text-[#1D1D1F] truncate flex items-center gap-2 opacity-60">
                                                <MapPin className="w-4 h-4 shrink-0 text-[#8E8E93]" /> {shop.address}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-[14px] font-normal text-[#1D1D1F]">
                                                <Banknote className="w-4 h-4 text-[#8E8E93]" />
                                                <span>₱{shop.price || 0}<span className="text-[#8E8E93] text-xs"> /kg</span></span>
                                            </div>
                                        </div>

                                        {/* Lead Time */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-[14px] font-normal text-[#1D1D1F]">
                                                <Clock className="w-4 h-4 text-[#8E8E93]" />
                                                <span>{shop.turnaroundTime || 0} hrs</span>
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-[14px] font-normal text-[#1D1D1F]">
                                                <Calendar className="w-4 h-4 text-[#8E8E93]" />
                                                <span>{shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-4 w-full lg:w-auto mt-4 lg:mt-0">
                                            <button
                                                onClick={() => setViewingPermit(shop)}
                                                className="h-11 px-6 rounded-[20px] border-2 border-[#003366] text-[#003366] bg-transparent hover:bg-[#003366] hover:text-white transition-all text-[14px] font-normal flex items-center gap-2.5"
                                            >
                                                <FileText className="w-4 h-4" /> Review Permit
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === shop._id ? null : shop._id); }}
                                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all bg-[#F8F9FA] border border-black/[0.05] hover:bg-black hover:text-white ${openDropdownId === shop._id ? 'bg-black text-white' : 'text-[#8E8E93]'}`}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {openDropdownId === shop._id && (
                                                    <div 
                                                        onClick={e => e.stopPropagation()}
                                                        className="absolute right-0 top-full mt-3 w-64 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.05] py-3 z-[100] overflow-hidden animate-scaleIn"
                                                    >
                                                        {(shop.permitStatus === 'pending' || filterStatus === 'all') && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmingApproval(shop); setOpenDropdownId(null); }}
                                                                    className="w-full px-7 py-3.5 text-left text-[14px] font-normal text-[#228B22] hover:bg-[#228B22]/5 flex items-center gap-3 transition-colors whitespace-nowrap"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Approve Listing
                                                                </button>
                                                                <button
                                                                    onClick={() => { handleReject(shop._id); setOpenDropdownId(null); }}
                                                                    className="w-full px-7 py-3.5 text-left text-[14px] font-normal text-[#800000] hover:bg-[#800000]/5 flex items-center gap-3 transition-colors whitespace-nowrap"
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Reject Request
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => { handleDelete(shop._id); setOpenDropdownId(null); }}
                                                            className="w-full px-7 py-3.5 text-left text-[14px] font-normal text-[#1D1D1F] hover:bg-black/5 flex items-center gap-3 transition-colors whitespace-nowrap"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Permanently Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {viewingPermit && <PermitModal shop={viewingPermit} onClose={() => setViewingPermit(null)} />}
            
            {successMsg && (
                <Toast message={successMsg} onClose={() => setSuccessMsg(null)} />
            )}
            
            <ConfirmationModal 
                isOpen={!!confirmingApproval}
                title="Confirm Approval"
                message={`Are you sure you want to approve "${confirmingApproval?.name}"? Once approved, the shop will be visible to all users.`}
                confirmText="Approve"
                cancelText="Cancel"
                type="primary"
                onConfirm={() => handleApprove(confirmingApproval?._id)}
                onCancel={() => setConfirmingApproval(null)}
            />
        </div>
    );
}

// Separate PermitModal since it was moved out from initial position but still used
function PermitModal({ shop, onClose }) {
    return (
        <div className="modal-overlay flex items-center justify-center p-4 md:p-6 z-[100]">
            <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn flex flex-col h-[95vh] md:h-auto max-h-[90vh]">
                <div className="p-6 md:p-8 border-b border-black/[0.05] flex items-center justify-between bg-[#F8F9FA]">
                    <div>
                        <h2 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight">Verification</h2>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-black hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar bg-[#F3F4F6]">
                    <div className="bg-white p-4 rounded-[24px] md:rounded-[32px] shadow-sm border border-black/[0.03]">
                        <img src={shop.permitImage || "https://images.unsplash.com/photo-1589330694653-96b6fca67612?w=800&q=80"} className="w-full rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 cursor-zoom-in" alt="Business Permit" />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/[0.03] space-y-4">
                            <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
                                <span className="text-[13px] text-[#8E8E93] font-bold uppercase tracking-wider">Shop Name</span>
                                <span className="text-[15px] text-[#1D1D1F] font-medium text-right">{shop.shopName || shop.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
                                <span className="text-[13px] text-[#8E8E93] font-bold uppercase tracking-wider">Owner Name</span>
                                <span className="text-[15px] text-[#1D1D1F] font-medium text-right">{shop.ownerName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] text-[#8E8E93] font-bold uppercase tracking-wider">Date Submitted</span>
                                <span className="text-[15px] text-[#1D1D1F] font-medium text-right">{shop.submittedAt || (shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "N/A")}</span>
                            </div>
                        </div>
                        
                        {/* Admin Amenities View */}
                        {shop.amenities && shop.amenities.length > 0 && (
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/[0.03] space-y-4">
                                <h4 className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Service Amenities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {shop.amenities.map(tag => (
                                        <span key={tag} className="px-4 py-2 bg-[#F8F9FA] border border-black/[0.03] rounded-xl text-[13px] font-medium text-gray-500">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-8 bg-white border-t border-black/[0.05] flex justify-end">
                    <button onClick={onClose} className="inline-flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] active:scale-95 text-white text-[14px] font-normal rounded-2xl px-12 py-4 tracking-widest transition-all duration-300 select-none shadow-xl shadow-[#003366]/10">Close</button>
                </div>
            </div>
        </div>
    );
}
