import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
    LayoutDashboard, Store, MessageSquare,
    LogOut, ChevronRight,
    TrendingUp, Star, MoreVertical,
    Edit3, Trash2, ArrowUpRight, Clock,
    FileText, ShieldCheck, MapPin, XCircle, CheckCircle, Plus,
    Zap, AlertTriangle, X, Loader, UploadCloud, ImagePlus, Camera
} from "lucide-react";

const API_BASE = "http://localhost:5000";

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
                    <button onClick={onCancel} className="py-4 rounded-2xl bg-[#F8F9FA] text-[#1D1D1F] font-medium text-sm hover:bg-[#E5E5EA] transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="py-4 rounded-2xl bg-[#800000] text-white font-medium text-sm hover:bg-black transition-colors shadow-lg shadow-[#800000]/20">Confirm delete</button>
                </div>
            </div>
        </div>
    );
}

// Image / file upload box component
function UploadBox({ label, hint, onFileSelected, preview, small = false, extraClass = "" }) {
    const inputRef = useRef();

    const handleClick = () => inputRef.current?.click();
    const handleChange = (e) => {
        if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
    };

    return (
        <div
            onClick={handleClick}
            className={`relative border-2 border-dashed border-[#7B1113]/30 rounded-[20px] bg-[#7B1113]/[0.02] hover:bg-[#7B1113]/[0.05] hover:border-[#7B1113]/50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 p-3 ${extraClass || (small ? "h-28" : "h-40")}`}
        >
            {preview ? (
                <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-[18px]" />
            ) : (
                <>
                    <div className={`rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#7B1113] ${small ? "w-9 h-9" : "w-10 h-10"}`}>
                        <UploadCloud className={small ? "w-4 h-4" : "w-5 h-5"} />
                    </div>
                    <p className="text-[10px] font-medium text-[#1D1D1F] text-center">{label}</p>
                    {hint && <p className="text-[9px] text-[#8E8E93] text-center">{hint}</p>}
                </>
            )}
            <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleChange} />
        </div>
    );
}

