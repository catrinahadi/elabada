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
    Zap, AlertTriangle, X, Loader, UploadCloud, ImagePlus, Camera, LocateFixed, Info, Search, ShieldCheck
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

    // local File objects for upload
    const [shopImageFile, setShopImageFile] = useState(null);
    const [permitFile, setPermitFile] = useState(null);
    const [shopImagePreview, setShopImagePreview] = useState(initialData?.image || "");
    const [permitPreview, setPermitPreview] = useState(initialData?.permitImage || "");
    const [uploading, setUploading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

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
                            <Field label="Shop name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Official business name" />
                            <Field label="Price per kilo (₱)" value={form.price} onChange={e => set("price", e.target.value)} type="number" placeholder="45" />
                        </div>
                    </div>

                    {/* Row 2: Address & Interactive Map */}
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

                        {/* Interactive Leaflet Map Picker */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">Pin exact location</label>
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
                                    <p className="text-[9px] font-black text-[#1D1D1F] uppercase tracking-widest whitespace-nowrap">Drag pin or click map to adjust</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Turnaround time (left) + Permit upload (right, spans full height) */}
                    <div className="flex gap-5 items-stretch">
                        {/* Left col: Turnaround time, Lat, Long */}
                        <div className="flex-1 space-y-3">
                            <Field label="Turnaround time (hours)" value={form.turnaroundTime} onChange={e => set("turnaroundTime", e.target.value)} type="number" placeholder="24" />
                            <div className="grid grid-cols-2 gap-3 opacity-60">
                                <Field label="Latitude" value={form.latitude} onChange={e => set("latitude", e.target.value)} type="text" placeholder="14.167" />
                                <Field label="Longitude" value={form.longitude} onChange={e => set("longitude", e.target.value)} type="text" placeholder="121.241" />
                            </div>
                        </div>
                        {/* Right: Business permit upload */}
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
            <aside className="w-[320px] min-w-[320px] bg-[#FAFAF7] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="w-10 h-10 bg-[#7B1113] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#7B1113]/20">E</div>
                    <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter">ELaBada</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <button onClick={() => setSidebarTab("overview")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-normal transition-all group ${sidebarTab === "overview" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button onClick={() => setSidebarTab("listings")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-normal transition-all group ${sidebarTab === "listings" ? "text-white bg-[#7B1113] shadow-lg shadow-[#7B1113]/20" : "text-[#7B1113]/60 hover:bg-[#7B1113]/5"}`}>
                        <Store className="w-5 h-5" /> My shops
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-black/[0.05]">
                    <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl text-[#7B1113] hover:bg-[#7B1113]/[0.05] transition-all flex items-center gap-4 text-[14px] font-normal">
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
                                        <p className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-[0.3em] mb-2 font-outfit">Total shops</p>
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
                                            <p className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-[0.3em] mt-3">{stat.label}</p>
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
                                    <Store className="w-12 h-12 text-[#1D1D1F]/30" />
                                    <p className="text-sm font-bold text-[#1D1D1F]">No shops yet. Register your first shop to get started.</p>
                                    <button onClick={() => setShowAddShop(true)} className="mt-2 px-8 py-3 bg-[#014421] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#1D1D1F] transition-all flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Add shop
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pb-12">
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
                                                {shop.permitStatus !== "approved" && (
                                                    <div className="absolute bottom-3 right-3">
                                                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${statusColor(shop.permitStatus)}`}>
                                                            {statusLabel(shop.permitStatus)}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Edit & Delete icons */}
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

                                            {/* Info */}
                                            <div className="px-1 space-y-4 flex-1 flex flex-col mt-4">
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <h4 className="text-[14px] font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{shop.name}</h4>
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
