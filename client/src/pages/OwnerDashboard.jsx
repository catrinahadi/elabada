import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
    LayoutDashboard, Store, MessageSquare,
    LogOut, ChevronRight,
    TrendingUp, Star, MoreVertical,
    Edit3, Trash2, ArrowUpRight, Clock,
    FileText, Check, MapPin, XCircle, CheckCircle, Plus,
    Zap, AlertTriangle, X, Loader, UploadCloud, ImagePlus, Camera, LocateFixed, Info, Search, ShieldCheck, Bell
} from "lucide-react";

const API_BASE = "http://localhost:5000";

const Field = ({ label, value, onChange, type = "text", placeholder, step }) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-[#1D1D1F]">{label}</label>
        <input
            type={type}
            step={step}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full h-11 bg-[#F8F9FA] rounded-[14px] px-4 text-sm text-[#1D1D1F] border border-black/[0.05] outline-none focus:ring-2 focus:ring-[#7B1113]/10 focus:border-[#7B1113]/20 focus:bg-white placeholder:text-[#1D1D1F]/40 transition-all font-outfit"
        />
    </div>
);

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn p-10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-[32px] bg-[#80000010] flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-[#800000]" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{title}</h2>
                    <p className="text-sm font-bold text-[#1D1D1F] mt-2">{message}</p>
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
                    {hint && <p className="text-[9px] text-[#1D1D1F] text-center">{hint}</p>}
                </>
            )}
            <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleChange} />
        </div>
    );
}

function MapPicker({ position, onPositionChange }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom());
    }, [position]);

    useMapEvents({
        click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng]);
        },
    });

    return (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const pos = e.target.getLatLng();
                    onPositionChange([pos.lat, pos.lng]);
                }
            }}
        />
    );
}