function ShopModal({ onClose, onSubmit, loading, initialData = null }) {
    const [form, setForm] = useState(initialData || {
        name: "", address: "", price: "", turnaroundTime: "",
        latitude: "14.167", longitude: "121.241",
        permitImage: "", image: ""
    });

    // local File objects for upload
    const [shopImageFile, setShopImageFile] = useState(null);
    const [permitFile, setPermitFile] = useState(null);
    const [shopImagePreview, setShopImagePreview] = useState(initialData?.image || "");
    const [permitPreview, setPermitPreview] = useState(initialData?.permitImage || "");
    const [uploading, setUploading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const pickShopImage = (file) => {
        setShopImageFile(file);
        setShopImagePreview(URL.createObjectURL(file));
    };

    const pickPermit = (file) => {
        setPermitFile(file);
        // For PDFs show a placeholder; for images show preview
        if (file.type.startsWith("image/")) {
            setPermitPreview(URL.createObjectURL(file));
        } else {
            setPermitPreview(""); // PDF: no image preview
        }
    };

    const uploadFile = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        return `${API_BASE}${data.url}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.address) return;
        setUploading(true);
        try {
            let finalForm = { ...form };
            if (shopImageFile) finalForm.image = await uploadFile(shopImageFile);
            if (permitFile) finalForm.permitImage = await uploadFile(permitFile);
            onSubmit(finalForm);
        } catch (err) {
            console.error("Upload error:", err.message);
            setUploading(false);
        }
    };

    const Field = ({ label, field, type = "text", placeholder, step }) => (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-[#8E8E93]">{label}</label>
            <input
                type={type}
                step={step}
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full h-11 bg-[#F8F9FA] rounded-[14px] px-4 text-sm text-[#1D1D1F] border border-black/[0.05] outline-none focus:ring-2 focus:ring-[#7B1113]/10 focus:border-[#7B1113]/20 focus:bg-white placeholder:text-[#8E8E93]/40 transition-all font-outfit"
            />
        </div>
    );

    const isLoading = loading || uploading;

    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[200] backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] animate-scaleIn overflow-hidden border border-black/5">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-black/[0.05]">
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{initialData ? "Update shop" : "Register new shop"}</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[#F8F9FA] text-[#1D1D1F] flex items-center justify-center hover:bg-[#7B1113] hover:text-white transition-all active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                    {/* Row 1: Shop photo (square 144px) + Name & Price */}
                    <div className="flex gap-5 items-start">
                        {/* Left: square shop image upload — 144×144 to align with price field bottom */}
                        <div className="shrink-0 w-36 h-36">
                            <UploadBox
                                label="Upload"
                                hint="JPG / PNG"
                                onFileSelected={pickShopImage}
                                preview={shopImagePreview}
                                extraClass="w-full h-full"
                            />
                        </div>
                        {/* Right: Name + Price */}
                        <div className="flex-1 space-y-3">
                            <Field label="Shop name" field="name" placeholder="Official business name" />
                            <Field label="Price per kilo (₱)" field="price" type="number" placeholder="45" />
                        </div>
                    </div>

                    {/* Row 2: Address */}
                    <Field label="Business address" field="address" placeholder="Full address" />

                    {/* Row 3: Turnaround time (left) + Permit upload (right, spans full height) */}
                    <div className="flex gap-5 items-stretch">
                        {/* Left col: Turnaround time, Lat, Long */}
                        <div className="flex-1 space-y-3">
                            <Field label="Turnaround time (hours)" field="turnaroundTime" type="number" placeholder="24" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Latitude" field="latitude" type="number" step="any" placeholder="14.167" />
                                <Field label="Longitude" field="longitude" type="number" step="any" placeholder="121.241" />
                            </div>
                        </div>
                        {/* Right: Business permit upload */}
                        {!initialData && (
                            <div className="w-52 shrink-0 flex flex-col">
                                <label className="block text-[11px] font-medium text-[#8E8E93] mb-1.5">Business permit</label>
                                <UploadBox
                                    label={permitFile ? "Uploaded!" : "Upload permit"}
                                    hint="JPG / PNG / PDF"
                                    onFileSelected={pickPermit}
                                    preview={permitPreview}
                                    extraClass="flex-1"
                                />
                                {permitFile && !permitPreview && (
                                    <p className="text-[9px] font-medium text-[#228B22] mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> PDF attached
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-[20px] bg-[#7B1113] text-white text-sm hover:bg-black transition-all shadow-lg shadow-[#7B1113]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? "Processing…" : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function OwnerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarTab, setSidebarTab] = useState("overview");
    const [shops, setShops] = useState([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showAddShop, setShowAddShop] = useState(false);
    const [editingShop, setEditingShop] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleLogout = () => { logout(); navigate("/login"); };

    const fetchShops = async () => {
        if (!user?.id) return;
        try {
            const { data } = await api.get(`/shops/owner/${user.id}`);
            setShops(data);
        } catch (err) {
            console.error("Failed to load shops:", err.message);
        } finally {
            setLoadingShops(false);
        }
    };

    useEffect(() => { fetchShops(); }, [user]);

    const handleAddShop = async (formData) => {
        setSubmitting(true);
        try {
            await api.post("/shops", { ...formData, ownerId: user.id, ownerName: user.name });
            await fetchShops();
            setShowAddShop(false);
        } catch (err) {
            console.error("Failed to add shop:", err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateShop = async (formData) => {
        setSubmitting(true);
        try {
            const id = editingShop._id;
            await api.put(`/shops/${id}`, formData);
            await fetchShops();
            setEditingShop(null);
        } catch (err) {
            console.error("Failed to update shop:", err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/shops/${deletingId}`);
            setShops(prev => prev.filter(s => s._id !== deletingId));
        } catch (err) {
            console.error("Failed to delete shop:", err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const statusColor = (s) => {
        if (s === "approved") return "bg-[#228B2215] text-[#228B22] border-[#228B2220]";
        if (s === "rejected") return "bg-[#7B111315] text-[#7B1113] border-[#7B111320]";
        return "bg-amber-50 text-amber-600 border-amber-100";
    };
    const statusLabel = (s) => s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Pending review";

    const DEFAULT_IMG = "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";

    return (
        <div className="flex bg-[#F1F4F2] min-h-screen text-[#1D1D1F] font-outfit">
            <aside className="w-72 bg-[#FDFDFD] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)] transition-all">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="w-10 h-10 bg-[#7B1113] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#7B1113]/20">E</div>
                    <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <button onClick={() => setSidebarTab("overview")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-sm font-black transition-all group ${sidebarTab === "overview" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button onClick={() => setSidebarTab("listings")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-sm font-black transition-all group ${sidebarTab === "listings" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <Store className="w-5 h-5" /> My shops
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-black/[0.05]">
                    <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl text-[#7B1113] hover:bg-[#7B1113]/[0.05] transition-all flex items-center gap-4 text-sm font-black">
                        <LogOut className="w-5 h-5" /> Log out
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="h-24 px-12 flex items-center justify-between sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-6">
                        {sidebarTab !== "overview" && (
                            <button onClick={() => setSidebarTab("overview")} className="h-10 w-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter capitalize transition-all">
                            {sidebarTab === "overview" ? "Owner dashboard" : "My shop network"}
                        </h1>
                    </div>
                    {sidebarTab === "listings" && (
                        <button onClick={() => setShowAddShop(true)} className="bg-[#7B1113] hover:bg-black text-white px-8 py-4 rounded-[32px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-[#7B1113]/20 flex items-center gap-3 transition-all active:scale-95 group">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add shop
                        </button>
                    )}
                </header>

                <div className="p-12 space-y-12 max-w-[1600px] w-full mx-auto animate-fadeUp">
                    {sidebarTab === "overview" ? (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-[#1D1D1F] rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden group flex flex-col justify-center min-h-[340px]">
                                    <div className="relative z-10 space-y-4">
                                        <h2 className="text-7xl font-black tracking-tighter leading-none">{user?.name?.split(' ')[0] || 'Executive'}</h2>
                                        <p className="text-white/30 text-sm font-bold max-w-sm leading-relaxed">Oversee your retail network, update facilities, and track compliance standings.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#7B1113]/20 rounded-full -mr-20 -mt-20 blur-[100px] transition-all group-hover:bg-[#7B1113]/30" />
                                </div>

                                {/* Total shops — clickable, navigates to My Shops */}
                                <button
                                    onClick={() => setSidebarTab("listings")}
                                    className="bg-white rounded-[56px] p-12 border border-black/[0.04] shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all text-left"
                                >
                                    <div className="w-16 h-16 rounded-[24px] bg-[#7B1113]/[0.05] flex items-center justify-center transition-colors group-hover:bg-[#7B1113] group-hover:text-white"><Store className="w-8 h-8" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-2 font-outfit">Total shops</p>
                                        <h3 className="text-7xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shops.length}</h3>
                                    </div>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: "Approved shop", count: shops.filter(s => s.permitStatus === "approved").length, color: "#228B22", bg: "#228B2210" },
                                    { label: "Pending shop", count: shops.filter(s => s.permitStatus === "pending").length, color: "#B8860B", bg: "#B8860B10" },
                                ].map(stat => (
                                    <div key={stat.label} className="bg-white p-10 rounded-[48px] border border-black/[0.04] shadow-sm flex flex-col gap-6 group hover:translate-y-[-4px] transition-all">
                                        <div className="w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: stat.bg }}>
                                            <ShieldCheck className="w-7 h-7" style={{ color: stat.color }} />
                                        </div>
                                        <div>
                                            <h4 className="text-5xl font-black text-[#1D1D1F] tracking-tighter leading-none">{stat.count}</h4>
                                            <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mt-3">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-fadeUp">
                            {loadingShops ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader className="w-8 h-8 animate-spin text-[#014421]" />
                                </div>
                            ) : shops.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-white rounded-[48px] border-2 border-dashed border-black/[0.08] p-16">
                                    <Store className="w-12 h-12 text-[#8E8E93]/30" />
                                    <p className="text-sm font-bold text-[#8E8E93]">No shops yet. Register your first shop to get started.</p>
                                    <button onClick={() => setShowAddShop(true)} className="mt-2 px-8 py-3 bg-[#014421] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#1D1D1F] transition-all flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Add shop
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {shops.map(shop => (
                                        <div key={shop._id} className="bg-white rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm hover:shadow-xl transition-all overflow-hidden p-4 group">
                                            {/* Image */}
                                            <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-4">
                                                <img
                                                    src={shop.image || DEFAULT_IMG}
                                                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                                    alt={shop.name}
                                                />
                                                {/* Status badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${statusColor(shop.permitStatus)}`}>
                                                        {statusLabel(shop.permitStatus)}
                                                    </span>
                                                </div>
                                                {/* Edit & Delete icons */}
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingShop(shop); }}
                                                        className="w-8 h-8 rounded-xl bg-[#7B1113] text-white flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-[#7B1113]/30 active:scale-95"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeletingId(shop._id); }}
                                                        className="w-8 h-8 rounded-xl bg-white/90 text-[#7B1113] flex items-center justify-center hover:bg-[#7B1113] hover:text-white transition-all shadow-md active:scale-95"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {/* Permit image indicator */}
                                                {(shop.permitImage || shop.permitUrl) && (
                                                    <div className="absolute bottom-3 right-3 bg-[#014421]/90 text-white px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Permit
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="px-1 space-y-3 flex-1 flex flex-col">
                                                <h4 className="text-sm font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{shop.name}</h4>

                                                <div className="flex items-center gap-1.5 text-[#8E8E93]">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                                    <p className="text-[11px] font-bold truncate">{shop.address}</p>
                                                </div>

                                                <div className="flex items-center gap-4 py-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-[#014421] opacity-60" />
                                                        <span className="text-[10px] font-black text-[#1D1D1F]">{shop.turnaroundTime} hr</span>
                                                    </div>
                                                    {shop.rating > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
                                                            <span className="text-[10px] font-black text-[#1D1D1F]">{shop.rating}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-black/[0.03]">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-[#8E8E93]">Price</span>
                                                        <span className="text-lg font-[900] text-[#7B1113] tracking-tighter leading-none">₱{shop.price}<span className="text-xs font-bold text-[#8E8E93]/60 ml-0.5">/kg</span></span>
                                                    </div>
                                                </div>

                                                {shop.permitStatus === "rejected" && shop.rejectionReason && (
                                                    <div className="p-3 bg-[#7B1113]/[0.03] rounded-2xl border border-[#7B1113]/10 flex items-start gap-2">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-[#7B1113] shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold text-[#7B1113] leading-relaxed">Revision required: <span className="opacity-70">{shop.rejectionReason}</span></p>
                                                    </div>
                                                )}

                                                {shop.permitStatus === "pending" && (
                                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">Verification in progress</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {deletingId && (
                <ConfirmationModal
                    title="Delete shop?"
                    message="This will permanently remove the shop and all its data."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingId(null)}
                />
            )}

            {showAddShop && (
                <ShopModal
                    onClose={() => setShowAddShop(false)}
                    onSubmit={handleAddShop}
                    loading={submitting}
                />
            )}

            {editingShop && (
                <ShopModal
                    onClose={() => setEditingShop(null)}
                    onSubmit={handleUpdateShop}
                    loading={submitting}
                    initialData={editingShop}
                />
            )}
        </div>
    );
}
