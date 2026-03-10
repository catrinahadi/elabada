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
  MoreHorizontal, Heart, ArrowLeft, ChevronLeft, MoreVertical, LocateFixed, Camera,
  LayoutDashboard, LogOut, Settings, BarChart3, Sliders, Navigation, Navigation2, Plus, Trash2, Menu, ChevronUp,
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer, Circle, ChevronDown, Banknote, Wifi, Coffee
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

function ReviewForm({ shopId, onPosted, onCancel }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!user) return (
    <div className="bg-white p-6 rounded-[32px] border border-black/[0.05] shadow-xl text-center space-y-3">
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
      await onPosted(shopId, { rating, comment, reviewerName: user?.name || "Verified Customer", images, userId: user?._id || user?.id });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onCancel?.();
      }, 2000);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to post review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-12 rounded-[40px] border border-emerald-100 shadow-xl flex flex-col items-center justify-center text-center space-y-4 animate-fadeUp">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        <p className="text-[14px] font-normal text-gray-800">Your review has been submitted successfully!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="bg-white p-8 rounded-[40px] border border-black/[0.05] shadow-xl space-y-6">
        <div className="space-y-4 text-center">
          <h3 className="text-[14px] font-normal text-[#1D1D1F] tracking-tight">Rate your experience</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-transform active:scale-95">
                <Star className={`w-10 h-10 ${s <= rating ? 'fill-[#E67E00] text-[#E67E00]' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[14px] font-normal text-[#1D1D1F] px-2">What did you like?</p>
          <div className="flex flex-wrap gap-2">
            {reviewCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleTagClick(cat)}
                className="px-4 py-2 bg-gray-50 text-gray-500 rounded-full text-[14px] font-normal border border-black/[0.02] hover:bg-[#E67E00]/10 hover:text-[#E67E00] hover:border-[#E67E00]/30 transition-all cursor-pointer"
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
            placeholder="Write your review here..."
            className="w-full h-32 bg-gray-50 rounded-[32px] p-6 text-[14px] font-normal outline-none border-2 border-transparent focus:border-[#E67E00]/20 focus:bg-white transition-all resize-none placeholder:text-gray-400"
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

        <div className="space-y-3 px-2">
          <p className="text-[14px] font-normal text-[#1D1D1F]">Add photos (max 3)</p>
          <div className="flex gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group/img shadow-md border border-black/[0.03]">
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
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#E67E00] hover:text-[#E67E00] hover:bg-[#E67E00]/5 transition-all group"
              >
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl text-[14px] font-normal hover:bg-gray-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-4 bg-[#014421] text-white rounded-xl text-[14px] font-normal tracking-wide hover:opacity-90 transition-all shadow-xl shadow-[#014421]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopDetailModal({ shop, reviews = [], onClose, onPosted, onShowComputation, showMatchScore, onNavigate, setActiveImageGallery }) {
  const [filter, setFilter] = useState('All');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scrollCounter, setScrollCounter] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm, scrollCounter]);

  const ratingCounts = [
    { stars: 5, percentage: 85 },
    { stars: 4, percentage: 65 },
    { stars: 3, percentage: 15 },
    { stars: 2, percentage: 10 },
    { stars: 1, percentage: 5 },
  ];

  const filteredReviews = useMemo(() => {
    if (filter === 'All') return reviews;
    if (filter === 'Photos') return reviews.filter(r => r.images && r.images.length > 0);
    return reviews.filter(r => r.rating.toString() === filter);
  }, [reviews, filter]);

  const handleWriteReview = () => {
    if (showForm) {
      setScrollCounter(prev => prev + 1);
    } else {
      setShowForm(true);
    }
  };

  if (showAllReviews) {
    return (
      <div className="modal-overlay flex items-center justify-center p-4 md:p-8 z-[1000]">
        <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[1000px] h-[95vh] md:h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
          <div className="sticky top-0 bg-white z-20">
            <div className="p-6 border-b border-black/5">
              <button onClick={() => setShowAllReviews(false)} className="w-fit p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all group">
                <ArrowLeft className="w-6 h-6 text-[#1D1D1F] group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="px-8 pt-8 flex flex-col gap-4">
            <h3 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">All reviews</h3>
            <div className="flex flex-wrap items-center gap-2">
              {['All', '5', '4', '3', '2', '1', 'Photos'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`px-5 py-2 rounded-full text-[14px] font-normal transition-all ${filter === val
                    ? 'bg-[#E67E00] text-white shadow-lg shadow-[#E67E00]/20'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {val === 'All' ? 'All' : val === 'Photos' ? 'Photos' : `${val} Stars`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <p className="text-gray-400 text-[16px] font-normal">No reviews found</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredReviews.map((r, i) => (
                  <div key={r._id || r.id} className="bg-white p-6 rounded-[32px] border border-black/[0.03] shadow-sm space-y-4 animate-fadeUp">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[14px] font-normal text-[#1D1D1F] leading-none">{r.reviewerName || r.user || "Anonymous"}</h5>
                        <span className="text-[14px] font-normal text-gray-400 tracking-tight leading-none">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Recently'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-[#E67E00] text-[#E67E00]" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[14px] font-normal text-gray-600 leading-relaxed mt-4">
                      {r.comment}
                    </p>
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-4 mt-4">
                        {r.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageGallery({ images: r.images, index: idx })}
                            className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm border border-black/[0.03] hover:scale-[1.02] transition-transform active:scale-95"
                          >
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          </button>
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
    <div className="modal-overlay flex items-center justify-center p-4 md:p-8 z-[1000]">
      <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[1000px] h-[95vh] md:h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
        <div className="sticky top-0 bg-white z-20">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <button onClick={onClose} className="w-fit p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all group">
              <ArrowLeft className="w-6 h-6 text-[#1D1D1F] group-hover:-translate-x-1 transition-transform" />
            </button>
            {showMatchScore && shop.score && (
              <div className="bg-[#F8F9FA] px-4 py-2 rounded-2xl border border-black/5 flex items-center gap-2">
                <span className="text-[14px] font-normal text-gray-400">Match:</span>
                <span className="text-[14px] font-normal text-[#1D1D1F]">{(shop.score * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-6 pt-8 pb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8 items-stretch transform transition-all duration-500">
              {/* Left Column: Image */}
              <div className="w-full flex h-64 md:h-auto">
                <div className="w-full relative rounded-[32px] overflow-hidden border border-black/5 shadow-sm">
                  <div className="absolute inset-0">
                    <img src={shop.image} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="flex flex-col justify-start w-full">
                <h1 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight leading-none mb-4 mt-2 pl-2">{shop.name}</h1>
                <div className="space-y-2">
                  {/* Address Card & Navigation */}
                  <div className="bg-[#F8F9FA] p-4 rounded-[32px] border border-black/[0.03] flex items-center justify-between gap-4 group hover:bg-white hover:shadow-xl transition-all duration-300">
                    <div className="flex-1 min-w-0 flex flex-col justify-center pl-2 space-y-1">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight block">Location address</span>
                      <p className="text-[14px] font-normal text-[#1D1D1F] tracking-tight leading-tight truncate" title={shop.address}>{shop.address}</p>
                    </div>
                  </div>

                  {/* Information Grid (Hours & Payments) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F8F9FA] py-4 px-6 rounded-[32px] border border-black/[0.03] space-y-1 hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight block">Operating hours</span>
                      <p className="text-[14px] font-normal text-[#1D1D1F]">8:00 AM - 8:00 PM</p>
                    </div>
                    <div className="bg-[#F8F9FA] py-4 px-6 rounded-[32px] border border-black/[0.03] space-y-1 hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight block">Shop status</span>
                      <p className={`text-[14px] font-normal ${shop.status === 'open' ? 'text-emerald-600' : 'text-red-500'} capitalize`}>
                        {shop.status || 'open'}
                      </p>
                    </div>
                  </div>

                  {/* High-Level Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Price Card */}
                    <div className="bg-[#F8F9FA] p-4 rounded-[24px] border border-black/[0.03] flex flex-col gap-1 items-center justify-center text-center hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight">Price</span>
                      <p className="text-[14px] font-normal text-[#7B1113]">₱{shop.price}/kg</p>
                    </div>

                    {/* Time Card */}
                    <div className="bg-[#F8F9FA] p-4 rounded-[24px] border border-black/[0.03] flex flex-col gap-1 items-center justify-center text-center hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight">Turnaround</span>
                      <p className="text-[14px] font-normal text-[#014421]">{shop.turnaroundTime} hrs</p>
                    </div>

                    {/* Distance Card */}
                    <div className="bg-[#F8F9FA] p-4 rounded-[24px] border border-black/[0.03] flex flex-col gap-1 items-center justify-center text-center hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight">Distance</span>
                      <p className="text-[14px] font-normal text-blue-900">{(shop.distance || 0).toFixed(1)} km</p>
                    </div>
                  </div>

                  {/* Directions Button */}
                  <button
                    onClick={() => onNavigate(shop)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-black/5 rounded-[24px] text-[15px] font-normal text-[#1D1D1F] shadow-sm relative overflow-hidden group"
                  >
                    <span>Get directions</span>
                    <Navigation2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-4 border-t border-black/[0.04]">
              <div className="flex flex-col gap-6 mt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight leading-none">Ratings & Reviews</h3>
                  <button
                    onClick={handleWriteReview}
                    className="px-6 py-2.5 bg-[#014421] text-white rounded-xl text-[13px] font-medium transition-all shadow-md hover:bg-[#1D1D1F] active:scale-95"
                  >
                    Write a review
                  </button>
                </div>

                {/* Aggregate Rating Summary */}
                <div className="bg-white p-6 rounded-[32px] border border-black/[0.04] shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="text-center space-y-4 w-48 shrink-0">
                      <h4 className="text-6xl font-bold text-[#1D1D1F] tracking-tighter leading-none">{shop.rating || '0.0'}</h4>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-6 h-6 ${s <= Math.floor(shop.rating) ? "fill-[#E67E00] text-[#E67E00]" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-[14px] font-normal text-gray-400">({reviews.length} reviews)</p>
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      {ratingCounts.map((rc) => (
                        <button
                          key={rc.stars}
                          onClick={() => setFilter(prev => prev === rc.stars.toString() ? 'All' : rc.stars.toString())}
                          className={`w-full flex items-center gap-6 px-4 py-1.5 rounded-xl transition-all group ${filter === rc.stars.toString() ? 'bg-[#E67E00]/10' : 'hover:bg-gray-50'}`}
                        >
                          <span className={`text-[14px] w-4 ${rc.stars === 5 ? 'font-bold' : 'font-normal'} ${filter === rc.stars.toString() ? 'text-[#E67E00]' : 'text-gray-400'}`}>{rc.stars}</span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${filter === rc.stars.toString() ? 'bg-[#E67E00]' : 'bg-[#E67E00]/60'}`} style={{ width: `${rc.percentage}%` }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Customer Feedback */}
                <div className="bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.02] shadow-sm space-y-4 relative -mt-4">
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="flex items-center gap-1.5 text-[14px] font-normal text-gray-400 hover:translate-x-0.5 transition-all group"
                    >
                      Read all <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <p className="text-gray-400 text-[16px] font-normal">No reviews found</p>
                    </div>
                  ) : (
                    <div className="space-y-6 flex flex-col">
                      {filteredReviews.slice(0, 1).map((r) => (
                        <div key={r._id || r.id} className="bg-white p-6 rounded-[24px] border border-black/[0.03] shadow-md space-y-4 animate-fadeUp">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[14px] font-normal text-[#1D1D1F] leading-none">{r.reviewerName || r.user || 'Anonymous'}</h5>
                              <span className="text-[14px] font-normal text-gray-400 tracking-tight leading-none">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Recently'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-[#E67E00] text-[#E67E00]" : "text-gray-200"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[14px] font-normal text-gray-600 leading-relaxed mt-4">
                            {r.comment}
                          </p>
                          {r.images && r.images.length > 0 && (
                            <div className="flex gap-3 mt-4">
                              {r.images.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveImageGallery({ images: r.images, index: idx })}
                                  className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm border border-black/[0.03] hover:scale-[1.02] transition-transform active:scale-95"
                                >
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
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

            {showForm && (
              <div ref={formRef} className="mt-8 pt-8 border-t border-black/[0.04] animate-fadeUp">
                <ReviewForm
                  shopId={shop._id || shop.id}
                  onPosted={(id, payload) => {
                    onPosted(id, payload);
                  }}
                  onCancel={() => setShowForm(false)}
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
    <div className="modal-overlay flex items-center justify-center p-2 md:p-4 z-[400] backdrop-blur-md">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-[1400px] h-[95vh] md:h-auto shadow-[0_40px_100px_rgba(0,0,0,0.3)] animate-scaleIn flex flex-col overflow-hidden border border-black/5 font-outfit">
        <div className="p-6 md:p-10 border-b border-black/[0.03] flex flex-col items-start gap-6 md:gap-8 bg-gradient-to-r from-white to-[#F8F9FA]">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-all group">
            <ArrowLeft className="w-8 h-8 text-[#1D1D1F]" />
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#014421] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Analysis</div>
              <p className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-[0.3em]">How we calculated your match</p>
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter">Ranking breakdown: <span className="text-[#014421]">{shop.name}</span></h3>
          </div>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
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
                            <p className="text-[10px] font-normal text-[#1D1D1F]">{detail.actualValue} {detail.criterion === 'price' ? '/kg' : detail.criterion === 'turnaroundTime' ? 'hrs' : detail.criterion === 'distance' ? 'km' : ''}</p>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [activeImageGallery, setActiveImageGallery] = useState(null); // { images: [], index: 0 }
  const [isMapSheetExpanded, setIsMapSheetExpanded] = useState(false);


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

  // unified drag/drop state
  const [touchDragIndex, setTouchDragIndex] = useState(null);
  const touchTimer = useRef(null);

  const onDragStart = (index) => setDragIndex(index);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const newPriorities = [...priorities];
    const item = newPriorities.splice(dragIndex, 1)[0];
    newPriorities.splice(index, 0, item);
    setPriorities(newPriorities);
    setDragIndex(null);
  };

  const handleTouchStart = (index) => {
    touchTimer.current = setTimeout(() => {
      setTouchDragIndex(index);
      // Vibrate if supported to indicate pick up
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 400); // 400ms long press
  };

  const handleTouchMove = (e, index) => {
    if (touchDragIndex === null) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
      return;
    }
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = (e, targetIndex) => {
    if (touchTimer.current) clearTimeout(touchTimer.current);

    if (touchDragIndex !== null) {
      // Find what element we dropped on
      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

      if (targetElement) {
        // Look for the closest priority item container
        const priorityContainer = targetElement.closest('[data-priority-index]');
        if (priorityContainer) {
          const dropIndex = parseInt(priorityContainer.getAttribute('data-priority-index'), 10);

          if (!isNaN(dropIndex) && touchDragIndex !== dropIndex) {
            const newPriorities = [...priorities];
            const item = newPriorities.splice(touchDragIndex, 1)[0];
            newPriorities.splice(dropIndex, 0, item);
            setPriorities(newPriorities);
            setIsApplied(false);
          }
        }
      }
      setTouchDragIndex(null);
    }
  };

  const handleTouchCancel = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    setTouchDragIndex(null);
  };

  const movePriority = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === priorities.length - 1)) return;
    const newPriorities = [...priorities];
    const temp = newPriorities[index];
    newPriorities[index] = newPriorities[index + direction];
    newPriorities[index + direction] = temp;
    setPriorities(newPriorities);
    setIsApplied(false);
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
        s?.name?.toLowerCase().includes(query) || s?.address?.toLowerCase().includes(query)
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
    return rankedShops.filter(s => s?.name?.toLowerCase().includes(query)).slice(0, 5);
  }, [rankedShops, searchQuery]);

  const mapSuggestions = useMemo(() => {
    const query = mapSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return rankedShops.filter(s => s?.name?.toLowerCase().includes(query)).slice(0, 5);
  }, [rankedShops, mapSearchQuery]);



  return (
    <div className="flex bg-gradient-to-br from-[#F1F4F2] to-[#E8EEEB] min-h-screen text-[#1D1D1F] font-outfit overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conditional classes for responsiveness */}
      <aside className={`fixed lg:sticky top-0 h-screen transition-all duration-300 ease-in-out z-[100] bg-[#FAFAF7] border-r border-black/[0.05] flex flex-col p-8 shadow-[4px_0_24px_rgba(0,0,0,0.02)] 
        ${isSidebarOpen ? 'left-0 w-[280px]' : '-left-full lg:left-0 w-[320px] min-w-[320px] lg:flex'}`}>
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-[#014421] rounded-[18px] flex items-center justify-center text-white text-2xl shadow-lg shadow-[#014421]/20">E</div>
          <span className="text-[#1D1D1F] font-normal text-2xl tracking-tighter font-outfit">ELaBada</span>
        </div>

        <nav className="flex-1 space-y-3">
          <button onClick={() => { setSidebarTab("overview"); setIsSidebarOpen(false); }} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "overview" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
            <LayoutDashboard className={`w-5 h-5 ${sidebarTab === "overview" ? "text-white" : "text-[#014421]"}`} />
            Overview
          </button>

          <button onClick={() => { setSidebarTab("map"); setIsSidebarOpen(false); }} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "map" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
            <MapIcon className={`w-5 h-5 ${sidebarTab === "map" ? "text-white" : "text-[#014421]"}`} />
            Location
          </button>

          <button onClick={() => { setSidebarTab("computation"); setIsSidebarOpen(false); }} className={`w-full py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] transition-all relative group ${sidebarTab === "computation" ? "text-white bg-[#014421] shadow-lg shadow-[#014421]/20" : "text-[#014421] hover:bg-[#014421]/5"}`}>
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
        {/* Mobile Navbar Header */}
        {sidebarTab !== "map" && (
          <div className="lg:hidden h-16 flex items-center justify-between px-6 bg-[#FAFAF7] border-b border-black/[0.05] shrink-0 z-50">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[#1D1D1F]">
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-6" /> {/* Spacer */}
          </div>
        )}

        {/* ── FIXED OVERVIEW HEADER (welcome + search + quick-access buttons) ── */}
        {sidebarTab === "overview" && (
          <div className="px-4 md:px-10 pt-4 md:pt-10 pb-3 shrink-0">
            <div className="flex flex-row items-stretch gap-4 md:gap-8 min-h-[160px] md:min-h-[200px]">
              <div className="flex-1 bg-[#0D3A2C] rounded-[28px] md:rounded-[56px] p-5 md:p-12 text-white shadow-2xl relative flex flex-col justify-center min-h-[180px] md:min-h-[320px]">
                <div className="relative z-10 md:pb-14">
                  <h2 className="text-[35px] md:text-[60px] font-normal tracking-tighter leading-tight md:leading-none font-outfit mt-1 ml-1">Welcome, {user?.name?.split(' ')[0] || 'Maria'}</h2>
                </div>
                <div className="mt-auto relative z-30 self-end w-full max-w-xl flex-shrink-0 pointer-events-auto">
                  <input
                    type="text"
                    placeholder="Search Shops"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full h-11 md:h-16 bg-white rounded-xl md:rounded-[24px] border border-black/[0.05] pl-10 md:pl-16 pr-4 text-[10px] md:text-[12px] font-light shadow-xl focus:ring-4 focus:ring-[#014421]/10 transition-all outline-none placeholder:font-light placeholder:text-gray-500 text-[#1D1D1F]"
                  />
                  <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[#1D1D1F] opacity-40 pointer-events-none"><Search className="w-4 h-4 md:w-6 md:h-6" /></div>
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
                <div className="absolute top-0 right-0 w-120 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
              </div>
              <div className="flex flex-col justify-center gap-3 md:gap-6 py-2">
                <button onClick={() => setSidebarTab("computation")} className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[32px] bg-[#7B1113] shadow-lg flex items-center justify-center group transition-all hover:scale-105 shrink-0">
                  <Sliders className="w-5 h-5 md:w-8 md:h-8 text-white transition-all" />
                </button>
                <button onClick={() => setSidebarTab("map")} className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[32px] bg-[#FF8C00] shadow-lg flex items-center justify-center group transition-all hover:scale-105 shrink-0">
                  <LocateFixed className="w-5 h-5 md:w-8 md:h-8 text-white transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCROLLABLE CONTENT (shops grid / computation) ── */}
        <div className={`flex-1 overflow-y-auto no-scrollbar animate-fadeUp ${sidebarTab === "overview" ? "px-6 md:px-10 pb-10 pt-3" : "p-6 md:p-10"}`}>

          {sidebarTab === "overview" && (
            <div className="space-y-6 lg:px-12">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 pb-12">
                {filteredShops.map(s => (
                  <div
                    key={s.id || s._id}
                    onClick={() => s.status === 'open' && handleSelectShop(s)}
                    className={`bg-white rounded-[24px] md:rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm transition-all overflow-hidden p-3 md:p-4 cursor-pointer ${s.status === 'open' ? 'hover:shadow-xl group' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}`}
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
                    <div className="px-2 py-3 space-y-3 flex-1 flex flex-col">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight leading-normal font-outfit truncate">{s.name}</h4>
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
            <div className="max-w-[1700px] mx-auto animate-fadeUp py-4 md:py-8 px-2 md:px-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 items-start">
                <div className="xl:col-span-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                    {/* Weight ranges — first */}
                    <div className="bg-white p-8 md:p-14 rounded-[32px] md:rounded-[64px] border border-black/[0.03] shadow-2xl relative overflow-hidden flex flex-col space-y-12">
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
                    <div className="bg-white rounded-[32px] md:rounded-[64px] border border-black/[0.03] shadow-2xl p-8 md:p-14 flex flex-col space-y-12">
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
                              <p className="text-xs text-[#1D1D1F]/60 mt-1 leading-relaxed">Drag items to reorder them on desktop, or long-press and drag on mobile. The item at the top is given the most importance (40%) when calculating your shop recommendations.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {priorities.map((key, index) => (
                          <div
                            key={key}
                            data-priority-index={index}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragOver={onDragOver}
                            onDrop={() => { onDrop(index); setIsApplied(false); }}
                            onTouchStart={() => handleTouchStart(index)}
                            onTouchMove={(e) => handleTouchMove(e, index)}
                            onTouchEnd={(e) => handleTouchEnd(e, index)}
                            onTouchCancel={handleTouchCancel}
                            className={`flex items-center justify-between gap-6 p-5 rounded-[36px] border border-black/[0.01] group transition-all select-none
                              ${touchDragIndex === index ? 'bg-white shadow-2xl scale-105 opacity-90 z-50 relative' : 'bg-[#F8F9FA] hover:bg-white hover:shadow-2xl cursor-grab active:cursor-grabbing'}
                            `}
                            style={{
                              touchAction: touchDragIndex !== null ? 'none' : 'auto' // Prevent scrolling only while actively dragging
                            }}
                          >
                            <div className="flex-1 min-w-0 pointer-events-none">
                              <p className="text-[14px] font-medium text-[#1D1D1F] tracking-tight font-outfit leading-none whitespace-normal">
                                {key === 'price' ? (<>Price <span className="text-xs text-[#1D1D1F]">(per kg)</span></>) :
                                  key === 'time' ? 'Turnaround Time' :
                                    key === 'rating' ? 'Rating' :
                                      key === 'distance' ? (<>Distance <span className="text-xs text-[#1D1D1F]">(km)</span></>) : key}
                              </p>
                            </div>
                            <span className="text-[14px] font-normal text-[#014421] font-outfit leading-none pointer-events-none">{Math.round(POSITION_WEIGHTS[index] * 100)}%</span>
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
                          <div key={s.id || s._id || i} onClick={() => { if (s.status === 'open') handleSelectShop(s); }} className={`bg-white p-6 rounded-[40px] border border-black/[0.04] shadow-xl transition-all relative overflow-hidden flex flex-col gap-4 ${s.status === 'open' ? 'hover:shadow-2xl cursor-pointer group' : 'opacity-40 cursor-not-allowed grayscale'}`}>
                            <div className="flex justify-between items-start gap-3">
                              <div className="relative shrink-0 flex justify-center w-12 pt-0.5">
                                <span className="text-5xl font-black text-[#7B1113] font-outfit leading-none select-none">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h4 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight capitalize font-outfit truncate group-hover:text-[#014421] transition-colors leading-normal">{s.name}</h4>
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
                                    <span className="text-[14px] font-normal text-[#7B1113] tracking-tight font-outfit leading-normal">₱{s.price}<span className="text-[12px] font-normal text-[#7B1113]/60 lowercase ml-1">/kg</span></span>
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

            <div className="absolute inset-0 z-10 pointer-events-none p-4 pt-6 md:p-10 flex flex-col">
              <div className="flex flex-col md:flex-row items-stretch md:items-start justify-between pointer-events-auto gap-4">
                <div className="flex items-center gap-4 md:gap-6">
                  <button
                    onClick={() => { setSidebarTab("overview"); setActiveRouteShopId(null); }}
                    className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/90 backdrop-blur-xl text-[#1D1D1F] shadow-2xl hover:bg-[#1D1D1F] hover:text-white transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={refreshLocation}
                    className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/90 backdrop-blur-xl text-[#014421] shadow-2xl hover:bg-[#014421] hover:text-white transition-all shadow-md"
                    title="Detect my current location"
                  >
                    <LocateFixed className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <div className="relative flex-1 md:w-[450px]">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1D1D1F] opacity-40 md:opacity-40"><Search className="w-5 h-5" /></div>
                    <input
                      type="text"
                      placeholder="Search laundry..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      onFocus={() => setShowMapSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowMapSuggestions(false), 200)}
                      className="w-full h-12 md:h-16 bg-white/90 backdrop-blur-xl rounded-[24px] md:rounded-[32px] pl-16 pr-6 text-[12px] font-normal shadow-2xl outline-none transition-all placeholder:text-gray-500 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div className={`mt-auto md:mt-6 self-center md:self-end pointer-events-none w-full md:w-[420px] max-h-[85vh] md:max-h-[85%] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] z-[40]
                ${activeRouteShopId ? 'translate-y-[calc(100%-120px)] md:translate-y-0' : (isMapSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-80px)] md:translate-y-0')}
              `}>
                {(() => {
                  const query = mapSearchQuery.toLowerCase().trim();
                  const filtered = query
                    ? rankedShops.filter(s => s?.name?.toLowerCase().includes(query) || s?.address?.toLowerCase().includes(query))
                    : rankedShops;
                  return (
                    <>
                      <div className="px-6 pb-6 pointer-events-auto relative bg-white/95 backdrop-blur-xl rounded-t-[40px] md:rounded-t-none md:bg-transparent md:backdrop-filter-none border-t border-black/[0.05] md:border-t-0 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] md:shadow-none">
                        <div className="md:hidden flex flex-col items-center py-3 mb-2" onClick={() => setIsMapSheetExpanded(!isMapSheetExpanded)}>
                          <div className="w-12 h-1.5 bg-black/10 rounded-full mb-3" />
                        </div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight leading-none mt-2 md:mt-0">{filtered.length} Shops Around You</h3>
                          {activeRouteShopId && (
                            <button
                              onClick={() => { setActiveRouteShopId(null); setIsMapSheetExpanded(true); }}
                              className="md:hidden text-[12px] font-bold text-[#7B1113]"
                            >
                              Show List
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`flex-1 overflow-y-auto px-4 pb-8 space-y-4 no-scrollbar pointer-events-auto bg-white/95 backdrop-blur-xl md:bg-transparent md:backdrop-filter-none transition-all duration-500 ${activeRouteShopId && !isMapSheetExpanded ? 'max-h-[120px] overflow-hidden' : ''}`}>
                        <div className="px-4 pb-8 space-y-5">
                          {filtered
                            .sort((a, b) => {
                              if (activeRouteShopId === a.id) return -1;
                              if (activeRouteShopId === b.id) return 1;
                              return 0;
                            })
                            .map((s, i) => {
                              const isActive = activeRouteShopId === s.id;
                              if (activeRouteShopId && !isActive && !isMapSheetExpanded) return null;

                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    if (isActive && !isMapSheetExpanded) {
                                      setIsMapSheetExpanded(true);
                                      return;
                                    }
                                    setActiveRouteShopId(isActive ? null : s.id);
                                    if (!isActive) setIsMapSheetExpanded(false);
                                  }}
                                  className={`relative p-5 md:p-7 rounded-[32px] md:rounded-[40px] bg-white border transition-all duration-300 cursor-pointer ${isActive ? 'border-[#014421] ring-2 ring-[#014421]/20 shadow-2xl z-10' : 'border-black/[0.1] hover:border-black/20'}`}
                                >
                                  <div className="flex items-start gap-6">
                                    {/* Left Side: Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-4">
                                        <span className="text-[14px] font-normal text-[#7B1113] leading-none shrink-0">{i + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{s.name}</h4>
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
          setActiveImageGallery={setActiveImageGallery}
        />
      )}
      {showComputation && <ComputationDetailsModal shop={showComputation} weights={weights} onClose={() => setShowComputation(null)} />}

      {activeImageGallery && (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="absolute top-8 left-8 z-[2001]">
            <button
              onClick={() => setActiveImageGallery(null)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all group backdrop-blur-md"
            >
              <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="absolute top-10 text-white font-normal text-[18px] tracking-tight pointer-events-none">
            {activeImageGallery.index + 1} / {activeImageGallery.images.length}
          </div>

          <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center aspect-square">
            <img
              src={activeImageGallery.images[activeImageGallery.index]}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              alt=""
            />

            {activeImageGallery.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageGallery(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }))}
                  className="absolute -left-4 md:-left-16 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={() => setActiveImageGallery(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }))}
                  className="absolute -right-4 md:-right-16 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div >
  );
}

function TrendingUp(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>; }
