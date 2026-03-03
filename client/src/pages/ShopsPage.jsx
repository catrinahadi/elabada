import { useState, useMemo, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calculateTopsis } from "../utils/topsis";
import {
  Star, MapPin, Search, Filter, Map as MapIcon,
  Clock, Package, ShieldCheck, ChevronRight,
  X, Info, MessageSquare, ArrowUpRight, Award,
  Droplets, Zap, ThumbsUp, DollarSign, LayoutGrid, List,
  GripVertical, ArrowUp, ArrowDown, Map as GoogleMap,
  MoreHorizontal, Heart, ArrowLeft, MoreVertical, LocateFixed,
  LayoutDashboard, LogOut, Settings, BarChart3, Sliders, Navigation, Navigation2,
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer, Circle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_SHOP_IMAGE = "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=400&h=250&fit=crop";

const initialShops = [
  {
    id: "mock1",
    name: "EcoFresh Laundry",
    address: "Lopez Avenue, Los Baños",
    price: 45,
    turnaroundTime: 24,
    rating: 4.8,
    reviewCount: 156,
    status: "open",
    permitStatus: "approved",
    image: DEFAULT_SHOP_IMAGE,
    latitude: 14.1670,
    longitude: 121.2435
  },
  {
    id: "mock2",
    name: "Bubble Burst",
    address: "Batong Malake, Los Baños",
    price: 50,
    turnaroundTime: 12,
    rating: 4.5,
    reviewCount: 89,
    status: "open",
    permitStatus: "approved",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop",
    latitude: 14.1685,
    longitude: 121.2445
  }
];

const UP_GREEN_DARK = "#014421";
const UP_GREEN_LIGHT = "#0F4D32";
const UP_MAROON = "#7B1113";
const UP_GREEN_ACCENT = "#D1FFD1";

const USER_LOCATION = [14.1670, 121.2435];

// Custom Icons for Map
const createUserLocationIcon = () => L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative w-8 h-8 flex items-center justify-center">
    <div class="absolute w-full h-full bg-blue-500/20 rounded-full animate-ping"></div>
    <div class="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const createShopMarkerIcon = (rank, name) => {
  const isTop3 = rank <= 3;
  const mainColor = isTop3 ? "#FF8C00" : "#7B1113";
  const dotColor = "#FFFFFF";

  return L.divIcon({
    className: 'custom-shop-marker',
    html: `<div class="flex flex-col items-center">
      ${isTop3 ? `
      <div class="bg-white px-2 py-1 rounded-full shadow-lg border border-black/5 mb-1 animate-bounceIn">
        <p class="text-[8px] font-black text-[#014421] tracking-tighter whitespace-nowrap leading-none">${name}</p>
      </div>` : ''}
      <div class="relative ${isTop3 ? 'scale-90' : 'scale-75'} transition-transform">
        <svg width="24" height="32" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${mainColor}"/>
          <circle cx="14" cy="14" r="5" fill="${dotColor}"/>
        </svg>
      </div>
    </div>`,
    iconSize: [isTop3 ? 100 : 20, isTop3 ? 60 : 28],
    iconAnchor: [isTop3 ? 50 : 10, isTop3 ? 55 : 28]
  });
};



function ReviewForm({ shopId, onPosted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.role !== 'customer') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating.");
    setSubmitting(true);
    await onPosted(shopId, { rating, comment, reviewerName: user.name });
    setRating(0);
    setComment("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#F8F9FA] p-8 rounded-[40px] border border-black/[0.03] space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black text-[#1D1D1F] tracking-tighter">Write a Review</h3>
        <p className="text-xs font-bold text-[#8E8E93]">Rate your experience</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)} className="p-1">
            <Star className={`w-8 h-8 transition-transform active:scale-90 ${s <= rating ? 'fill-[#FFB017] text-[#FFB017]' : 'text-[#8E8E93]/20'}`} />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts (optional)"
        className="w-full h-32 bg-white rounded-3xl p-5 text-sm font-bold outline-none border border-black/[0.05] focus:ring-2 focus:ring-[#014421]/10 placeholder:text-[#8E8E93]/40 transition-all resize-none"
      />

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full py-4 bg-[#014421] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1D1D1F] transition-all shadow-xl shadow-[#014421]/20 disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post Review"}
      </button>
    </form>
  );
}

