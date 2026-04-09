import { useState, useEffect, useRef, memo, useMemo } from "react";
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
    LogOut, ChevronRight, ArrowLeft,
    TrendingUp, Star, MoreVertical,
    Edit3, Trash2, ArrowUpRight, Clock,
    FileText, Check, MapPin, XCircle, CheckCircle, Plus,
    Zap, AlertTriangle, X, Loader, UploadCloud, ImagePlus, Camera, LocateFixed, Info, Search, ShieldCheck, Bell, Menu
} from "lucide-react";

const MemoizedMap = memo(({ position, onPositionChange }) => {
    return (
        <MapContainer
            center={position}
            zoom={15}
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapPicker
                position={position}
                onPositionChange={onPositionChange}
            />
        </MapContainer>
    );
}, (prev, next) => {
    return prev.position[0] === next.position[0] && prev.position[1] === next.position[1];
});

// Using baseURL from services/api.js instead of hardcoded strings


const Field = ({ label, value, onChange, type = "text", placeholder, step }) => (
    <div className="space-y-1">
        <label className="block text-[12px] font-medium text-[#1D1D1F] px-1">{label}</label>
        <input
            type={type}
            step={step}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full h-10 bg-[#F8F9FA] rounded-[12px] px-4 text-[13px] font-normal text-[#1D1D1F] border border-black/[0.05] outline-none focus:ring-2 focus:ring-[#7B1113]/10 focus:border-[#7B1113]/20 focus:bg-white placeholder:text-[#1D1D1F]/40 transition-all font-outfit"
            required
        />
    </div>
);

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[300] backdrop-blur-sm bg-black/10">
            <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-scaleIn p-6 md:p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-[24px] bg-[#80000010] flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-[#800000]" />
                </div>
                <div>
                    <h2 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight">{title}</h2>
                    <p className="text-[14px] font-normal text-[#8E8E93] mt-1 leading-relaxed">{message}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button onClick={onCancel} className="py-4 rounded-2xl bg-[#F8F9FA] text-[#1D1D1F] font-normal text-[14px] hover:bg-[#E5E5EA] transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="py-4 rounded-2xl bg-[#800000] text-white font-normal text-[14px] hover:bg-black transition-colors shadow-lg shadow-[#800000]/20">Confirm</button>
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 lg:top-auto lg:bottom-12 lg:right-12 lg:left-auto lg:translate-x-0 z-[500] animate-fadeUp">
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
                    <p className="text-[14px] font-normal text-[#8E8E93] text-center">{label}</p>
                    {hint && <p className="text-[14px] font-normal text-[#8E8E93] text-center">{hint}</p>}
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

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function ShopModal({ onClose, onSubmit, loading, initialData = null }) {
    const getInitialHours = (h) => {
        if (h && typeof h === 'object' && !Array.isArray(h) && (h.monday || h.Tuesday)) return h; // Tuesday if capitalized by some chance
        // Standardize keys to lowercase
        if (h && typeof h === 'object' && !Array.isArray(h)) {
            const normalized = {};
            DAYS.forEach(d => {
                normalized[d] = h[d] || h[d.charAt(0).toUpperCase() + d.slice(1)] || { open: "08:00", close: "20:00", closed: false };
            });
            return normalized;
        }
        return DAYS.reduce((acc, d) => ({ 
            ...acc, 
            [d]: { open: "08:00", close: "20:00", closed: d === "sunday" } 
        }), {});
    };

    const [form, setForm] = useState(initialData ? {
        ...initialData,
        price: initialData.price?.toString() || "",
        turnaroundTime: initialData.turnaroundTime?.toString() || "",
        operatingHours: getInitialHours(initialData.operatingHours)
    } : {
        name: "", address: "", price: "", turnaroundTime: "", 
        operatingHours: DAYS.reduce((acc, d) => ({ 
            ...acc, 
            [d]: { open: "08:00", close: "18:00", closed: true } 
        }), {}),
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
        return data.url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Comprehensive validation
        if (!form.name || !form.address || !form.price || !form.turnaroundTime || !form.operatingHours) return;
        
        const hasOpenDay = Object.values(form.operatingHours).some(d => !d.closed);
        if (!hasOpenDay) {
            alert("Please set operating hours for at least one day (Toggle a day to open it).");
            return;
        }
        
        // Required files check for new registrations
        if (!initialData) {
            if (!shopImageFile || !permitFile) {
                alert("Please upload both a shop photo and your business permit.");
                return;
            }
        }

        setUploading(true);
        try {
            const [imageUrl, permitUrl] = await Promise.all([
                shopImageFile ? uploadFile(shopImageFile) : Promise.resolve(form.image),
                permitFile ? uploadFile(permitFile) : Promise.resolve(form.permitImage)
            ]);

            const finalForm = { 
                ...form, 
                image: imageUrl, 
                permitImage: permitUrl 
            };
            
            await onSubmit(finalForm);
        } catch (err) {
            console.error("Upload error:", err.message);
            alert("Upload failed: " + (err.response?.data?.message || err.message));
            setUploading(false);
        }
    };

    const isLoading = loading || uploading;

    return (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 md:p-10 z-[200] backdrop-blur-xl bg-black/40">
            <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[1100px] max-h-[90vh] shadow-[0_80px_160px_rgba(0,0,0,0.4)] animate-scaleIn overflow-hidden border border-white/20 flex flex-col">
                <div className="px-10 pt-8 pb-4 flex items-start justify-between">
                    <div className="space-y-1">
                        <h2 className="text-[18px] font-normal text-[#1D1D1F] tracking-tighter">{initialData ? "Edit Shop Details" : "Register New Shop"}</h2>
                        <p className="text-[14px] font-normal text-[#8E8E93]">Fill in the essentials to get your establishment listed.</p>
                    </div>
                    <button onClick={onClose} className="text-[#1D1D1F] p-2 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto px-10 space-y-5 pt-2 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch h-full">
                        {/* Left Column: Visuals & Location */}
                        <div className="space-y-4 flex flex-col h-full">
                            <UploadBox
                                label="Upload a photo of your shop"
                                onFileSelected={pickShopImage}
                                preview={shopImagePreview}
                                extraClass="h-[140px]"
                            />

                            <div className="flex-1 flex flex-col space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[12px] font-medium text-[#1D1D1F] px-1">Business Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D1D1F] opacity-30" />
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={e => set("address", e.target.value)}
                                            placeholder="Enter complete address"
                                            className="w-full h-10 bg-[#F8F9FA] rounded-[12px] pl-10 pr-5 text-[13px] font-normal border border-black/5 outline-none focus:ring-2 focus:ring-[#7B1113]/10 focus:border-[#7B1113]/20 transition-all font-outfit"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[240px] h-[240px] rounded-[24px] overflow-hidden border border-black/5 relative group bg-[#F8F9FA]">
                                    <MemoizedMap 
                                        position={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                                        onPositionChange={([lat, lng]) => {
                                            set("latitude", lat.toFixed(6).toString());
                                            set("longitude", lng.toFixed(6).toString());
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-black/5 shadow-sm">
                                        <span className="text-[10px] font-normal text-[#1D1D1F] opacity-60 uppercase tracking-widest">Interactive Map</span>
                                    </div>
                                </div>

                                {!initialData && (
                                    <div className="space-y-1 pt-1">
                                        <label className="block text-[12px] font-medium text-[#1D1D1F]">Operating Permit / LTO</label>
                                        <UploadBox
                                            label={permitFile ? "Permit Uploaded Successfully" : "Upload Business Permit"}
                                            hint="JPG, PNG or PDF only"
                                            onFileSelected={pickPermit}
                                            preview={permitPreview}
                                            extraClass="h-[140px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Core Info & Documents */}
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <Field
                                    label="Establishment Name"
                                    value={form.name}
                                    onChange={e => set("name", e.target.value)}
                                    placeholder="e.g. Master Cleaners"
                                />
                                <Field
                                    label={<>Price per Kilo <span className="text-[#8E8E93]">(₱)</span></>}
                                    value={form.price}
                                    onChange={e => set("price", e.target.value)}
                                    type="number"
                                    placeholder="45.00"
                                />
                                <Field
                                    label={<>Turnaround Time <span className="text-[#8E8E93]">(hrs)</span></>}
                                    value={form.turnaroundTime}
                                    onChange={e => set("turnaroundTime", e.target.value)}
                                    type="number"
                                    placeholder="24"
                                />
                                <div className="space-y-4 pt-2">
                                    <label className="block text-[14px] font-normal text-[#1D1D1F] border-b border-black/5 pb-2">
                                        Operating Hours
                                    </label>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {DAYS.map(day => (
                                            <div key={day} className={`flex items-center justify-between gap-3 p-2 rounded-[16px] border transition-all ${form.operatingHours[day].closed ? 'bg-red-50/30 border-red-100/40' : 'bg-[#F8F9FA] border-black/[0.03]'}`}>
                                                <div className="flex items-center gap-3 min-w-[100px]">
                                                    <div 
                                                        onClick={() => {
                                                            const newHours = { ...form.operatingHours };
                                                            newHours[day] = { ...newHours[day], closed: !newHours[day].closed };
                                                            set("operatingHours", newHours);
                                                        }}
                                                        className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${form.operatingHours[day].closed ? 'bg-[#7B1113]/10' : 'bg-[#014421]/10'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm ${form.operatingHours[day].closed ? 'bg-[#7B1113] left-4.5' : 'bg-[#014421] left-0.5'}`}></div>
                                                    </div>
                                                    <span className={`text-[13px] capitalize tracking-tight ${form.operatingHours[day].closed ? 'text-red-500/60' : 'text-[#1D1D1F]'}`}>{day}</span>
                                                </div>
                                                {!form.operatingHours[day].closed ? (
                                                    <div className="flex items-center gap-2 animate-fadeUp">
                                                        <div className="relative group/time">
                                                            <input 
                                                                type="time" 
                                                                value={form.operatingHours[day].open}
                                                                onChange={(e) => {
                                                                    const newHours = { ...form.operatingHours };
                                                                    newHours[day] = { ...newHours[day], open: e.target.value };
                                                                    set("operatingHours", newHours);
                                                                }}
                                                                className="bg-white border border-black/5 rounded-xl px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#014421]/5 focus:border-[#014421]/20 font-medium text-[#1D1D1F]"
                                                            />
                                                        </div>
                                                        <span className="text-black/10 font-light">—</span>
                                                        <div className="relative group/time">
                                                            <input 
                                                                type="time" 
                                                                value={form.operatingHours[day].close}
                                                                onChange={(e) => {
                                                                    const newHours = { ...form.operatingHours };
                                                                    newHours[day] = { ...newHours[day], close: e.target.value };
                                                                    set("operatingHours", newHours);
                                                                }}
                                                                className="bg-white border border-black/5 rounded-xl px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#014421]/5 focus:border-[#014421]/20 font-medium text-[#1D1D1F]"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pr-4 flex items-center gap-2 text-red-500/40 italic text-[12px] animate-pulse">
                                                        <span>Closed for the day</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    </div>
                    
                    <div className="px-10 py-5 bg-white border-t border-black/5 mt-auto">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-[20px] bg-[#7B1113] text-white text-[14px] font-normal hover:bg-[#1D1D1F] transition-all shadow-2xl shadow-[#7B1113]/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Register Establishment"}
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
    const [shops, setShops] = useState([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showAddShop, setShowAddShop] = useState(false);
    const [editingShop, setEditingShop] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedShopId, setSelectedShopId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const filteredShopsList = useMemo(() => {
        return shops.filter(s => {
            if (selectedShopId) return s._id === selectedShopId;
            return statusFilter === "all" ? true : s.permitStatus === statusFilter;
        });
    }, [shops, selectedShopId, statusFilter]);

    const paginatedShops = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredShopsList.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredShopsList, currentPage]);

    const totalPages = Math.ceil(filteredShopsList.length / ITEMS_PER_PAGE);

    const isModalOpen = showAddShop || !!editingShop || !!deletingId;

    const handleLogout = () => { logout(); navigate("/"); };

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
            setSuccessMsg("Your shop has been registered and is pending review.");
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
            setSuccessMsg("Shop details have been updated successfully.");
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
        if (s === "approved") return "bg-[#1A6B1A]/10 text-[#1A6B1A] border-[#1A6B1A]/20";
        if (s === "rejected") return "bg-[#7B1113]/10 text-[#7B1113] border-[#7B1113]/20";
        return "bg-amber-50 text-amber-600 border-amber-100";
    };
    const statusLabel = (s) => s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Pending";

    const DEFAULT_IMG = "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] font-outfit pb-20">
            {/* Header - Hidden when modal is open */}
            {!isModalOpen && (
                <header className="h-20 lg:h-24 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center text-white font-normal text-xl shadow-lg shadow-[#014421]/20 transition-transform">E</div>
                        <span className="text-[#1D1D1F] font-normal text-2xl tracking-tighter">ELaBada</span>
                    </div>
                    <button onClick={handleLogout} className="text-[#800000] hover:bg-[#800000]/[0.05] p-3 rounded-2xl transition-all flex items-center gap-2 text-[14px] font-normal">
                        <LogOut className="w-4 h-4" /> Log out
                    </button>
                </header>
            )}

            <main className="w-full px-6 md:px-12 py-[15px] space-y-12">
                {/* Heading & Welcome Section */}
                <div className="space-y-8 animate-fadeUp">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-[32px] md:text-6xl font-normal tracking-tighter leading-tight text-[#1D1D1F]">Welcome back, {user?.name?.split(' ')[0] || 'Executive'}</h2>
                        </div>
                        <button
                            onClick={() => setShowAddShop(true)}
                            className="bg-[#014421] text-white px-8 py-5 rounded-[24px] text-[14px] font-normal hover:bg-[#1D1D1F] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#014421]/10 self-end md:self-auto group active:scale-95"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> Register New Shop
                        </button>
                    </div>
                </div>

                {/* Stats Grid - Now non-clickable divs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 animate-fadeUp" style={{ animationDelay: "50ms" }}>
                    {[
                        {
                            label: "Overall Rating",
                            count: (() => {
                                const totalReviews = shops.reduce((acc, s) => acc + (s.reviewCount || 0), 0);
                                if (totalReviews === 0) {
                                    return shops.length > 0 
                                        ? (shops.reduce((acc, s) => acc + (s.rating || 0), 0) / shops.length).toFixed(1)
                                        : "0.0";
                                }
                                const totalStars = shops.reduce((acc, s) => acc + ((s.rating || 0) * (s.reviewCount || 0)), 0);
                                return (totalStars / totalReviews).toFixed(1);
                            })(),
                            icon: Star,
                            color: "#014421",
                            bg: "bg-[#01442110]"
                        },
                        {
                            label: "Approved Shops",
                            count: shops.filter(s => s.permitStatus === "approved").length,
                            icon: CheckCircle,
                            color: "#228B22",
                            bg: "bg-[#228B2210]"
                        },
                        {
                            label: "Rejected Shops",
                            count: shops.filter(s => s.permitStatus === "rejected").length,
                            icon: XCircle,
                            color: "#800000",
                            bg: "bg-[#80000010]"
                        },
                        {
                            label: "Pending Shops",
                            count: shops.filter(s => s.permitStatus === "pending").length,
                            icon: Clock,
                            color: "#F59E0B",
                            bg: "bg-[#F59E0B15]"
                        }
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="rounded-[40px] p-8 bg-white border border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col justify-center h-[150px] gap-4 transition-all hover:shadow-md group"
                        >
                            <div>
                                <h3 className="text-5xl font-black tracking-tighter" style={{ color: stat.color }}>
                                    {stat.count}
                                </h3>
                                <p className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-[0.1em] mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Registry Management Table */}
                <div className="pt-[15px] space-y-8 animate-fadeUp" style={{ animationDelay: "100ms" }}>
                    <div className="space-y-1">
                        <h2 className="text-[18px] font-normal text-[#1D1D1F] tracking-tight">Shop Registries</h2>
                    </div>

                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-3 mb-4 -mx-4 px-4">
                        {[
                            { id: "all", label: "Total Shops" },
                            { id: "pending", label: "Pending" },
                            { id: "approved", label: "Approved" },
                            { id: "rejected", label: "Rejected" }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => { setStatusFilter(f.id); setSelectedShopId(null); setCurrentPage(1); }}
                                className={`px-6 py-3 rounded-2xl text-[14px] font-normal transition-all capitalize border-2 shrink-0 whitespace-nowrap ${statusFilter === f.id ? 'bg-[#014421] text-white border-[#014421] shadow-xl' : 'bg-white text-[#8E8E93] border-black/[0.05] hover:border-black/20'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-[40px] md:rounded-[56px] border border-black/[0.04] shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/[0.03]">
                                    <th className="py-8 pl-10 pr-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Shop #</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Name</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Owner</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Location</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Price</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Turnaround Time</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Date Created</th>
                                    <th className="py-8 px-4 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Rating</th>
                                    <th className="py-8 px-4 pr-10 text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/[0.02]">
                                {loadingShops ? (
                                    <tr>
                                        <td colSpan="10" className="py-32 text-center text-[#8E8E93] text-sm animate-pulse">Loading registries...</td>
                                    </tr>
                                ) : filteredShopsList.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-40 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-20 h-20 bg-[#F8F9FA] rounded-[32px] flex items-center justify-center mx-auto mb-4 opacity-50 shadow-inner">
                                                    <Store className="w-10 h-10 text-[#1D1D1F]" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[16px] font-bold text-[#1D1D1F]">No shops registered.</p>
                                                    <p className="text-[14px] font-medium text-[#8E8E93]">Start by registering your first laundry shop.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {paginatedShops.map((shop, idx) => (
                                            <tr key={shop._id} className="group hover:bg-[#F8F9FA]/80 transition-all">
                                                <td className="py-8 pl-10 pr-4">
                                                    <span className="text-[14px] font-normal text-[#1D1D1F] truncate italic opacity-60">{( (currentPage-1) * ITEMS_PER_PAGE + idx + 1).toString().padStart(2, '0')}</span>
                                                </td>
                                                <td className="py-8 px-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[14px] font-normal text-[#1D1D1F] tracking-tight">{shop.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4">
                                                    <span className="text-[14px] font-medium text-[#1D1D1F]">{user?.name || 'You'}</span>
                                                </td>
                                                <td className="py-8 px-4">
                                                    <div className="flex items-center text-[#1D1D1F]">
                                                        <span className="text-[12px] font-medium max-w-[200px] truncate">{shop.address}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 whitespace-nowrap">
                                                    <span className="text-[14px] font-normal text-[#1D1D1F] tracking-tight">₱{shop.price}<span className="text-[10px] text-[#1D1D1F] ml-0.5 tracking-normal">/kg</span></span>
                                                </td>
                                                <td className="py-8 px-4 whitespace-nowrap">
                                                    <div className="flex items-center text-[#1D1D1F]">
                                                        <span className="text-[12px] font-medium">{shop.turnaroundTime} hrs</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 whitespace-nowrap">
                                                    <div className="flex items-center text-[#1D1D1F]">
                                                        <span className="text-[12px] font-medium">{new Date(shop.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 whitespace-nowrap">
                                                    <div className="flex items-center text-[#1D1D1F]">
                                                        <span className="text-[14px] font-medium">{shop.rating || 0}/5</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 pr-10 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/[0.03] shadow-sm ${statusColor(shop.permitStatus)}`}>
                                                            {statusLabel(shop.permitStatus)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {shop.permitStatus !== 'rejected' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => setEditingShop(shop)}
                                                                        className="w-10 h-10 rounded-xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-center text-[#1D1D1F] hover:bg-black/[0.03] hover:shadow-md transition-all active:scale-95"
                                                                        title="Edit Establishment"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingId(shop._id)}
                                                                        className="w-10 h-10 rounded-xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-center text-[#7B1113] hover:bg-[#7B1113]/5 hover:shadow-md transition-all active:scale-95"
                                                                        title="Delete Establishment"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {totalPages > 1 && (
                                            <tr key="pagination">
                                                <td colSpan="10" className="py-6 px-10 bg-[#F8F9FA]/30 border-t border-black/[0.03]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[12px] font-medium text-[#8E8E93]">Page {currentPage} of {totalPages}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                disabled={currentPage === 1}
                                                                className="px-4 py-2 rounded-xl bg-white border border-black/5 text-[12px] font-medium text-[#1D1D1F] disabled:opacity-30 transition-all hover:bg-gray-50 active:scale-95"
                                                            >
                                                                Prev
                                                            </button>
                                                            <button 
                                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                disabled={currentPage === totalPages}
                                                                className="px-4 py-2 rounded-xl bg-white border border-black/5 text-[12px] font-medium text-[#1D1D1F] disabled:opacity-30 transition-all hover:bg-gray-50 active:scale-95"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </main>

            {/* Modals & Feedback */}
            {deletingId && (
                <ConfirmationModal
                    title="Delete Shop"
                    message="This will permanently delete your shop listing. This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingId(null)}
                />
            )}

            {successMsg && (
                <Toast message={successMsg} onClose={() => setSuccessMsg(null)} />
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
