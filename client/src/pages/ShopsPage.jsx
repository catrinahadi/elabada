import { useState, useMemo, useEffect, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calculateTopsis } from "../utils/topsis";
import {
  Star, MapPin, Search, Filter, Map as MapIcon,
  Clock, Package, Check, ChevronRight,
  X, Info, MessageSquare, ArrowUpRight, Award,
  Droplets, Zap, ThumbsUp, DollarSign, LayoutGrid, List,
  ArrowUp, ArrowDown, Map as GoogleMap,
  MoreHorizontal, Heart, ArrowLeft, MoreVertical, LocateFixed, Camera,
  LayoutDashboard, LogOut, Settings, BarChart3, Sliders, Navigation, Navigation2, Plus, Trash2,
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer, Circle, ChevronDown
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

const DEFAULT_LOCATION = [14.1670, 121.2435];

// Custom Icons for Map
const createUserLocationIcon = () => L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative w-14 h-14 flex items-center justify-center">
    <div class="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
    <div class="absolute w-7 h-7 bg-blue-500 rounded-full border-[3px] border-white shadow-2xl"></div>
  </div>`,
  iconSize: [56, 56],
  iconAnchor: [28, 28]
});

const createShopMarkerIcon = (rank) => {
  const mainColor = "#FF8C00"; // Always orange

  return L.divIcon({
    className: 'custom-shop-marker',
    html: `<div class="flex flex-col items-center">
      <div class="relative transition-transform">
        <svg width="36" height="48" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${mainColor}"/>
          <circle cx="14" cy="14" r="5" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>`,
    iconSize: [36, 48],
    iconAnchor: [18, 48]
  });
};

function MapController({ routePath, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (routePath && routePath.length > 0) {
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
    } else {
      map.setView(userLocation, 15);
    }
  }, [routePath, map, userLocation]);
  return null;
}



const reviewCategories = [
  "Overall Service", "Cleanliness", "Folding Quality", "Fabric Care", "Smell/Fragrance"
];

function ReviewForm({ shopId, onPosted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!user) return (
    <div className="bg-white p-8 rounded-[40px] border border-black/[0.05] shadow-xl text-center space-y-3">
      <p className="text-[14px] font-normal text-[#1D1D1F]">Please login as a customer to write a review.</p>
    </div>
  );

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      alert("You can only upload up to 3 photos.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagClick = (tag) => {
    setComment(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (rating === 0) return alert("Please select a rating.");
    setSubmitting(true);
    try {
      console.log("Submitting review for shop:", shopId);
      await onPosted(shopId, { rating, comment, reviewerName: user?.name || "Verified Customer", images });
      setRating(0);
      setComment("");
      setImages([]);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to post review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="bg-white p-8 rounded-[40px] border border-black/[0.05] shadow-xl space-y-8">
        <div className="space-y-4 text-center">
          <h3 className="text-[14px] font-normal text-[#1D1D1F] tracking-tighter">Rate your experience</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-transform active:scale-95">
                <Star className={`w-10 h-10 ${s <= rating ? 'fill-[#E67E00] text-[#E67E00]' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[12px] font-normal text-[#1D1D1F] px-2">What did you like?</p>
          <div className="flex flex-wrap gap-2">
            {reviewCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleTagClick(cat)}
                className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-full text-[12px] font-normal border border-black/[0.02] hover:bg-[#E67E00]/10 hover:text-[#E67E00] hover:border-[#E67E00]/30 transition-all cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-40 bg-gray-50 rounded-[32px] p-6 text-[12px] font-medium outline-none border-2 border-transparent focus:border-[#E67E00]/20 focus:bg-white transition-all resize-none placeholder:text-gray-400"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-4 px-2">
          <p className="text-[12px] font-normal text-[#1D1D1F]">Add photos (max 3)</p>
          <div className="flex gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden group/img shadow-md border border-black/[0.03]">
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#E67E00] hover:text-[#E67E00] hover:bg-[#E67E00]/5 transition-all group"
              >
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full py-5 bg-[#014421] text-white rounded-xl text-[12px] font-normal tracking-widest hover:opacity-90 transition-all shadow-xl shadow-[#014421]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post Review"}
        </button>
      </div>
    </div>
  );
}

function ShopDetailModal({ shop, reviews = [], onClose, onPosted, onShowComputation, showMatchScore, onNavigate }) {
  const [filter, setFilter] = useState('All');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showForm]);

  const ratingCounts = [
    { stars: 5, percentage: 85 },
    { stars: 4, percentage: 65 },
    { stars: 3, percentage: 15 },
    { stars: 2, percentage: 10 },
    { stars: 1, percentage: 5 },
  ];

  const filteredReviews = useMemo(() => {
    if (filter === 'All') return reviews;
    return reviews.filter(r => r.rating.toString() === filter);
  }, [reviews, filter]);

  if (showAllReviews) {
    return (
      <div className="modal-overlay flex items-center justify-center p-4 z-[1000]">
        <div className="bg-white rounded-[40px] w-full max-w-[900px] h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
          <div className="p-6 flex flex-col gap-4 sticky top-0 bg-white z-20 border-b border-black/5">
            <button onClick={() => setShowAllReviews(false)} className="w-fit p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all group">
              <ArrowLeft className="w-6 h-6 text-[#1D1D1F] group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center justify-between px-2.5">
              <h3 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight">All reviews</h3>
              <div className="flex flex-wrap items-center gap-2">
                {['All', '5', '4', '3', '2', '1'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-normal transition-all ${filter === val
                      ? 'bg-[#E67E00] text-white shadow-lg shadow-[#E67E00]/20'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    {val === 'All' ? 'All' : `${val} Stars`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-gray-400 text-[16px] font-bold">No reviews found.</p>
                <p className="text-gray-300 text-[13px]">Try changing the rating filter.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredReviews.map((r, i) => (
                  <div key={r._id || r.id} className="bg-white p-6 rounded-[28px] border border-black/[0.03] shadow-sm space-y-4 animate-fadeUp">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF8C00] font-black border-2 border-white shadow-sm">
                          {r.reviewerName?.[0] || r.user?.[0] || 'A'}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-[12px] font-normal text-[#1D1D1F] leading-none">{r.reviewerName || r.user || 'Anonymous'}</h5>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-50 text-[#E67E00] rounded-full border border-orange-100">
                        <Star className="w-3.5 h-3.5 fill-[#E67E00]" />
                        <span className="text-[12px] font-black leading-none">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-[12px] font-normal text-gray-600 leading-relaxed pl-16">
                      {r.comment}
                    </p>
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-3 pl-16 mt-2">
                        {r.images.map((img, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-black/[0.03]">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-[40px] w-full max-w-[900px] h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
        <div className="p-6 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-black/5">
          <button onClick={onClose} className="p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all">
            <ArrowLeft className="w-6 h-6 text-[#1D1D1F]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="h-72 w-full relative">
            <img src={shop.image} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
              <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{shop.name}</h2>
              {showMatchScore && shop.score && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowComputation(shop); }}
                  className="bg-[#1D1D1F]/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl flex flex-col items-center gap-0.5 border border-white/10 hover:bg-black transition-all hover:scale-105 shadow-2xl"
                >
                  <span className="text-[12px] font-bold text-white/50 leading-none">Match score</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-normal leading-none">{(shop.score * 100).toFixed(0)}%</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-12 pb-24">
            <div className="space-y-4">
              <div className="bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.03] flex items-center gap-6">
                <div className="flex-1"><p className="text-[12px] font-medium text-[#1D1D1F] tracking-tight leading-tight">{shop.address}</p></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-[12px] font-medium text-gray-400 tracking-tight">Price</span>
                  <span className="text-[12px] font-normal text-[#1D1D1F]">₱{shop.price}/kg</span>
                </div>
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-[12px] font-medium text-gray-400 tracking-tight">Turnaround time</span>
                  <span className="text-[12px] font-normal text-[#1D1D1F]">{shop.turnaroundTime} hr</span>
                </div>
                <div className="bg-[#F8F9FA] p-5 rounded-[28px] border border-black/[0.03] flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-[12px] font-medium text-gray-400 tracking-tight">Location</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[12px] font-normal text-[#1D1D1F]">{(shop.distance || 0).toFixed(1)} km</span>
                  </div>
                </div>
              </div>

              <button onClick={() => onNavigate(shop)} className="w-full py-5 bg-[#1D1D1F] text-white rounded-[24px] font-normal text-[12px] capitalize tracking-widest flex items-center justify-center gap-3 hover:bg-[#014421] transition-all shadow-xl shadow-[#1D1D1F]/20 active:scale-[0.98]">
                <Navigation2 className="w-4 h-4 fill-white" /> Access navigation
              </button>
            </div>

            <div className="space-y-10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-normal text-[#1D1D1F] tracking-tighter leading-none">Ratings & Reviews</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <div className="bg-[#F8F9FA] p-7 rounded-[32px] border border-black/[0.02] shadow-sm space-y-6 relative h-fit">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-normal text-[#1D1D1F] tracking-tight">Customer Feedback</span>
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="flex items-center gap-1.5 text-[12px] font-normal text-gray-400 hover:translate-x-0.5 transition-all group"
                    >
                      Read all <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <p className="text-gray-400 text-[14px] font-bold">No reviews found.</p>
                      <p className="text-gray-300 text-[11px]">Be the first to leave a review!</p>
                    </div>
                  ) : (
                    <div className="space-y-6 flex flex-col">
                      {filteredReviews.slice(0, 2).map((r) => (
                        <div key={r._id || r.id} className="bg-white p-6 rounded-[24px] border border-black/[0.03] shadow-md space-y-4 animate-fadeUp">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#014421] font-black border-2 border-white shadow-sm text-xs">
                                {r.reviewerName?.[0] || r.user?.[0] || 'A'}
                              </div>
                              <div className="space-y-0.5">
                                <h5 className="text-[12px] font-normal text-[#1D1D1F] leading-none">{r.reviewerName || r.user || 'Anonymous'}</h5>
                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#E67E00] rounded-full border border-orange-100">
                              <Star className="w-3.5 h-3.5 fill-[#E67E00]" />
                              <span className="text-[12px] font-black leading-none">{r.rating}</span>
                            </div>
                          </div>
                          <p className="text-[12px] font-normal text-gray-600 leading-relaxed pl-13">
                            {r.comment}
                          </p>
                          {r.images && r.images.length > 0 && (
                            <div className="flex gap-3 pl-13 mt-2">
                              {r.images.map((img, idx) => (
                                <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-black/[0.03]">
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Aggregate Rating Summary */}
                <div className="space-y-8 pt-7">
                  <div className="flex items-center gap-8">
                    <div className="text-center space-y-2">
                      <h4 className="text-7xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shop.rating || '0.0'}</h4>
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-5 h-5 ${s <= Math.floor(shop.rating) ? "fill-[#E67E00] text-[#E67E00]" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-[12px] font-normal text-gray-400">({reviews.length} reviews)</p>
                    </div>

                    <div className="flex-1 space-y-3">
                      {ratingCounts.map((rc) => (
                        <button
                          key={rc.stars}
                          onClick={() => setFilter(prev => prev === rc.stars.toString() ? 'All' : rc.stars.toString())}
                          className={`w-full flex items-center gap-4 px-4 py-1.5 rounded-xl transition-all group ${filter === rc.stars.toString() ? 'bg-[#E67E00]/10' : 'hover:bg-gray-50'}`}
                        >
                          <span className={`text-[12px] font-bold w-2 ${filter === rc.stars.toString() ? 'text-[#E67E00]' : 'text-gray-400 font-medium'}`}>{rc.stars}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${filter === rc.stars.toString() ? 'bg-[#E67E00]' : 'bg-[#E67E00]/60'}`} style={{ width: `${rc.percentage}%` }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="px-8 py-3 bg-[#014421] text-white rounded-xl text-[12px] font-normal transition-all shadow-lg shadow-[#014421]/20 active:scale-95 group flex items-center justify-center gap-2"
                    >
                      {showForm ? 'Cancel review' : 'Write a review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showForm && (
              <div ref={formRef} className="pt-12 border-t border-black/[0.04] animate-fadeUp">
                <ReviewForm
                  shopId={shop._id || shop.id}
                  onPosted={(id, payload) => {
                    onPosted(id, payload);
                    setShowForm(false);
                  }}
                />
              </div>
            )}
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
        <div className="p-10 border-b border-black/[0.03] flex flex-col items-start gap-8 bg-gradient-to-r from-white to-[#F8F9FA]">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-all group">
            <ArrowLeft className="w-8 h-8 text-[#1D1D1F]" />
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#014421] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Analysis</div>
              <p className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-[0.3em]">How we calculated your match</p>
            </div>
            <h3 className="text-4xl font-black text-[#1D1D1F] tracking-tighter">Ranking breakdown: <span className="text-[#014421]">{shop.name}</span></h3>
          </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Simple Explanation Side */}
            <div className="space-y-8">
              <div className="bg-[#014421] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest">Overall Match Score</p>
                    <h4 className="text-6xl font-normal tracking-tighter">{(shop.score * 100).toFixed(1)}%</h4>
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
                            <p className="text-[10px] font-bold text-[#1D1D1F]">{detail.actualValue} {detail.criterion === 'price' ? '/kg' : detail.criterion === 'turnaroundTime' ? 'hrs' : detail.criterion === 'distance' ? 'km' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-normal ${info.percentage > 70 ? 'text-[#014421]' : info.percentage > 40 ? 'text-orange-500' : 'text-[#7B1113]'}`}>
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
                        <p className="text-[10px] font-medium text-[#1D1D1F] leading-relaxed italic">
                          {info.desc} Your priority weight: <span className="font-normal text-[#1D1D1F]">{(detail.weight * 100).toFixed(0)}%</span>
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

const getWalkTime = (km) => Math.round((km || 0) * 12);

export default function ShopsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarTab, setSidebarTab] = useState("overview");
  const [selectedShop, setSelectedShop] = useState(null);
  // Automatic weights derived from drag order: rank 1=40%, 2=30%, 3=20%, 4=10%
  const POSITION_WEIGHTS = [0.40, 0.30, 0.20, 0.10];
  const [weights, setWeights] = useState({ price: 30, time: 24, distance: 10, rating: 4 });
  const [searchQuery, setSearchQuery] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSelection, setMapSelection] = useState(null);
  const [priorities, setPriorities] = useState(['price', 'time', 'distance', 'rating']);
  const [dragIndex, setDragIndex] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [showComputation, setShowComputation] = useState(null);
  const [showAllNearby, setShowAllNearby] = useState(false);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [shops, setShops] = useState(initialShops);
  const [shopReviews, setShopReviews] = useState({});
  const [activeRouteShopId, setActiveRouteShopId] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [showWeightManual, setShowWeightManual] = useState(false);
  const [showPriorityManual, setShowPriorityManual] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMapSuggestions, setShowMapSuggestions] = useState(false);

  // New Filter & Sort State
  const [activeSort, setActiveSort] = useState('topsis');
  const [filters, setFilters] = useState({
    rating: 0,
    price: 100,
    distance: 50,
    openNow: false
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);


  // Detect actual user location on mount
  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error detecting location:", error);
        }
      );
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  // Reset map states when changing tabs
  useEffect(() => {
    setActiveRouteShopId(null);
    setRoutePath([]);
  }, [sidebarTab]);

  // Fetch real road route using OSRM when a shop is selected for routing
  useEffect(() => {
    if (!activeRouteShopId) {
      setRoutePath([]);
      return;
    }

    const shop = shops.find(s => s.id === activeRouteShopId || s._id === activeRouteShopId);
    if (!shop) return;

    // OSRM expects [lng, lat]
    const userCoords = `${userLocation[1]},${userLocation[0]}`;
    const shopCoords = `${shop.longitude},${shop.latitude}`;

    fetch(`https://router.project-osrm.org/route/v1/driving/${userCoords};${shopCoords}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          // OSRM geojson is [lng, lat], Leaflet needs [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePath(coords);
        }
      })
      .catch(err => console.error("Routing error:", err));
  }, [activeRouteShopId, shops]);

  // Fetch shops from backend on mount; fallback to mock data if API unavailable
  useEffect(() => {
    api.get("/shops")
      .then(({ data }) => {
        if (data) {
          const mapped = data.map(s => ({
            ...s,
            id: s._id,
            image: s.image || DEFAULT_SHOP_IMAGE,
          }));
          setShops(mapped);
        }
      })
      .catch(() => console.log("API unavailable – using mock shop data"));
  }, []);

  // Fetch reviews whenever a shop modal opens
  const handleSelectShop = (shop) => {
    setShowComputation(null);
    setSelectedShop(shop);
    const shopId = shop._id || shop.id;
    if (shopId) {
      api.get(`/reviews/${shopId}`)
        .then(({ data }) => setShopReviews(prev => ({ ...prev, [shopId]: data })))
        .catch(() => { });
    }
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

  // Auto-weights from priority order combined with weight ranges
  const combinedWeights = useMemo(() => {
    const w = {};
    priorities.forEach((key, i) => {
      // Multiply the slider weight by the priority-based multiplier
      // This ensures both values influence the final decision
      w[key] = (weights[key] || 1) * POSITION_WEIGHTS[i];
    });
    return w;
  }, [priorities, weights]);

  const shopsWithDistance = useMemo(() => {
    return shops.map(s => ({
      ...s,
      distance: calcDistance(userLocation[0], userLocation[1], s.latitude || 14.1675, s.longitude || 121.2433)
    }));
  }, [shops, userLocation]);

  const rankedShops = useMemo(() => {
    const scores = calculateTopsis(shopsWithDistance, combinedWeights, priorities);
    return shopsWithDistance.map(shop => {
      const scoreData = scores.find(s => s.id === shop.id);
      return {
        ...shop,
        score: scoreData?.score ?? 0,
        details: scoreData?.details ?? []
      };
    }).sort((a, b) => b.score - a.score);
  }, [combinedWeights, shopsWithDistance, priorities]);

  const nearbyShops = useMemo(() => [...shopsWithDistance].sort((a, b) => a.distance - b.distance).slice(0, 3), [shopsWithDistance]);
  const top3 = useMemo(() => rankedShops.slice(0, 3), [rankedShops]);

  const filteredShops = useMemo(() => {
    let result = [...rankedShops];

    // Applying Filters
    if (filters.rating > 0) result = result.filter(s => s.rating >= filters.rating);
    if (filters.price < 100) result = result.filter(s => s.price <= filters.price);
    if (filters.distance < 50) result = result.filter(s => s.distance <= filters.distance);
    if (filters.openNow) result = result.filter(s => s.status === 'open');

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (activeSort) {
      case 'price': return result.sort((a, b) => a.price - b.price);
      case 'rating': return result.sort((a, b) => b.rating - a.rating);
      case 'distance': return result.sort((a, b) => a.distance - b.distance);
      case 'topsis': return result.sort((a, b) => b.score - a.score);
      default: return result;
    }
  }, [rankedShops, searchQuery, activeSort, filters]);

  // Suggestions logic
  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];
    return rankedShops.filter(s => s.name.toLowerCase().includes(query)).slice(0, 5);
  }, [rankedShops, searchQuery]);

  const mapSuggestions = useMemo(() => {
    const query = mapSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return rankedShops.filter(s => s.name.toLowerCase().includes(query)).slice(0, 5);
  }, [rankedShops, mapSearchQuery]);



  return (
    <div className="flex bg-gradient-to-br from-[#F1F4F2] to-[#E8EEEB] min-h-screen text-[#1D1D1F] font-outfit overflow-hidden">
      <aside className="w-[320px] min-w-[320px] bg-[#FAFAF7] border-r border-black/[0.05] flex flex-col p-8 sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-[#014421] rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#014421]/20">E</div>
          <span className="text-[#1D1D1F] font-black text-2xl tracking-tighter font-outfit">ELaBada</span>
        </div>

        <nav className="flex-1 space-y-3">

          <button onClick={() => setSidebarTab("overview")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "overview" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
            <LayoutDashboard className={`w-5 h-5 ${sidebarTab === "overview" ? "text-white" : "text-[#014421]"}`} />
            Overview
          </button>

          <button onClick={() => setSidebarTab("map")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "map" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
            <MapIcon className={`w-5 h-5 ${sidebarTab === "map" ? "text-white" : "text-[#014421]"}`} />
            Location
          </button>

          <button onClick={() => setSidebarTab("computation")} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "computation" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
            <BarChart3 className={`w-5 h-5 ${sidebarTab === "computation" ? "text-white" : "text-[#014421]"}`} />
            Computation
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-[#F3F4F6]">
          <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl text-[#7B1113] hover:bg-[#7B1113]/[0.03] transition-all flex items-center gap-4 text-[14px] font-normal">
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* ── FIXED OVERVIEW HEADER (welcome + search + quick-access buttons) ── */}
        {sidebarTab === "overview" && (
          <div className="px-10 pt-10 pb-3 shrink-0">
            <div className="flex items-stretch gap-8">
              <div className="flex-1 bg-[#0D3A2C] rounded-[56px] p-12 text-white shadow-2xl relative flex flex-col min-h-[320px]">
                <div className="absolute inset-0 flex items-center px-12 pb-14 z-10 pointer-events-none">
                  <h2 className="text-[60px] font-normal tracking-tighter leading-none font-outfit pointer-events-auto">Welcome, {user?.name?.split(' ')[0] || 'Maria'}</h2>
                </div>
                <div className="mt-auto relative z-30 self-end w-full max-w-xl flex-shrink-0 pointer-events-auto">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1D1D1F] opacity-40"><Search className="w-6 h-6" /></div>
                  <input
                    type="text"
                    placeholder="Search Shops"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full h-16 bg-white rounded-[24px] border border-black/[0.05] pl-16 pr-6 text-[12px] font-light shadow-xl focus:ring-4 focus:ring-[#014421]/10 transition-all outline-none placeholder:font-light placeholder:text-gray-500 text-[#1D1D1F]"
                  />
                  {searchQuery && suggestions.length > 0 && showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-black/[0.05] overflow-hidden z-[100] animate-fadeUp">
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSearchQuery(s.name); setShowSuggestions(false); }}
                          className="w-full px-8 py-5 flex items-center justify-between hover:bg-[#F8F9FA] transition-all border-b border-black/[0.02] last:border-0 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F]/5 flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#1D1D1F] group-hover:text-white transition-all">
                              <Store className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[14px] font-normal text-[#1D1D1F] tracking-tight">{s.name}</p>
                              <p className="text-[12px] font-medium text-[#1D1D1F]/50 truncate max-w-[200px]">{s.address}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#1D1D1F] group-hover:text-[#1D1D1F] transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-120 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="flex flex-col justify-center gap-6 pb-14">
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
            <div className="space-y-6 px-12">
              <div className="flex flex-col gap-6 pt-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-normal text-[#1D1D1F] tracking-tighter font-outfit leading-none">Laundry Shops</h3>
                    <p className="text-[12px] font-medium text-[#1D1D1F]/60 truncate tracking-tighter leading-none">{filteredShops.length} shops found</p>
                  </div>
                  <div className="flex items-center gap-4 relative">
                    {/* Simplified Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className={`px-5 py-3 rounded-2xl border border-black/[0.05] shadow-sm bg-white flex items-center gap-2 transition-all hover:bg-gray-50 active:scale-95 text-[12px] font-normal text-[#1D1D1F] ${showSortDropdown ? 'ring-2 ring-[#1D1D1F]/5' : ''}`}
                      >
                        Sort by
                        <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showSortDropdown && (
                        <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-[24px] shadow-2xl border border-black/[0.05] py-3 z-[150] animate-fadeUp">
                          {[
                            { id: 'topsis', label: 'Best Match' },
                            { id: 'price', label: 'Lowest Price' },
                            { id: 'rating', label: 'Highest Rating' },
                            { id: 'distance', label: 'Nearest' }
                          ].map((option) => (
                            <button
                              key={option.id}
                              onClick={() => { setActiveSort(option.id); setShowSortDropdown(false); }}
                              className={`w-full px-6 py-3 text-left text-[12px] capitalize transition-all hover:bg-[#228B22]/10 hover:text-[#228B22] ${activeSort === option.id ? 'text-[#228B22] bg-[#228B22]/5 font-normal' : 'text-[#1D1D1F]/60 font-normal'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pb-12">
                {filteredShops.map(s => (
                  <div
                    key={s.id || s._id}
                    onClick={() => s.status === 'open' && handleSelectShop(s)}
                    className={`bg-white rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm transition-all overflow-hidden p-4 cursor-pointer ${s.status === 'open' ? 'hover:shadow-xl group' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}`}
                  >
                    <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-2">
                      <img src={s.image} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt="" />
                      <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all shadow-md backdrop-blur-md ${s.status === 'open' ? 'bg-white/90 border-[#228B22]/20 text-[#228B22]' : 'bg-white/90 border-black/10 text-black/40'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'open' ? 'bg-[#228B22]' : 'bg-black/20'}`} />
                        <span className="text-[12px] font-normal capitalize tracking-wide">{s.status}</span>
                      </div>
                      {isApplied && s.score > 0 && (
                        <div
                          onClick={(e) => { e.stopPropagation(); setShowComputation(s); }}
                          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2.5 border border-white/20 shadow-xl cursor-help transition-all hover:scale-105 active:scale-95 group/match"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#014421]/5 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4 text-[#014421]" />
                          </div>
                          <div className="flex flex-col -space-y-0.5">
                            <span className="text-[10px] font-bold text-[#1D1D1F]/40 uppercase tracking-tighter leading-none">Match</span>
                            <span className="text-[15px] font-normal text-[#1D1D1F] leading-none">{(s.score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-1 space-y-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[14px] font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{s.name}</h4>
                          {s.permitStatus === 'approved' && (
                            <div className="w-4 h-4 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
                          <span className="text-[12px] font-medium text-[#1D1D1F]">{s.rating} <span className="opacity-40">({s.reviewCount || 0})</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#1D1D1F]">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <p className="text-[12px] font-medium truncate">{s.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#1D1D1F]" />
                          <span className="text-[12px] font-medium text-[#1D1D1F] lowercase">{s.turnaroundTime} hrs</span>
                        </div>
                      </div>
                      <div className="mt-auto pt-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-normal text-[#7B1113] tracking-tight font-outfit leading-none">₱{s.price}<span className="text-[12px] font-normal text-[#7B1113]/60 lowercase ml-1">/kg</span></span>
                        </div>
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
                    {/* Weight ranges — first */}
                    <div className="bg-white p-14 rounded-[64px] border border-black/[0.03] shadow-2xl relative overflow-hidden flex flex-col space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-[16px] font-bold text-[#1D1D1F] tracking-tighter capitalize font-outfit leading-none">Weight ranges</h3>
                          <button
                            onClick={() => setShowWeightManual(!showWeightManual)}
                            className={`p-3 rounded-2xl transition-all ${showWeightManual ? 'bg-[#014421] text-white shadow-lg shadow-[#014421]/20' : 'bg-[#1D1D1F]/5 text-[#1D1D1F] hover:bg-[#1D1D1F]/10'}`}
                          >
                            <Info className="w-6 h-6" />
                          </button>
                        </div>
                        {showWeightManual && (
                          <div className="bg-[#014421]/5 p-6 rounded-[32px] flex items-start gap-4 border border-[#014421]/10 animate-fadeUp">
                            <div className="w-10 h-10 bg-[#014421] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#014421]/20">
                              <Sliders className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1D1D1F] font-outfit">Set your preferences</p>
                              <p className="text-xs text-[#1D1D1F]/60 mt-1 leading-relaxed">Adjust these sliders to set your ideal budget, distance, and time. We'll use these to find shops that fit your needs.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-10 relative z-10">
                        {Object.entries(weights).map(([key, val]) => (
                          <div key={key} className="space-y-5">
                            <div className="flex justify-between items-end gap-3">
                              <p className="text-[14px] font-medium text-[#1D1D1F] tracking-tight font-outfit whitespace-nowrap">
                                {key === 'price' ? (<>Price <span className="font-medium normal-case text-xs text-[#1D1D1F]">(kg)</span></>) :
                                  key === 'time' ? 'Turnaround Time' :
                                    key === 'rating' ? 'Rating' :
                                      key === 'distance' ? (<>Distance <span className="font-medium normal-case text-xs text-[#1D1D1F]">(km)</span></>) : key}
                              </p>
                              <span className="text-[14px] font-normal text-[#014421] leading-none">{val}</span>
                            </div>
                            <div className="relative h-2.5 flex items-center group">
                              <div className="absolute inset-x-0 h-full bg-[#1D1D1F]/5 rounded-full overflow-hidden"><div className="h-full bg-[#014421] transition-all" style={{ width: `${(val / CRITERIA_LIMITS[key]) * 100}%` }} /></div>
                              <input type="range" min="1" max={CRITERIA_LIMITS[key]} step={key === 'rating' ? 0.1 : 1} value={val} onChange={(e) => { setWeights({ ...weights, [key]: parseFloat(e.target.value) }); setIsApplied(false); }} className="relative w-full h-full bg-transparent appearance-none cursor-pointer z-10 opacity-0 group-hover:opacity-10" />
                              <div className="absolute w-6 h-6 bg-white rounded-full shadow-xl border-[3px] border-[#014421] pointer-events-none transition-all" style={{ left: `calc(${(val / CRITERIA_LIMITS[key]) * 100}% - 12px)` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Rank your priorities — second */}
                    <div className="bg-white rounded-[64px] border border-black/[0.03] shadow-2xl p-14 flex flex-col space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-[16px] font-bold text-[#1D1D1F] tracking-tighter capitalize font-outfit leading-none">Rank your priorities</h3>
                          <button
                            onClick={() => setShowPriorityManual(!showPriorityManual)}
                            className={`p-3 rounded-2xl transition-all ${showPriorityManual ? 'bg-[#7B1113] text-white shadow-lg shadow-[#7B1113]/20' : 'bg-[#1D1D1F]/5 text-[#1D1D1F] hover:bg-[#1D1D1F]/10'}`}
                          >
                            <Info className="w-6 h-6" />
                          </button>
                        </div>
                        {showPriorityManual && (
                          <div className="bg-[#7B1113]/5 p-6 rounded-[32px] flex items-start gap-4 border border-[#7B1113]/10 animate-fadeUp">
                            <div className="w-10 h-10 bg-[#7B1113] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#7B1113]/20">
                              <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1D1D1F] font-outfit">What matters most?</p>
                              <p className="text-xs text-[#1D1D1F]/60 mt-1 leading-relaxed">Drag items to reorder them. The item at the top is given the most importance (40%) when calculating your shop recommendations.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {priorities.map((key, index) => (
                          <div key={key} draggable onDragStart={() => onDragStart(index)} onDragOver={onDragOver} onDrop={() => { onDrop(index); setIsApplied(false); }} className="flex items-center justify-between gap-6 bg-[#F8F9FA] p-5 rounded-[36px] border border-black/[0.01] group transition-all hover:bg-white hover:shadow-2xl cursor-grab active:cursor-grabbing">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-[#1D1D1F] tracking-tight font-outfit leading-none whitespace-normal">
                                {key === 'price' ? (<>Price <span className="text-xs text-[#1D1D1F]">(per kg)</span></>) :
                                  key === 'time' ? 'Turnaround Time' :
                                    key === 'rating' ? 'Rating' :
                                      key === 'distance' ? (<>Distance <span className="text-xs text-[#1D1D1F]">(km)</span></>) : key}
                              </p>
                            </div>
                            <span className="text-[14px] font-normal text-[#014421] font-outfit leading-none">{Math.round(POSITION_WEIGHTS[index] * 100)}%</span>
                          </div>
                        ))}
                        {/* Total row */}
                        <div className="flex items-center justify-between gap-6 px-5 pt-6 border-t border-black/[0.06]">
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#1D1D1F] font-outfit">Total</p>
                          </div>
                          <span className="text-[14px] font-normal text-[#1D1D1F] font-outfit">100%</span>
                        </div>
                      </div>
                      <div className="pt-8 border-t border-black/[0.03]">
                        <button onClick={() => setIsApplied(true)} className="w-full py-6 bg-[#014421] text-white rounded-[36px] font-normal text-[12px] capitalize tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#1D1D1F] transition-all shadow-2xl shadow-[#014421]/30 group active:scale-[0.98]">Apply</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xl:col-span-4 min-h-[500px]">
                  {shops.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-black/[0.02] rounded-[48px] border-2 border-dashed border-black/[0.08]">
                      <Store className="w-10 h-10 text-[#1D1D1F]/40 mb-4" />
                      <p className="text-[11px] font-bold text-[#1D1D1F] max-w-[220px] leading-relaxed">No shops available yet in the system.</p>
                    </div>
                  ) : isApplied ? (
                    <div className="space-y-1 animate-fadeUp">
                      <h3 className="text-[16px] font-bold text-[#1D1D1F] tracking-tighter font-outfit">Recommended shops for you</h3>
                      <p className="text-[14px] font-medium text-[#1D1D1F] tracking-tight">Based on your priorities</p>
                      <div className="flex flex-col gap-5 pt-6">
                        {top3.map((s, i) => (
                          <div key={s.id || s._id || i} onClick={() => { if (s.status === 'open') handleSelectShop(s); }} className={`bg-white p-4 rounded-[40px] border border-black/[0.04] shadow-xl transition-all relative overflow-hidden flex flex-col gap-2 ${s.status === 'open' ? 'hover:shadow-2xl cursor-pointer group' : 'opacity-40 cursor-not-allowed grayscale'}`}>
                            <div className="flex justify-between items-start gap-3">
                              <div className="relative shrink-0 flex justify-center w-12 pt-0.5">
                                <span className="text-5xl font-black text-[#7B1113] font-outfit leading-none select-none">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h4 className="text-[14px] font-[950] text-[#1D1D1F] tracking-tight capitalize font-outfit truncate group-hover:text-[#014421] transition-colors">{s.name}</h4>
                                    {s.permitStatus === 'approved' && (
                                      <div className="w-5 h-5 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-md">
                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    onClick={(e) => { e.stopPropagation(); setShowComputation(s); }}
                                    className="text-[14px] font-normal text-[#014421] tracking-tighter font-outfit shrink-0 hover:scale-110 transition-transform cursor-help bg-[#014421]/5 px-3 py-1 rounded-full"
                                    title="Click to view match calculation"
                                  >
                                    {(s.score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-1.5 text-[#1D1D1F]">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <p className="text-[12px] font-medium capitalize truncate">{s.address}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-[#1D1D1F] shrink-0" />
                                      <span className="text-[12px] font-medium text-[#1D1D1F]">{s.turnaroundTime} hrs</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
                                      <span className="text-[12px] font-medium text-[#1D1D1F]">{s.rating} ({s.reviewCount || 0})</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center gap-4">
                                    <span className="text-[14px] font-normal text-[#7B1113] tracking-tight font-outfit leading-none">₱{s.price}<span className="text-[12px] font-normal text-[#7B1113]/60 lowercase ml-1">/kg</span></span>
                                    {s.status !== 'open' && (
                                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1D1D1F]/10 rounded-full">
                                        <XCircle className="w-3 h-3 text-[#1D1D1F]" />
                                        <span className="text-[10px] font-black text-[#1D1D1F] tracking-wider">Closed</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-black/[0.02] rounded-[48px] border-2 border-dashed border-black/[0.08]">
                      <Target className="w-10 h-10 text-[#1D1D1F]/40 mb-4" />
                      <p className="text-[11px] font-bold text-[#1D1D1F] max-w-[220px] leading-relaxed">Adjust your rankings and click Apply to see top shops recommendations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── REDESIGNED MAP INTERFACE ── */}
        {sidebarTab === "map" && (
          <div className="absolute inset-0 z-30 flex flex-col bg-slate-50 animate-fadeUp overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 z-0">
              <MapContainer center={userLocation} zoom={15} className="w-full h-full z-0 overflow-hidden" zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapController routePath={routePath} userLocation={userLocation} />

                {/* User Location Marker */}
                <Marker position={userLocation} icon={createUserLocationIcon()} />

                {/* Shop Marker for Selected Shop Only */}
                {(() => {
                  if (!activeRouteShopId) return null;
                  const selectedShopIndex = rankedShops.findIndex(s => s.id === activeRouteShopId || s._id === activeRouteShopId);
                  const s = rankedShops[selectedShopIndex];
                  if (!s) return null;
                  return (
                    <Marker
                      key={s.id}
                      position={[s.latitude, s.longitude]}
                      icon={createShopMarkerIcon(selectedShopIndex + 1)}
                    />
                  );
                })()}

                {/* Routing Line - Road Following */}
                {routePath.length > 0 && (
                  <Polyline
                    positions={routePath}
                    color="#014421"
                    weight={6}
                    opacity={0.8}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
              </MapContainer>
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col">
              <div className="flex items-start justify-between pointer-events-auto">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => { setSidebarTab("overview"); setActiveRouteShopId(null); }}
                    className="flex items-center justify-center w-16 h-16 rounded-[24px] bg-white/90 backdrop-blur-xl text-[#1D1D1F] shadow-2xl hover:bg-[#1D1D1F] hover:text-white transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={refreshLocation}
                    className="flex items-center justify-center w-16 h-16 rounded-[24px] bg-white/90 backdrop-blur-xl text-[#014421] shadow-2xl hover:bg-[#014421] hover:text-white transition-all active:scale-95"
                    title="Detect my current location"
                  >
                    <LocateFixed className="w-6 h-6" />
                  </button>
                  <div className="relative w-[450px]">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1D1D1F] opacity-40"><Search className="w-5 h-5" /></div>
                    <input
                      type="text"
                      placeholder="Search laundry nearby..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      onFocus={() => setShowMapSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowMapSuggestions(false), 200)}
                      className="w-full h-16 bg-white/90 backdrop-blur-xl rounded-[32px] pl-16 pr-6 text-[12px] font-normal shadow-2xl outline-none focus:ring-4 focus:ring-[#014421]/10 transition-all placeholder:text-gray-500 text-gray-500"
                    />
                    {mapSearchQuery && mapSuggestions.length > 0 && showMapSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-black/[0.05] overflow-hidden z-[100] animate-fadeUp pointer-events-auto">
                        {mapSuggestions.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setMapSearchQuery(s.name);
                              setShowMapSuggestions(false);
                              setActiveRouteShopId(s.id);
                            }}
                            className="w-full px-8 py-5 flex items-center justify-between hover:bg-[#F8F9FA] transition-all border-b border-black/[0.02] last:border-0 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F]/5 flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#1D1D1F] group-hover:text-white transition-all">
                                <Store className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="text-[14px] font-normal text-[#1D1D1F] tracking-tight">{s.name}</p>
                                <p className="text-[12px] font-medium text-[#1D1D1F]/60 truncate max-w-[200px]">{s.address}</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[#1D1D1F] group-hover:text-[#1D1D1F] transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 self-end pointer-events-none w-[420px] max-h-[85%] flex flex-col">
                {(() => {
                  const query = mapSearchQuery.toLowerCase().trim();
                  const filtered = query
                    ? rankedShops.filter(s => s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query))
                    : rankedShops;
                  return (
                    <>
                      <div className="px-8 pb-10 pointer-events-auto relative">
                        <div className="absolute -inset-x-24 -inset-y-16 bg-white opacity-80 blur-[100px] rounded-full -z-10 pointer-events-none" />
                        <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight leading-none">{filtered.length} Shops Around You</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 no-scrollbar pointer-events-auto">
                        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5 no-scrollbar pointer-events-auto">
                          {filtered.map((s, i) => {
                            const isActive = activeRouteShopId === s.id;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setActiveRouteShopId(isActive ? null : s.id);
                                }}
                                className={`relative p-7 rounded-[40px] bg-white border transition-all duration-300 cursor-pointer ${isActive ? 'border-[#014421] ring-2 ring-[#014421]/20 shadow-2xl shadow-[#014421]/15 z-10' : 'border-black/[0.1] hover:border-black/20'}`}
                              >
                                <div className="flex items-start gap-6">
                                  {/* Left Side: Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-4">
                                      <span className="text-[14px] font-[950] text-[#7B1113] leading-none shrink-0">{i + 1}.</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-[14px] font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{s.name}</h4>
                                          {s.permitStatus === 'approved' && (
                                            <div className="w-5 h-5 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-md">
                                              <Check className="w-3 h-3 text-white stroke-[4]" />
                                            </div>
                                          )}
                                        </div>

                                      </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(5)].map((_, idx) => (
                                            <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.floor(s.rating) ? 'fill-[#FF8C00] text-[#FF8C00]' : 'text-[#1D1D1F]/20'}`} />
                                          ))}
                                        </div>
                                        <span className="text-[12px] font-medium text-[#1D1D1F] ml-1">{s.rating} <span className="text-[#1D1D1F] font-medium">({s.reviewCount || 0})</span></span>
                                      </div>

                                      <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                                        <div className="flex items-center gap-6">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-normal text-[#7B1113] leading-none">₱{s.price}<span className="text-[12px] ml-0.5 opacity-60 lowercase">/kg</span></span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#1D1D1F]" />
                                            <span className="text-[12px] font-normal text-[#1D1D1F]">{s.turnaroundTime} hrs</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-[12px] font-normal text-[#014421] bg-[#014421]/5 px-2 py-0.5 rounded-full">
                                          {(s.distance || 0).toFixed(1)} km
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-32 h-32 rounded-[32px] overflow-hidden shrink-0 shadow-inner">
                                    <img src={s.image} className="w-full h-full object-cover" alt={s.name} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )
        }
      </main >

      {selectedShop && (
        <ShopDetailModal
          shop={selectedShop}
          reviews={shopReviews[selectedShop._id || selectedShop.id] || []}
          onClose={() => setSelectedShop(null)}
          onPosted={handlePostReview}
          onShowComputation={setShowComputation}
          showMatchScore={isApplied}
          onNavigate={(shop) => {
            setSidebarTab("map");
            setActiveRouteShopId(shop.id || shop._id);
            setSelectedShop(null);
          }}
        />
      )}
      {showComputation && <ComputationDetailsModal shop={showComputation} weights={weights} onClose={() => setShowComputation(null)} />}
    </div >
  );
}

function TrendingUp(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>; }