function ShopDetailModal({ shop, reviews = [], onClose, onPosted }) {
  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-[300]">
      <div className="bg-white rounded-[40px] w-full max-w-[900px] h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
        <div className="p-6 flex items-center sticky top-0 bg-white z-20 border-b border-black/5">
          <button onClick={onClose} className="p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="h-72 w-full relative">
            <img src={shop.image} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
              <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{shop.name}</h2>
              {shop.score && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComputation(shop);
                  }}
                  className="bg-[#1D1D1F] text-white px-5 py-3 rounded-2xl flex flex-col items-center gap-0.5 border border-white/10 hover:bg-black transition-all hover:scale-105 active:scale-95 group shadow-xl"
                >
                  <span className="text-[10px] font-bold text-white/50 lowercase leading-none group-hover:text-white/80 transition-colors">Match Score</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black leading-none">{(shop.score * 100).toFixed(0)}%</span>
                    <Info className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-12">
            <div className="space-y-4">
              <div className="bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.03] flex items-center gap-6 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md shrink-0"><MapPin className="w-6 h-6 text-[#014421]" /></div>
                <div className="flex-1"><p className="text-sm font-black text-[#1D1D1F] tracking-tight leading-tight">{shop.address}</p></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 shadow-sm">
                  <DollarSign className="w-5 h-5 text-[#7B1113]" />
                  <span className="text-xs font-black text-[#1D1D1F]">₱{shop.price}/kg</span>
                </div>
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 shadow-sm">
                  <Timer className="w-5 h-5 text-[#7B1113]" />
                  <span className="text-xs font-black text-[#1D1D1F]">{shop.turnaroundTime} hr</span>
                </div>
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-[#228B22]" />
                  <span className="text-[9px] font-black text-[#228B22] tracking-widest">Verified</span>
                </div>
              </div>
            </div>

            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`, "_blank")} className="w-full py-5 bg-[#1D1D1F] text-white rounded-[24px] font-black text-[10px] capitalize tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#014421] transition-all shadow-xl shadow-black/10"><Navigation2 className="w-4 h-4 fill-white" /> Access navigation</button>



            <div className="h-px bg-black/5" />

            <div className="space-y-10">
              <div className="flex items-start justify-between gap-12">
                <div className="space-y-1">
                  <h2 className="text-6xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shop.rating}</h2>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.floor(shop.rating) ? "fill-[#FFB017] text-[#FFB017]" : "text-[#FFB017] opacity-20"}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-[#8E8E93] tracking-tight whitespace-nowrap">({reviews.length} reviews)</p>
                </div>
                <div className="flex-1 space-y-2.5 pt-2">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-[#1D1D1F] w-2">{n}</span>
                      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-[#FFB017] rounded-full" style={{ width: `${n === 5 ? 85 : n === 4 ? 60 : n === 3 ? 15 : 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-sm font-bold text-[#8E8E93] text-center py-6">No reviews yet. Be the first to review!</p>
                ) : reviews.map(r => (
                  <div key={r._id || r.id} className="space-y-2 pb-6 border-b border-black/[0.04] last:border-0 animate-fadeUp">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#1D1D1F]">{r.reviewerName || r.user || 'Anonymous'}</span>
                      <div className="flex items-center gap-1.5 border border-[#FFB017] px-3 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-[#FFB017] text-[#FFB017]" />
                        <span className="text-[10px] font-black text-[#FFB017]">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#555] leading-relaxed tracking-tight">{r.comment}</p>
                    {r.createdAt && (
                      <span className="text-[10px] font-bold text-[#8E8E93]">
                        {new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-black/5" />
            <ReviewForm shopId={shop._id || shop.id} onPosted={onPosted} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComputationDetailsModal({ shop, weights, onClose }) {
  const getExplanation = (detail) => {
    const { criterion, rating, actualValue, isBenefit } = detail;
    const labels = {
      price: 'Price',
      turnaroundTime: 'Turnaround Time',
      rating: 'Rating',
      distance: 'Location'
    };

    const percentage = Math.round(rating * 100);
    let quality = '';
    if (percentage > 80) quality = 'Excellent';
    else if (percentage > 60) quality = 'Very Good';
    else if (percentage > 40) quality = 'Good';
    else quality = 'Average';

    const desc = isBenefit
      ? `Higher is better. This shop's ${labels[criterion]} of ${actualValue} ranks as "${quality}" compared to others.`
      : `Lower is better. This shop's ${labels[criterion]} of ${actualValue} ranks as "${quality}" compared to others.`;

    return { label: labels[criterion], quality, percentage, desc };
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-[400] backdrop-blur-md">
      <div className="bg-white rounded-[48px] w-full max-w-[1400px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] animate-scaleIn flex flex-col overflow-hidden border border-black/5 font-outfit">
        <div className="p-10 border-b border-black/[0.03] flex items-center justify-between bg-gradient-to-r from-white to-[#F8F9FA]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#014421] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Analysis</div>
              <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">How we calculated your match</p>
            </div>
            <h3 className="text-4xl font-black text-[#1D1D1F] tracking-tighter">Ranking Breakdown: <span className="text-[#014421]">{shop.name}</span></h3>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-black transition-all shadow-xl gap-2 px-8"><ArrowLeft className="w-5 h-5 shrink-0" /> <span className="text-[10px] font-black uppercase tracking-widest">Back</span></button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Simple Explanation Side */}
            <div className="space-y-8">
              <div className="bg-[#014421] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest">Overall Match Score</p>
                    <h4 className="text-6xl font-[900] tracking-tighter">{(shop.score * 100).toFixed(1)}%</h4>
                  </div>
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                    <Target className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <p className="mt-6 text-white/70 text-sm font-medium leading-relaxed">
                  This score tells you how close this shop is to your "Perfect Match" based on your priorities.
                  100% would be a shop that has the best price, best rating, shortest wait, and is closest to you.
                </p>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-black text-[#1D1D1F] uppercase tracking-widest px-2">Better for You?</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-6 rounded-[32px] border border-green-100 space-y-2">
                    <div className="flex items-center gap-2 text-[#014421]">
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Pros</span>
                    </div>
                    <p className="text-xs font-bold text-[#014421]/70">Higher scores here mean this shop excels in these areas compared to others.</p>
                  </div>
                  <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 space-y-2">
                    <div className="flex items-center gap-2 text-[#7B1113]">
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Cons</span>
                    </div>
                    <p className="text-xs font-bold text-[#7B1113]/70">Lower scores suggest there might be better options if this factor is vital.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Side */}
            <div className="space-y-4">
              <h5 className="text-sm font-black text-[#1D1D1F] uppercase tracking-widest px-2">Criterion Performance</h5>
              <div className="space-y-4">
                {shop.details?.map((detail) => {
                  const info = getExplanation(detail);
                  const Icon = detail.criterion === 'price' ? DollarSign :
                    detail.criterion === 'turnaroundTime' ? Timer :
                      detail.criterion === 'rating' ? Star : MapPin;

                  return (
                    <div key={detail.criterion} className="bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.03] hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <Icon className={`w-6 h-6 ${info.percentage > 50 ? 'text-[#014421]' : 'text-[#7B1113]'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1D1D1F]">{info.label}</p>
                            <p className="text-[10px] font-bold text-[#8E8E93]">{detail.actualValue} {detail.criterion === 'price' ? '/kg' : detail.criterion === 'turnaroundTime' ? 'hrs' : detail.criterion === 'distance' ? 'km' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black ${info.percentage > 70 ? 'text-[#014421]' : info.percentage > 40 ? 'text-orange-500' : 'text-[#7B1113]'}`}>
                            {info.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${info.percentage > 70 ? 'bg-[#014421]' : info.percentage > 40 ? 'bg-orange-500' : 'bg-[#7B1113]'}`}
                            style={{ width: `${info.percentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-medium text-[#8E8E93] leading-relaxed italic">
                          {info.desc} Your priority weight: <span className="font-bold text-[#1D1D1F]">{(detail.weight * 100).toFixed(0)}%</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Haversine distance calculation (km)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export default function ShopsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarTab, setSidebarTab] = useState("overview");
  const [selectedShop, setSelectedShop] = useState(null);
  const [weights, setWeights] = useState({ rating: 4, price: 30, time: 24, distance: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSelection, setMapSelection] = useState(null);
  const [priorities, setPriorities] = useState(['rating', 'price', 'time', 'distance']);
  const [dragIndex, setDragIndex] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [showComputation, setShowComputation] = useState(null);
  const [showAllNearby, setShowAllNearby] = useState(false);
  const [shops, setShops] = useState(initialShops);
  const [shopReviews, setShopReviews] = useState({});

  // Fetch shops from backend on mount; fallback to mock data if API unavailable
  useEffect(() => {
    api.get("/shops")
      .then(({ data }) => {
        if (data) {
          const mapped = data.map(s => ({
            ...s,
            id: s._id,
            distance: calcDistance(USER_LOCATION[0], USER_LOCATION[1], s.latitude || 14.167, s.longitude || 121.241),
            image: s.image || DEFAULT_SHOP_IMAGE,
          }));
          setShops(mapped);
        }
      })
      .catch(() => console.log("API unavailable – using mock shop data"));
  }, []);

  // Fetch reviews whenever a shop modal opens
  const handleSelectShop = (shop) => {
    setSelectedShop(shop);
    const shopId = shop._id || shop.id;
    api.get(`/reviews/${shopId}`)
      .then(({ data }) => setShopReviews(prev => ({ ...prev, [shopId]: data })))
      .catch(() => { });
  };

  // Post a new review then refresh
  const handlePostReview = async (shopId, payload) => {
    try {
      await api.post("/reviews", { ...payload, shopId });

      // Refresh reviews list for the modal
      const { data: updatedReviews } = await api.get(`/reviews/${shopId}`);
      setShopReviews(prev => ({ ...prev, [shopId]: updatedReviews }));

      // Also refresh shop data (rating and reviewCount) from backend
      const { data: updatedShop } = await api.get(`/shops/${shopId}`);
      if (updatedShop) {
        setShops(prevShops =>
          prevShops.map(s => (s.id === shopId || s._id === shopId)
            ? { ...s, rating: updatedShop.rating, reviewCount: updatedShop.reviewCount }
            : s)
        );
        // If modal is open, we need to update its local copy too via setSelectedShop
        setSelectedShop(prev => prev ? { ...prev, rating: updatedShop.rating, reviewCount: updatedShop.reviewCount } : null);
      }
    } catch (err) {
      console.error("Failed to post review:", err.message);
    }
  };

  const CRITERIA_LIMITS = {
    price: 100,
    time: 72,
    rating: 5,
    distance: 50
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const onDragStart = (index) => setDragIndex(index);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const newPriorities = [...priorities];
    const item = newPriorities.splice(dragIndex, 1)[0];
    newPriorities.splice(index, 0, item);
    setPriorities(newPriorities);
    // Weight ranges are independent — dragging priorities does NOT change them
    setDragIndex(null);
  };

  const rankedShops = useMemo(() => {
    const scores = calculateTopsis(shops, weights, priorities);
    return shops.map(shop => {
      const scoreData = scores.find(s => s.id === shop.id);
      return {
        ...shop,
        score: scoreData?.score ?? 0,
        details: scoreData?.details ?? []
      };
    }).sort((a, b) => b.score - a.score);
  }, [weights, shops]);

  const nearbyShops = useMemo(() => [...shops].sort((a, b) => a.distance - b.distance).slice(0, 3), [shops]);
  const top3 = useMemo(() => rankedShops.slice(0, 3), [rankedShops]);

  const filteredShops = useMemo(() =>
    rankedShops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.address.toLowerCase().includes(searchQuery.toLowerCase())),
    [rankedShops, searchQuery]
  );

  return (
    <div className="flex bg-gradient-to-br from-[#F1F4F2] to-[#E8EEEB] min-h-screen text-[#1D1D1F] font-outfit overflow-hidden">
      <aside className="w-72 bg-[#FAFAF7] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-[#014421] rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#014421]/20">E</div>
          <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter font-outfit">ELaBada</span>
        </div>

        <nav className="flex-1 space-y-3">

          <button onClick={() => setSidebarTab("overview")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-sm font-black transition-all relative group ${sidebarTab === "overview" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421]/60 hover:bg-[#014421]/5"}`}>
            <LayoutDashboard className={`w-5 h-5 ${sidebarTab === "overview" ? "text-white" : "text-[#014421]/40"}`} />
            Overview
          </button>

          <button onClick={() => setSidebarTab("map")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-sm font-black transition-all relative group ${sidebarTab === "map" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421]/60 hover:bg-[#014421]/5"}`}>
            <MapIcon className={`w-5 h-5 ${sidebarTab === "map" ? "text-white" : "text-[#014421]/40"}`} />
            Location
          </button>

          <button onClick={() => setSidebarTab("computation")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-sm font-black transition-all relative group ${sidebarTab === "computation" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421]/60 hover:bg-[#014421]/5"}`}>
            <BarChart3 className={`w-5 h-5 ${sidebarTab === "computation" ? "text-white" : "text-[#014421]/40"}`} />
            Computation
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-[#F3F4F6]">
          <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl text-[#7B1113] hover:bg-[#7B1113]/[0.03] transition-all flex items-center gap-4 text-sm font-black">
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* ── FIXED OVERVIEW HEADER (welcome + search + quick-access buttons) ── */}
        {sidebarTab === "overview" && (
          <div className="px-10 pt-10 pb-3 shrink-0">
            <div className="flex items-center gap-8">
              <div className="flex-1 bg-[#0D3A2C] rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="relative z-10">
                  <h2 className="text-6xl font-black tracking-tighter leading-none font-outfit">Welcome, {user?.name?.split(' ')[0] || 'Maria'}</h2>
                </div>
                <div className="relative z-10 self-end w-full max-w-xl mt-8">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8E8E93]"><Search className="w-6 h-6" /></div>
                  <input
                    type="text"
                    placeholder="Search Shops"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 bg-white rounded-[24px] border border-black/[0.05] pl-16 pr-6 text-sm font-bold shadow-xl focus:ring-4 focus:ring-[#014421]/10 transition-all outline-none placeholder:text-[#8E8E93] text-[#1D1D1F]"
                  />
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={() => setSidebarTab("computation")} className="w-20 h-20 rounded-[32px] bg-[#7B1113] shadow-lg flex items-center justify-center group transition-all hover:scale-105 hover:-translate-y-1">
                  <Sliders className="w-8 h-8 text-white transition-all" />
                </button>
                <button onClick={() => setSidebarTab("map")} className="w-20 h-20 rounded-[32px] bg-[#FF8C00] shadow-lg flex items-center justify-center group transition-all hover:scale-105 hover:-translate-y-1">
                  <LocateFixed className="w-8 h-8 text-white transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCROLLABLE CONTENT (shops grid / computation) ── */}
        <div className={`flex-1 overflow-y-auto no-scrollbar animate-fadeUp ${sidebarTab === "overview" ? "px-10 pb-10 pt-3" : "p-10"}`}>

          {sidebarTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-4xl font-bold text-[#1D1D1F] tracking-tighter font-outfit">Laundry Shops</h3>
                  <p className="text-[11px] font-medium text-[#8E8E93] tracking-tight">{filteredShops.length} shops found</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pb-12">
                {filteredShops.map(s => (
                  <div
                    key={s.id}
                    onClick={() => s.status === 'open' && handleSelectShop(s)}
                    className={`bg-white rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm transition-all overflow-hidden p-4 ${s.status === 'open' ? 'hover:shadow-xl cursor-pointer group' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}`}
                  >
                    <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-5">
                      <img src={s.image} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt="" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'open' ? 'bg-[#228B22]' : 'bg-[#8E8E93]'}`} />
                        <span className={`text-[9px] font-black capitalize tracking-widest ${s.status === 'open' ? 'text-[#228B22]' : 'text-[#8E8E93]'}`}>{s.status}</span>
                      </div>
                      {s.score > 0 && (
                        <div
                          onClick={(e) => { e.stopPropagation(); setShowComputation(s); }}
                          className="absolute bottom-3 right-3 bg-[#014421] text-white px-3 py-2 rounded-xl border border-white/20 shadow-lg flex flex-col items-center hover:scale-110 active:scale-95 transition-all cursor-help group/score"
                        >
                          <span className="text-[7px] font-black uppercase text-white/50 leading-none group-hover/score:text-white/80">Match</span>
                          <span className="text-sm font-black leading-none mt-0.5">{(s.score * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="px-1 space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{s.name}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
                          <span className="text-xs font-black text-[#1D1D1F]">{s.rating}</span>
                          <span className="text-xs font-bold text-[#8E8E93]">({s.reviewCount})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#8E8E93]">
                        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <p className="text-[11px] font-bold truncate">{s.address}</p>
                      </div>
                      <div className="flex items-center gap-4 py-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#014421] opacity-60" />
                          <span className="text-[10px] font-black text-[#1D1D1F] lowercase">{s.turnaroundTime} hr</span>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-black/[0.03]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#8E8E93] capitalize tracking-wider">Price</span>
                          <span className="text-lg font-[900] text-[#7B1113] tracking-tighter font-outfit leading-none">₱{s.price}<span className="text-xs font-bold text-[#8E8E93]/60 lowercase ml-0.5">/kg</span></span>
                        </div>
                        <button
                          disabled={s.status !== 'open'}
                          onClick={(e) => { e.stopPropagation(); s.status === 'open' && handleSelectShop(s); }}
                          className={`px-5 py-3 rounded-full text-[10px] font-bold capitalize tracking-wider transition-all shadow-lg shadow-black/10 flex items-center justify-center ${s.status === 'open' ? 'bg-[#1D1D1F] text-white' : 'bg-[#8E8E93]/20 text-[#8E8E93] cursor-not-allowed'}`}
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sidebarTab === "computation" && (
            <div className="max-w-[1700px] mx-auto animate-fadeUp py-8 px-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                <div className="xl:col-span-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                    <div className="bg-white rounded-[64px] border border-black/[0.03] shadow-2xl p-14 flex flex-col space-y-12">
                      <div className="space-y-1.5">
                        <h3 className="text-4xl font-[900] text-[#1D1D1F] tracking-tighter capitalize font-outfit leading-none">Rank your priorities</h3>
                        <p className="text-xs font-bold text-[#8E8E93] capitalize tracking-widest mt-2">Hold and drag items to reorder</p>
                      </div>
                      <div className="space-y-5">
                        {priorities.map((key, index) => (
                          <div key={key} draggable onDragStart={() => onDragStart(index)} onDragOver={onDragOver} onDrop={() => { onDrop(index); setIsApplied(false); }} className="flex items-center justify-between gap-6 bg-[#F8F9FA] p-5 rounded-[36px] border border-black/[0.01] group transition-all hover:bg-white hover:shadow-2xl cursor-grab active:cursor-grabbing border-l-[6px] border-l-transparent hover:border-l-[#014421]">
                            <div className="flex-1 min-w-0">
                              <p className="text-xl font-[900] text-[#1D1D1F] tracking-tighter font-outfit leading-none whitespace-normal">
                                {key === 'price' ? (<>Price <span className="font-medium text-xs text-[#8E8E93]">(per kg)</span></>) :
                                  key === 'time' ? 'Turnaround Time' :
                                    key === 'rating' ? 'Rating' :
                                      key === 'distance' ? (<>Distance <span className="font-medium text-xs text-[#8E8E93]">(km)</span></>) : key}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#8E8E93] group-hover:text-[#014421] transition-all group-active:scale-95 border border-black/[0.03] shrink-0">
                              <GripVertical className="w-6 h-6" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-14 rounded-[64px] border border-black/[0.03] shadow-2xl relative overflow-hidden flex flex-col space-y-12">
                      <h3 className="text-4xl font-[900] text-[#1D1D1F] tracking-tighter capitalize font-outfit leading-none">Weight ranges</h3>
                      <div className="space-y-10 relative z-10">
                        {Object.entries(weights).map(([key, val]) => (
                          <div key={key} className="space-y-5">
                            <div className="flex justify-between items-end gap-3">
                              <p className="text-xl font-black text-[#1D1D1F] tracking-tighter font-outfit whitespace-nowrap">
                                {key === 'price' ? (<>Price <span className="font-medium normal-case text-xs text-[#8E8E93]">(kg)</span></>) :
                                  key === 'time' ? 'Time' :
                                    key === 'rating' ? 'Rating' :
                                      key === 'distance' ? (<>Distance <span className="font-medium normal-case text-xs text-[#8E8E93]">(km)</span></>) : key}
                              </p>
                              <span className="text-lg font-black text-[#014421] leading-none">{val}</span>
                            </div>
                            <div className="relative h-2.5 flex items-center group">
                              <div className="absolute inset-x-0 h-full bg-[#1D1D1F]/5 rounded-full overflow-hidden"><div className="h-full bg-[#014421] transition-all" style={{ width: `${(val / CRITERIA_LIMITS[key]) * 100}%` }} /></div>
                              <input type="range" min="1" max={CRITERIA_LIMITS[key]} step={key === 'rating' ? 0.1 : 1} value={val} onChange={(e) => { setWeights({ ...weights, [key]: parseFloat(e.target.value) }); setIsApplied(false); }} className="relative w-full h-full bg-transparent appearance-none cursor-pointer z-10 opacity-0 group-hover:opacity-10" />
                              <div className="absolute w-6 h-6 bg-white rounded-full shadow-xl border-[3px] border-[#014421] pointer-events-none transition-all" style={{ left: `calc(${(val / CRITERIA_LIMITS[key]) * 100}% - 12px)` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-8 border-t border-black/[0.03] relative z-10">
                        <button onClick={() => setIsApplied(true)} className="w-full py-6 bg-[#014421] text-white rounded-[36px] font-medium text-xs capitalize tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#1D1D1F] transition-all shadow-2xl shadow-[#014421]/30 group active:scale-[0.98]">Apply</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xl:col-span-4 min-h-[500px]">
                  {shops.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-black/[0.02] rounded-[48px] border-2 border-dashed border-black/[0.08]">
                      <Store className="w-10 h-10 text-[#8E8E93]/40 mb-4" />
                      <p className="text-[11px] font-bold text-[#8E8E93] max-w-[220px] leading-relaxed">No shops available yet in the system.</p>
                    </div>
                  ) : isApplied ? (
                    <div className="space-y-10 animate-fadeUp">
                      <h3 className="text-3xl font-bold text-[#1D1D1F] tracking-tighter font-outfit">Recommended shops for you</h3>
                      <p className="text-[11px] font-medium text-[#8E8E93] tracking-widest leading-relaxed">Based on your priorities</p>
                      <div className="flex flex-col gap-5">
                        {top3.map((s, i) => (
                          <div key={s.id} onClick={() => { if (s.status === 'open') setShowComputation(s); }} className={`bg-white p-6 rounded-[40px] border border-black/[0.04] shadow-xl transition-all relative overflow-hidden flex flex-col gap-6 ${s.status === 'open' ? 'hover:shadow-2xl cursor-pointer group' : 'opacity-40 cursor-not-allowed grayscale'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="relative shrink-0 flex items-center justify-center w-16">
                                <span className="text-5xl font-[950] text-[#7B1113] font-outfit leading-none select-none">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xl font-[950] text-[#1D1D1F] tracking-tight capitalize font-outfit truncate group-hover:text-[#014421] transition-colors">{s.name}</h4>
                                <div className="flex items-center gap-2 text-[#8E8E93] mt-1">
                                  <MapPin className="w-4 h-4 opacity-60" />
                                  <p className="text-[10px] font-bold capitalize truncate">{s.address}</p>
                                </div>
                              </div>
                              <p className="text-2xl font-[950] text-[#014421] font-outfit shrink-0 tracking-tighter">{(s.score * 100).toFixed(0)}%</p>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
                              <div className="flex items-center gap-2">
                                {s.status !== 'open' && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8E8E93]/10 rounded-full">
                                    <XCircle className="w-3 h-3 text-[#8E8E93]" />
                                    <span className="text-[9px] font-bold text-[#8E8E93] tracking-wider">Currently closed</span>
                                  </div>
                                )}
                              </div>
                              {s.status === 'open' && (
                                <div className="flex items-center gap-1.5 text-white bg-[#1D1D1F] px-5 py-2.5 rounded-full text-[9px] font-bold capitalize tracking-wider shadow-lg transition-all active:scale-95">
                                  View details <ChevronRight className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-black/[0.02] rounded-[48px] border-2 border-dashed border-black/[0.08]">
                      <Target className="w-10 h-10 text-[#8E8E93]/40 mb-4" />
                      <p className="text-[11px] font-bold text-[#8E8E93] max-w-[220px] leading-relaxed">Adjust your rankings and click Apply to see top shops recommendations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FULL-SCREEN MAP OVERLAY (covers sidebar + main) ── */}
        {sidebarTab === "map" && (
          <div className="absolute inset-0 z-30 flex flex-col bg-gradient-to-br from-[#F1F4F2] to-[#E8EEEB] animate-fadeUp">
            {/* Top bar */}
            <div className="h-20 px-10 flex items-center gap-6 bg-white/90 backdrop-blur-2xl border-b border-black/[0.05] shrink-0 shadow-sm">
              <button
                onClick={() => setSidebarTab("overview")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F8F9FA] text-sm font-black text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white transition-all shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tighter">Laundry Shops in Los Baños</h2>
              <div className="ml-auto relative w-80">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#014421] opacity-40"><Search className="w-4 h-4" /></div>
                <input
                  type="text"
                  placeholder="Search by name or street..."
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  className="w-full h-11 bg-[#F8F9FA] rounded-[20px] border border-black/[0.04] pl-12 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#014421] transition-all outline-none placeholder:text-[#8E8E93]"
                />
              </div>
            </div>

            {/* Map + side panel */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
                {/* Map */}
                <div className="xl:col-span-3 bg-white rounded-[40px] overflow-hidden border border-black/[0.04] shadow-xl relative flex flex-col">
                  <div className="flex-1 relative bg-[#E8EAED]">
                    <MapContainer center={[14.167, 121.241]} zoom={15} className="w-full h-full z-0 overflow-hidden">
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                      <Marker position={USER_LOCATION} icon={createUserLocationIcon()}>
                        <Popup className="font-outfit"><p className="text-[10px] font-black uppercase">Your Location</p></Popup>
                      </Marker>
                      {rankedShops.filter(s => s.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) || s.address.toLowerCase().includes(mapSearchQuery.toLowerCase())).map((s, i) => (
                        <Marker key={s.id} position={[s.latitude, s.longitude]} icon={createShopMarkerIcon(i + 1, s.name)} eventHandlers={{ click: () => setMapSelection({ ...s, index: i + 1 }) }}>
                          <Popup className="font-outfit">
                            <div className="p-2 space-y-2">
                              <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Rank #0{i + 1}</p>
                              <h4 className="text-sm font-black text-[#1D1D1F] uppercase">{s.name}</h4>
                              <button onClick={() => setSelectedShop(s)} className="w-full py-2 bg-[#014421] text-white rounded-lg text-[9px] font-black capitalize tracking-widest hover:bg-[#014421]/90 transition-all">View details</button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </div>

                {/* Side panel - nearby shops */}
                <div className="bg-white rounded-[40px] border border-black/[0.04] shadow-xl flex flex-col overflow-hidden">
                  <div className="p-6 pb-4 border-b border-black/[0.03] bg-white/50 backdrop-blur-xl">
                    <h3 className="text-xl font-black text-[#014421] tracking-tighter capitalize font-outfit">Top Nearby Shops</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
                    {(showAllNearby
                      ? rankedShops.filter(s => s.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) || s.address.toLowerCase().includes(mapSearchQuery.toLowerCase()))
                      : rankedShops.filter(s => s.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) || s.address.toLowerCase().includes(mapSearchQuery.toLowerCase())).slice(0, 3)
                    ).map((s, i) => {
                      const isTop3 = i < 3;
                      return (
                        <div key={s.id} onClick={() => setSelectedShop(s)} className={`bg-white rounded-[24px] flex items-center justify-between border border-black/[0.03] transition-all p-4 hover:shadow-md cursor-pointer group ${s.status === 'open' ? '' : 'opacity-80 grayscale-[0.3]'}`}>
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black font-outfit shrink-0 ${isTop3 ? 'bg-[#FF8C00]/10 text-[#FF8C00]' : 'bg-[#1D1D1F]/5 text-[#1D1D1F]/40'}`}>{i + 1}</div>
                            <div className="flex flex-col min-w-0">
                              <h4 className="text-sm font-black text-[#1D1D1F] tracking-tight capitalize leading-none truncate font-outfit">{s.name}</h4>
                              <p className="text-[10px] font-bold text-[#8E8E93] truncate mt-1">{s.address}</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${s.status === 'open' ? 'bg-[#F8F9FA] group-hover:bg-[#1D1D1F] group-hover:text-white' : 'bg-transparent text-[#8E8E93]/20'}`}>
                            {s.status === 'open' ? <ChevronRight className="w-4 h-4" /> : <X className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                    {rankedShops.filter(s => s.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) || s.address.toLowerCase().includes(mapSearchQuery.toLowerCase())).length > 3 && (
                      <button onClick={() => setShowAllNearby(!showAllNearby)} className="w-full mt-1 py-3 bg-[#014421]/5 text-[#014421] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#014421]/10 transition-all border border-[#014421]/10">
                        {showAllNearby ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedShop && <ShopDetailModal shop={selectedShop} reviews={shopReviews[selectedShop._id || selectedShop.id] || []} onClose={() => setSelectedShop(null)} onPosted={handlePostReview} />}
      {showComputation && <ComputationDetailsModal shop={showComputation} weights={weights} onClose={() => setShowComputation(null)} />}
    </div>
  );
}

function TrendingUp(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>; }