function ShopModal({ onClose, onSubmit, loading, initialData = null }) {
    const [form, setForm] = useState(initialData || {
        name: "", address: "", price: "", turnaroundTime: "",
        latitude: "14.1675", longitude: "121.2433",
        permitImage: "", image: ""
    });

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
        if (file.type.startsWith("image/")) {
            setPermitPreview(URL.createObjectURL(file));
        } else {
            setPermitPreview("");
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

    const isLoading = loading || uploading;

    return (
        <div className="modal-overlay flex items-center justify-center p-6 z-[200] backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] animate-scaleIn overflow-hidden border border-black/5">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-black/[0.05]">
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{initialData ? "Update shop" : "Register new shop"}</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[#F8F9FA] text-[#1D1D1F] flex items-center justify-center hover:bg-[#7B1113] hover:text-white transition-all active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                    <div className="flex gap-5 items-start">
                        <div className="shrink-0 w-36 h-36">
                            <UploadBox
                                label="Upload"
                                hint="JPG / PNG"
                                onFileSelected={pickShopImage}
                                preview={shopImagePreview}
                                extraClass="w-full h-full"
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <Field label="Shop name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Official business name" />
                            <Field label="Price per kilo (₱)" value={form.price} onChange={e => set("price", e.target.value)} type="number" placeholder="45" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-medium text-[#1D1D1F]">Business address</label>
                            <div className="relative w-full">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D1D1F] opacity-40" />
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={e => set("address", e.target.value)}
                                    placeholder="Type your shop address..."
                                    className="w-full h-11 bg-[#F8F9FA] rounded-[14px] pl-11 pr-4 text-sm text-[#1D1D1F] border border-black/[0.05] outline-none focus:ring-2 focus:ring-[#7B1113]/10 focus:border-[#7B1113]/20 focus:bg-white placeholder:text-[#1D1D1F]/40 transition-all font-outfit"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[#1D1D1F]">Pin exact location</label>
                            <div className="h-60 rounded-[32px] overflow-hidden border border-black/5 shadow-inner bg-[#F1F4F2] relative group">
                                <MapContainer
                                    center={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                                    zoom={15}
                                    className="w-full h-full z-0"
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <MapPicker
                                        position={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                                        onPositionChange={([lat, lng]) => {
                                            set("latitude", lat.toFixed(6).toString());
                                            set("longitude", lng.toFixed(6).toString());
                                        }}
                                    />
                                </MapContainer>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-black/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    <p className="text-[9px] font-black text-[#1D1D1F] whitespace-nowrap">Drag pin or click map to adjust</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-5 items-stretch">
                        <div className="flex-1 space-y-3">
                            <Field label="Turnaround time (hours)" value={form.turnaroundTime} onChange={e => set("turnaroundTime", e.target.value)} type="number" placeholder="24" />
                            <div className="grid grid-cols-2 gap-3 opacity-60">
                                <Field label="Latitude" value={form.latitude} onChange={e => set("latitude", e.target.value)} type="text" placeholder="14.167" />
                                <Field label="Longitude" value={form.longitude} onChange={e => set("longitude", e.target.value)} type="text" placeholder="121.241" />
                            </div>
                        </div>
                        {!initialData && (
                            <div className="w-52 shrink-0 flex flex-col">
                                <label className="block text-[11px] font-medium text-[#1D1D1F] mb-1.5">Business permit</label>
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
    const [statusFilter, setStatusFilter] = useState("all");
    const [readNotifications, setReadNotifications] = useState(() => {
        const saved = localStorage.getItem('owner_read_notifs');
        return saved ? JSON.parse(saved) : [];
    });

    const markAsRead = (id) => {
        if (!readNotifications.includes(id)) {
            const newRead = [...readNotifications, id];
            setReadNotifications(newRead);
            localStorage.setItem('owner_read_notifs', JSON.stringify(newRead));
        }
    };

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

    const notifications = shops
        .filter(s => s.permitStatus === 'approved' || s.permitStatus === 'rejected')
        .sort((a, b) => new Date(b.updatedAt || Date.now()) - new Date(a.updatedAt || Date.now()))
        .map(s => {
            const date = new Date(s.updatedAt || Date.now());
            const now = new Date();
            const diffMs = now - date;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

            let timeStr = `${diffHrs}h ago`;
            if (diffHrs === 0) timeStr = "Just now";
            if (diffHrs >= 24) timeStr = `${Math.floor(diffHrs / 24)}d ago`;

            return {
                id: s._id,
                type: s.permitStatus,
                description: `Admin ${s.permitStatus === 'approved' ? 'approved' : 'disapproved'} ${s.name}`,
                time: timeStr,
                date: date,
                shop: s,
                isRead: readNotifications.includes(s._id)
            };
        });

    return (
        <div className="flex bg-[#F1F4F2] min-h-screen text-[#1D1D1F] font-outfit">
            <aside className="w-[320px] min-w-[320px] bg-[#FAFAF7] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="w-10 h-10 bg-[#7B1113] rounded-2xl flex items-center justify-center text-white font-normal text-xl shadow-lg shadow-[#7B1113]/20">E</div>
                    <span className="text-[#1D1D1F] font-normal text-2xl tracking-tighter">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <button onClick={() => { setSidebarTab("overview"); setStatusFilter("all"); }} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-normal transition-all group ${sidebarTab === "overview" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button onClick={() => { setSidebarTab("listings"); setStatusFilter("all"); }} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-normal transition-all group ${sidebarTab === "listings" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <Store className="w-5 h-5" /> My shops
                    </button>
                    <button onClick={() => setSidebarTab("notifications")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-normal transition-all group ${sidebarTab === "notifications" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <Bell className="w-5 h-5" /> Notifications
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-black/[0.05]">
                    <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl text-[#7B1113] hover:bg-[#7B1113]/[0.05] transition-all flex items-center gap-4 text-[14px] font-normal">
                        <LogOut className="w-5 h-5" /> Log out
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">

                    <div className="p-12 space-y-12 max-w-[1600px] w-full mx-auto animate-fadeUp">
                        {sidebarTab === "overview" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                                {/* Left Side: Banner + Stats (span 2) */}
                                <div className="lg:col-span-2 flex flex-col gap-8">
                                    {/* Welcome Banner */}
                                    <div className="bg-[#7B1113] rounded-[56px] p-12 text-white border border-white/10 shadow-xl relative overflow-hidden group flex flex-col justify-center min-h-[300px] flex-1">
                                        <div className="relative z-10 space-y-6">

                                            <h2 className="text-8xl font-normal tracking-tighter leading-none text-white transition-transform group-hover:scale-[1.01]">Welcome, {user?.name?.split(' ')[0] || 'Executive'}</h2>
                                            <p className="text-white/70 text-[14px] font-medium max-w-md leading-relaxed">
                                                Manage your laundry network with real-time analytics and compliance tracking.
                                            </p>
                                        </div>
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-[100px] transition-all group-hover:bg-white/20" />
                                    </div>

                                    {/* Dashboard Statistics Subgrid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch h-[400px]">
                                        {/* Left: Total Shops (Vertical Full Height) */}
                                        <button
                                            onClick={() => { setSidebarTab("listings"); setStatusFilter("all"); }}
                                            className="bg-blue-950/[0.03] p-12 rounded-[56px] border border-blue-950/10 shadow-sm flex flex-col items-center justify-center gap-6 group hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all text-center relative overflow-hidden"
                                        >
                                            <span className="text-[84px] font-bold text-blue-950 tracking-tighter leading-none group-hover:scale-105 transition-transform">{shops.length}</span>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[20px] font-medium text-blue-900">Total Shops</span>
                                            </div>
                                            <ChevronRight className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-950/30 group-hover:text-blue-950 group-hover:translate-x-1 transition-all" />
                                        </button>

                                        {/* Right: Pending & Approved (Stacked Vertically) */}
                                        <div className="flex flex-col gap-8">
                                            {[
                                                {
                                                    label: "Pending shop",
                                                    count: shops.filter(s => s.permitStatus === "pending").length,
                                                    status: "pending",
                                                    bg: "bg-[#7B1113]/[0.03]",
                                                    border: "border-[#7B1113]/10",
                                                    text: "text-[#7B1113]"
                                                },
                                                {
                                                    label: "Approved shop",
                                                    count: shops.filter(s => s.permitStatus === "approved").length,
                                                    status: "approved",
                                                    bg: "bg-[#228B22]/[0.03]",
                                                    border: "border-[#228B22]/10",
                                                    text: "text-[#228B22]"
                                                },
                                            ].map(stat => (
                                                <button
                                                    key={stat.label}
                                                    onClick={() => { setSidebarTab("listings"); setStatusFilter(stat.status); }}
                                                    className={`flex-1 p-10 rounded-[56px] border ${stat.border} ${stat.bg} shadow-sm flex items-center justify-between group hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all text-left w-full relative overflow-hidden`}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <span className={`text-[48px] font-bold ${stat.text} tracking-tighter leading-none shrink-0`}>{stat.count}</span>
                                                        <div className="flex flex-col justify-center">
                                                            <span className={`text-[20px] font-medium ${stat.text}`}>
                                                                {stat.count === 1 ? stat.label : `${stat.label}s`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-8 h-8 ${stat.text} opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Full-Height Notification Center (span 1) */}
                                <div className="flex flex-col h-full">
                                    <div className="bg-white rounded-[56px] border border-black/[0.04] shadow-sm flex-1 flex flex-col p-10 pb-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-[22px] font-medium text-[#1D1D1F] tracking-tighter">Notification center</h3>
                                        </div>

                                        {/* Filter Tabs - Inspired by AI Notification Center */}
                                        <div className="flex items-center gap-2 mb-6 bg-[#F8F9FA] p-1.5 rounded-2xl">
                                            {['Today', 'This Week', 'Earlier'].map((tab) => (
                                                <button
                                                    key={tab}
                                                    className={`flex-1 py-2 text-[14px] font-medium rounded-xl transition-all ${tab === 'Today' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#8E8E93] hover:text-[#1D1D1F]'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar py-2">
                                            {notifications.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
                                                    <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center">
                                                        <Bell className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-sm font-medium">Clear for now</p>
                                                </div>
                                            ) : notifications.map((notif, idx) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => { markAsRead(notif.id); setSidebarTab("listings"); }}
                                                    className="group transition-all cursor-pointer bg-white border border-black/[0.04] shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 py-8 px-6 rounded-2xl relative overflow-hidden"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-4 flex-1">
                                                                <div className="mt-1.5 shrink-0">
                                                                    {notif.isRead ? (
                                                                        <CheckCircle className="w-4 h-4 text-[#8E8E93] opacity-40" />
                                                                    ) : (
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)] animate-pulse" />
                                                                    )}
                                                                </div>
                                                                <p className={`text-[14px] font-medium leading-[1.4] transition-colors ${notif.isRead ? 'text-[#8E8E93]' : 'text-[#1D1D1F]'}`}>
                                                                    {notif.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {notifications.length > 0 && (
                                            <button
                                                onClick={() => setSidebarTab("notifications")}
                                                className="mt-6 w-full py-4 text-[14px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] transition-all border-t border-black/[0.04] pt-6 flex items-center justify-center"
                                            >
                                                See all notifications
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {sidebarTab === "listings" && (
                            <div className="space-y-8 animate-fadeUp">
                                {loadingShops ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader className="w-8 h-8 animate-spin text-[#014421]" />
                                    </div>
                                ) : shops.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-white rounded-[48px] border-2 border-dashed border-black/[0.08] p-16">
                                        <Store className="w-12 h-12 text-[#1D1D1F]/30" />
                                        <p className="text-sm font-bold text-[#1D1D1F]">No shops yet. Register your first shop to get started.</p>
                                        <button onClick={() => setShowAddShop(true)} className="mt-2 px-8 py-3 bg-[#014421] text-white rounded-2xl text-xs font-black hover:bg-[#1D1D1F] transition-all flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Add shop
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pb-12">
                                        {shops.filter(s => statusFilter === "all" ? true : s.permitStatus === statusFilter).map(shop => (
                                            <div key={shop._id} className="bg-white rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm hover:shadow-xl transition-all overflow-hidden p-4 group">
                                                <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-4">
                                                    <img
                                                        src={shop.image || DEFAULT_IMG}
                                                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                                        alt={shop.name}
                                                    />
                                                    {shop.permitStatus !== "approved" && (
                                                        <div className="absolute bottom-3 right-3">
                                                            <span className={`text-[9px] font-medium px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${statusColor(shop.permitStatus)}`}>
                                                                {statusLabel(shop.permitStatus)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingShop(shop); }}
                                                            className="w-11 h-11 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center shadow-lg"
                                                        >
                                                            <Edit3 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeletingId(shop._id); }}
                                                            className="w-11 h-11 rounded-xl bg-[#7B1113] text-white flex items-center justify-center shadow-lg"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="px-1 space-y-4 flex-1 flex flex-col mt-4">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <h4 className="text-[16px] font-medium text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{shop.name}</h4>
                                                            {shop.permitStatus === 'approved' && (
                                                                <div className="w-4 h-4 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-sm">
                                                                    <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
                                                            <span className="text-[12px] font-medium text-[#1D1D1F]">{shop.rating || 0}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[#1D1D1F] mt-1">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-40" />
                                                        <p className="text-[12px] font-medium truncate">{shop.address}</p>
                                                    </div>

                                                    <div className="flex items-center gap-4 py-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-[#1D1D1F] opacity-40" />
                                                            <span className="text-[12px] font-medium text-[#1D1D1F] lowercase">{shop.turnaroundTime} hr</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-black/[0.03]">
                                                        <div className="flex flex-col">
                                                            <span className="text-[16px] font-black text-[#7B1113] tracking-tighter font-outfit leading-none">₱{shop.price}<span className="text-[12px] font-bold text-[#7B1113] lowercase ml-0.5 opacity-80">/kg</span></span>
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

                        {sidebarTab === "notifications" && (
                            <div className="bg-white rounded-[48px] p-12 border border-black/[0.04] shadow-sm animate-fadeUp">
                                <h2 className="text-3xl font-medium text-[#1D1D1F] mb-8 tracking-tighter">All notifications</h2>
                                <div className="space-y-6">
                                    {notifications.length === 0 ? (
                                        <p className="text-sm text-[#8E8E93]">No notifications yet.</p>
                                    ) : notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => setSidebarTab("listings")}
                                            className="p-10 rounded-[42px] bg-[#F8F9FA] flex justify-between items-center gap-8 group hover:bg-white border border-black/[0.02] shadow-sm hover:shadow-2xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all cursor-pointer"
                                        >
                                            <p className="text-[16px] font-medium text-[#1D1D1F] leading-relaxed max-w-3xl">
                                                {notif.description}
                                            </p>
                                            <span className="text-[13px] font-medium text-[#8E8E93] shrink-0">{notif.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
