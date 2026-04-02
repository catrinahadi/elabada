import { useState, useMemo, useEffect, useRef, Fragment, memo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calculateTopsis } from "../utils/topsis";
import {
  Star, MapPin, Search, Filter, Map as MapIcon,
  Clock, Package, Check, ChevronRight, ArrowRight,
  X, Info, MessageSquare, ArrowUpRight, Award,
  Droplets, Zap, ThumbsUp, DollarSign, LayoutGrid, List,
  ArrowUp, ArrowDown, Map as GoogleMap,
  MoreHorizontal, Heart, ArrowLeft, ChevronLeft, MoreVertical, LocateFixed, Camera,
  LayoutDashboard, LogOut, Settings, BarChart3, Sliders, Navigation, Navigation2, Plus, Trash2, Menu, ChevronUp,
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer, Circle, ChevronDown, Banknote, Wifi, Coffee, TrendingUp, AlertCircle, MousePointer2
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

const createShopMarkerIcon = (isOpen, isActive = false) => {
  const color = isOpen ? "#FF8C00" : "#7B1113";
  const size = isActive ? 48 : 36;
  return L.divIcon({
    className: 'custom-shop-marker',
    html: `<div class="flex flex-col items-center group cursor-pointer drop-shadow-md">
      <div class="relative transition-all duration-300 transform ${isActive ? 'scale-110' : 'group-hover:-translate-y-1 group-hover:scale-110'}">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
        ${isOpen ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm"><div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div></div>' : ''}
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size]
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



const isShopOpen = (operatingHours) => {
  if (!operatingHours) return true;
  
  // New Object format (preferred)
  if (typeof operatingHours === 'object' && !Array.isArray(operatingHours)) {
    try {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const now = new Date();
      const dayName = days[now.getDay()]; 
      
      // Handle potential Map type or plain object
      const dayConfig = (operatingHours instanceof Map) 
        ? operatingHours.get(dayName) 
        : (operatingHours[dayName] || operatingHours[dayName.charAt(0).toUpperCase() + dayName.slice(1)]);

      // If no config for today, default to closed for safety
      if (!dayConfig || dayConfig.closed || !dayConfig.open || !dayConfig.close) return false;

      const [openH, openM] = dayConfig.open.split(':').map(Number);
      const [closeH, closeM] = dayConfig.close.split(':').map(Number);
      
      const currMins = now.getHours() * 60 + now.getMinutes();
      const openMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;

      if (openMins > closeMins) { // Overnight hours
          return currMins >= openMins || currMins <= closeMins;
      }
      return currMins >= openMins && currMins <= closeMins;
    } catch (e) {
      console.warn("Error parsing structured operating hours:", e);
      return true; 
    }
  }

  // Legacy String format
  try {
    const cleanHours = operatingHours.toString().replace(/\s+/g, ' ').trim().toUpperCase();
    if (cleanHours.includes('24')) return true;
    
    const segments = cleanHours.split(/[-\u2013\u2014]| TO /);
    if (segments.length !== 2) return true;
    
    const parseMins = (str) => {
      const match = str.trim().match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!match) return null;
      let [_, h, m, mdn] = match;
      h = parseInt(h); m = parseInt(m) || 0;
      mdn = mdn || (h < 12 ? 'AM' : 'PM');
      if (h === 12 && mdn === 'AM') h = 0;
      if (h < 12 && mdn === 'PM') h += 12;
      return h * 60 + m;
    };
    
    const startMins = parseMins(segments[0]);
    const endMins = parseMins(segments[1]);
    if (startMins === null || endMins === null) return true;
    
    const now = new Date();
    const currMins = now.getHours() * 60 + now.getMinutes();
    if (startMins > endMins) return currMins >= startMins || currMins <= endMins;
    return currMins >= startMins && currMins <= endMins;
  } catch (e) {
    return true;
  }
};

const formatOperatingHours = (operatingHours) => {
  if (!operatingHours) return 'Contact shop for hours';
  if (typeof operatingHours === 'string') return operatingHours;
  
  try {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const dayName = days[now.getDay()];
    
    const config = operatingHours[dayName] || operatingHours[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
    
    if (!config || config.closed) return 'Closed today';
    
    const to12h = (time) => {
      if (!time) return '';
      let [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    
    return `${to12h(config.open)} - ${to12h(config.close)}`;
  } catch (e) {
    return 'Contact shop for hours';
  }
};

const ShopMarkers = memo(({ shops, activeShopId, onSelectShop }) => {
  return (
    <>
      {shops.filter(s => !activeShopId || activeShopId === (s.id || s._id)).map(s => (
        <Marker
          key={s.id || s._id}
          position={[s.latitude, s.longitude]}
          icon={createShopMarkerIcon(isShopOpen(s.operatingHours), activeShopId === (s.id || s._id))}
          eventHandlers={{
            click: () => onSelectShop(s.id || s._id)
          }}
        />
      ))}
    </>
  );
}, (prev, next) => {
  return prev.shops === next.shops && prev.activeShopId === next.activeShopId;
});

const reviewCategories = [
  "Overall Service", "Cleanliness", "Folding Quality", "Fabric Care", "Smell/Fragrance"
];

function ReviewForm({ shopId, promisedTime, onPosted, onCancel }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wasOnTime, setWasOnTime] = useState(null);
  const [actualTimeTaken, setActualTimeTaken] = useState("");
  const [errors, setErrors] = useState({});
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
    const newErrors = {};
    if (rating === 0) newErrors.rating = "Please select a rating.";
    if (wasOnTime === null) newErrors.wasOnTime = "Please verify the turnaround time.";
    if (wasOnTime === false && (!actualTimeTaken || isNaN(actualTimeTaken))) {
      newErrors.actualTimeTaken = "Required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onPosted(shopId, { 
        rating, 
        comment, 
        reviewerName: isAnonymous ? "Anonymous User" : (user?.name || "Verified Customer"), 
        images, 
        userId: user?._id || user?.id,
        isAnonymous,
        wasOnTime,
        actualTimeTaken: !wasOnTime ? Number(actualTimeTaken) : null
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onCancel?.();
      }, 3000);
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
        <div className={`space-y-4 text-center p-6 rounded-[32px] transition-all ${errors.rating ? 'bg-red-50 border border-red-200' : ''}`}>
          <h3 className={`text-[14px] font-normal tracking-tight ${errors.rating ? 'text-red-500 font-bold' : 'text-[#1D1D1F]'}`}>Rate your experience</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => { setRating(s); setErrors(prev => ({ ...prev, rating: null })); }} className="p-1 transition-transform active:scale-95">
                <Star className={`w-10 h-10 ${s <= rating ? 'fill-[#E67E00] text-[#E67E00]' : errors.rating ? 'text-red-200' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-[12px] text-red-500 font-medium animate-fadeUp">{errors.rating}</p>}
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

        {/* Turnaround Verification - Matched to "What did you like?" style */}
        <div className={`space-y-3 px-2 p-4 rounded-[24px] transition-all ${errors.wasOnTime ? 'bg-red-50 border border-red-100' : ''}`}>
          <p className={`text-[14px] font-normal ${errors.wasOnTime ? 'text-red-500 font-bold' : 'text-[#1D1D1F]'}`}>
            Turnaround Verification (Promised: {promisedTime || 24}hrs)
            {errors.wasOnTime && <span className="ml-2 text-[12px] font-medium text-red-500 italic">* required</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setWasOnTime(true); setErrors(prev => ({ ...prev, wasOnTime: null })); }}
              className={`px-4 py-2 rounded-full text-[14px] font-normal border transition-all cursor-pointer ${
                wasOnTime === true 
                  ? "bg-[#014421] text-white border-[#014421]" 
                  : "bg-gray-50 text-gray-500 border-black/[0.02] hover:bg-gray-100"
              }`}
            >
              Yes, On Time
            </button>
            <button
              type="button"
              onClick={() => { setWasOnTime(false); setErrors(prev => ({ ...prev, wasOnTime: null })); }}
              className={`px-4 py-2 rounded-full text-[14px] font-normal border transition-all cursor-pointer ${
                wasOnTime === false 
                  ? "bg-[#7B1113] text-white border-[#7B1113]" 
                  : "bg-gray-50 text-gray-500 border-black/[0.02] hover:bg-gray-100"
              }`}
            >
              No, It Was Late
            </button>
          </div>
          
          {wasOnTime === false && (
            <div className="mt-3 space-y-2 animate-fadeUp">
              <p className="text-[14px] font-normal text-gray-500 pl-1">How many hours did it actually take?</p>
              <div className="relative max-w-[200px]">
                <style>
                  {`
                    input::-webkit-outer-spin-button,
                    input::-webkit-inner-spin-button {
                      -webkit-appearance: none;
                      margin: 0;
                    }
                    input[type=number] {
                      -moz-appearance: textfield;
                    }
                  `}
                </style>
                <input
                  type="number"
                  value={actualTimeTaken}
                  onChange={(e) => { 
                    setActualTimeTaken(e.target.value);
                    if (e.target.value) setErrors(prev => ({ ...prev, actualTimeTaken: null }));
                  }}
                  placeholder="e.g. 30"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-2 text-[14px] font-normal outline-none focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    errors.actualTimeTaken ? 'border-red-500 ring-2 ring-red-500/10' : 'border-black/[0.05] focus:border-[#7B1113]/20'
                  }`}
                />
                {errors.actualTimeTaken && <p className="text-[11px] text-red-500 font-bold mt-1 pl-1">Required</p>}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 px-2">
          <p className="text-[14px] font-normal text-[#1D1D1F]">Add photos (max 3)</p>
          <div className="flex gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-32 h-32 rounded-2xl overflow-hidden group/img shadow-md border border-black/[0.03]">
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
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#E67E00] hover:text-[#E67E00] hover:bg-[#E67E00]/5 transition-all group"
              >
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 pb-2">
          <button
            type="button"
            id="anonymous"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              isAnonymous ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                isAnonymous ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <label htmlFor="anonymous" className="text-[14px] font-normal text-gray-600 cursor-pointer select-none">
            Post Anonymously
          </label>
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
            {submitting ? "Posting..." : "Post"}
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
      <div className="modal-overlay flex items-center justify-center p-4 md:p-8 z-[1000] lg:pl-[320px]">
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
    <div className="modal-overlay flex items-center justify-center p-4 md:p-8 z-[1000] lg:pl-[320px]">
      <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[1000px] h-[95vh] md:h-[90vh] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.25)] animate-scaleIn flex flex-col relative font-outfit border border-black/5">
        <div className="sticky top-0 bg-white z-20">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <button onClick={onClose} className="w-fit p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all group">
              <ArrowLeft className="w-6 h-6 text-[#1D1D1F] group-hover:-translate-x-1 transition-transform" />
            </button>
            {showMatchScore && shop.score && (
              <button 
                onClick={() => onShowComputation(shop)}
                className="bg-[#F8F9FA] px-4 py-2 rounded-2xl border border-black/5 flex items-center gap-2 hover:bg-[#014421]/5 hover:border-[#014421]/20 transition-all cursor-help group shadow-sm active:scale-95"
                title="Click to see how this match was calculated"
              >
                <div className="w-5 h-5 rounded-full bg-[#014421]/5 flex items-center justify-center shrink-0 group-hover:bg-[#014421]/10">
                  <TrendingUp className="w-3 h-3 text-[#014421]" />
                </div>
                <span className="text-[14px] font-normal text-gray-400 group-hover:text-[#1D1D1F]">Match:</span>
                <span className="text-[14px] font-normal text-[#1D1D1F]">{(shop.score * 100).toFixed(0)}%</span>
              </button>
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
                    <img 
                      src={shop.image || "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80"} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="flex flex-col justify-start w-full">
                <h1 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight leading-none mb-2 mt-2 pl-2">{shop.name}</h1>
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
                      <p className="text-[14px] font-normal text-[#1D1D1F]">{formatOperatingHours(shop.operatingHours)}</p>
                    </div>
                    <div className="bg-[#F8F9FA] py-4 px-6 rounded-[32px] border border-black/[0.03] space-y-1 hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight block">Live Status</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[15px] font-normal ${isShopOpen(shop.operatingHours) ? 'text-emerald-600' : 'text-[#7B1113]'}`}>
                          {isShopOpen(shop.operatingHours) ? 'Open' : 'Closed'}
                        </span>
                      </div>
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
                    <div className="bg-[#F8F9FA] p-4 rounded-[24px] border border-black/[0.03] flex flex-col gap-1 items-center justify-center text-center hover:bg-white hover:shadow-sm transition-all duration-300 relative group/time">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight">Turnaround</span>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[14px] font-normal ${shop.actualTurnaroundTime > shop.turnaroundTime ? 'text-[#7B1113]' : 'text-[#014421]'}`}>
                          {shop.turnaroundTime} hrs
                        </p>
                      </div>
                    </div>

                    {/* Distance Card */}
                    <div className="bg-[#F8F9FA] p-4 rounded-[24px] border border-black/[0.03] flex flex-col gap-1 items-center justify-center text-center hover:bg-white hover:shadow-sm transition-all duration-300">
                      <span className="text-[14px] font-normal text-gray-400 tracking-tight">Distance</span>
                      <p className="text-[14px] font-normal text-[#014421]">{(shop.distance || 0).toFixed(1)} km</p>
                    </div>
                  </div>

                  {/* Warning Banner (Delayed Turnaround) */}
                  {shop.actualTurnaroundTime > shop.turnaroundTime && (
                    <div className="mt-2 bg-[#FFF5F4] border border-[#f5e3e2] border-l-4 border-l-[#E53935] rounded-xl p-4 shadow-sm">
                      <p className="text-[14px] text-[#4F4F4F] leading-relaxed">
                        <strong className="text-[#333333] font-semibold">Warning:</strong> The stated turnaround time is frequently exceeded by this shop. Based on recent customer reviews and tracking, the computed actual return time is <strong className="text-[#1D1D1F] font-semibold">{shop.actualTurnaroundTime} hours</strong>.
                      </p>
                    </div>
                  )}

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
                  promisedTime={shop.turnaroundTime}
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
    const { criterion, rating, actualValue, isBenefit, weight } = detail;
    const labels = {
      price: 'Price',
      turnaroundTime: 'Turnaround Time',
      rating: 'Rating',
      distance: 'Distance'
    };

    const isDelay = criterion === 'turnaroundTime' && shop.actualTurnaroundTime > shop.turnaroundTime;

    const percentage = Math.round(rating * 100);
    const weightPercent = Math.round(weight * 100);
    
    // Format actual value for display
    let formattedValue = actualValue;
    if (criterion === 'price') formattedValue = `₱${actualValue}`;
    else if (criterion === 'rating') formattedValue = `${actualValue} / 5`;
    else if (criterion === 'turnaroundTime') {
      formattedValue = isDelay ? `~${shop.actualTurnaroundTime}` : `${shop.turnaroundTime}`;
    }

    return { 
      label: labels[criterion], 
      percentage, 
      weightPercent,
      actualValue: formattedValue,
      promisedValue: criterion === 'turnaroundTime' ? shop.turnaroundTime : null,
      isDelay,
      icon: criterion === 'price' ? DollarSign :
            criterion === 'turnaroundTime' ? Timer :
            criterion === 'rating' ? Star : MapPin,
      unit: criterion === 'price' ? 'per kg' : 
            criterion === 'turnaroundTime' ? 'hrs' : 
            criterion === 'distance' ? 'km' : ''
    };
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-2 md:p-4 z-[2000] backdrop-blur-md bg-[#014421]/30 lg:pl-[320px]">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-[850px] max-h-[90vh] mt-2 md:mt-4 shadow-[0_40px_100px_rgba(1,68,33,0.15)] animate-scaleIn flex flex-col overflow-hidden border border-[#014421]/10 font-outfit">
        {/* Header (Minimalist Close Button Only) */}
        <div className="pt-6 pr-6 md:pt-8 md:pr-8 flex justify-end">
          <button onClick={onClose} className="p-2 hover:bg-[#014421]/10 rounded-full transition-all text-[#1D1D1F] hover:text-[#014421]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar space-y-10">
          {/* Top Section Layout: Gauge (Left) & Methodology (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 md:gap-4">
            {/* 1. Final Match Score - Gauge Design (Left) */}
            <section className="bg-gradient-to-b from-[#F9FBF9] to-white p-8 rounded-[32px] text-center border border-[#014421]/10 shadow-[0_4px_24px_rgba(1,68,33,0.03)] relative xl:col-span-2 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#04e672]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="w-[240px] md:w-[280px] mx-auto relative mb-4">
                {/* Semi-circle Gauge SVG */}
                <svg viewBox="0 0 100 60" className="w-full drop-shadow-[0_2px_8px_rgba(1,68,33,0.1)] overflow-visible">
                   <defs>
                     <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#04e672" />
                       <stop offset="100%" stopColor="#014421" />
                     </linearGradient>
                   </defs>
                   
                   {/* Dashed Background Arc */}
                   <path 
                     d="M 10 45 A 40 40 0 0 1 90 45" 
                     fill="none" 
                     stroke="#E4EFE7" 
                     strokeWidth="6" 
                     strokeLinecap="round" 
                     strokeDasharray="1.5 3.5" 
                   />

                   {/* Solid Foreground Arc */}
                   <path 
                     d="M 10 45 A 40 40 0 0 1 90 45" 
                     fill="none" 
                     stroke="url(#gaugeGradient)" 
                     strokeWidth="6" 
                     strokeLinecap="round" 
                     strokeDasharray="125.66" 
                     strokeDashoffset={125.66 * (1 - shop.score)}
                     className="transition-all duration-1000 ease-out"
                   />

                   {/* Labels 0 & 100 */}
                   <text x="10" y="56" fontSize="5" fill="#014421" opacity="0.4" textAnchor="middle" className="font-normal font-outfit tracking-tighter">0</text>
                   <text x="90" y="56" fontSize="5" fill="#014421" opacity="0.4" textAnchor="middle" className="font-normal font-outfit tracking-tighter">100</text>
                </svg>
                
                <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                   <div className="flex items-baseline mb-2">
                     <h4 className="text-[56px] md:text-[64px] font-normal text-[#1D1D1F] tracking-tighter leading-none">
                       {(shop.score * 100).toFixed(0)}
                     </h4>
                     <span className="text-[20px] font-normal text-[#014421]/40 ml-1">/ 100</span>
                   </div>
                </div>
              </div>

              <div className="relative z-10 px-2 mt-2">
                <p className="text-[14px] font-normal text-[#014421]/60 leading-relaxed max-w-[280px] mx-auto">
                  This shop is <span className="text-[#014421] bg-[#014421]/5 px-2 py-0.5 rounded-full font-medium">{Math.round(shop.score * 100)}% close</span> to the absolute ideal laundry shop based on your preferences.
                </p>
              </div>
            </section>

            {/* 2. Methodology Steps (Right) */}
            <div className="xl:col-span-3 bg-white p-6 md:p-8 rounded-[32px] border border-[#014421]/10 shadow-[0_4px_24px_rgba(1,68,33,0.03)] flex flex-col justify-center">
              <div className="mb-5 px-1">
                <h5 className="text-[16px] font-normal text-[#1D1D1F]">How we computed this match using TOPSIS</h5>
                <p className="text-[13px] font-normal text-[#014421]/60 mt-0.5">Technique for Order of Preference by Similarity to Ideal Solution</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1">
                <div className="bg-[#E4EFE7]/50 border border-[#014421]/15 p-5 rounded-[24px] shadow-[0_2px_10px_rgba(1,68,33,0.04)]">
                  <h6 className="text-[16px] font-normal text-[#014421] mb-1">Step 1: Normalization</h6>
                  <p className="text-[14px] font-normal text-[#014421]/80 leading-relaxed">We convert prices, distances, and ratings into a standardized metric scale so all different factors can be compared fairly.</p>
                </div>
                <div className="bg-[#014421]/[0.02] border border-[#014421]/5 p-5 rounded-[24px]">
                  <h6 className="text-[16px] font-normal text-[#1D1D1F] mb-1">Step 2: Preference weighting</h6>
                  <p className="text-[14px] font-normal text-[#014421]/60 leading-relaxed">We multiply these standardized scores by the priority weights you set. Factors you care about most get much higher points.</p>
                </div>
                <div className="bg-[#014421]/[0.02] border border-[#014421]/5 p-5 rounded-[24px]">
                  <h6 className="text-[16px] font-normal text-[#1D1D1F] mb-1">Step 3: Distance to ideal</h6>
                  <p className="text-[14px] font-normal text-[#014421]/60 leading-relaxed">We mathematically identify the absolute best and worst possible shop. We then measure how close this shop is to perfection.</p>
                </div>
                <div className="bg-[#E4EFE7]/50 border border-[#014421]/15 p-5 rounded-[24px] shadow-[0_2px_10px_rgba(1,68,33,0.04)]">
                  <h6 className="text-[16px] font-normal text-[#014421] mb-1">Step 4: Relative score</h6>
                  <p className="text-[14px] font-normal text-[#014421]/80 leading-relaxed">The closer the final mathematical distance is to 1.0, the better the shop matches your unique needs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Control Center Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-2">
            {/* Widget 1: Shop Value vs Your Preference (2 columns) */}
            <div className="flex flex-col h-full bg-[#F9FBF9] p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-[#014421]/15 shadow-[0_4px_24px_rgba(1,68,33,0.03)] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#04e672]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="mb-6 relative z-10">
                <h6 className="text-[16px] font-normal text-[#1D1D1F]">Shop Value vs Your Preference</h6>
                <p className="text-[14px] font-normal text-[#014421]/70 mt-0.5">Actual data against your priority ranking</p>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 relative z-10">
                <div className="flex justify-between text-[12px] font-normal text-[#014421]/60 uppercase tracking-wider px-2">
                  <span>Shop Value</span>
                  <span>Your Preference</span>
                </div>
                
                {[...shop.details].sort((a,b)=> b.weight - a.weight).map((detail, idx) => {
                  const info = getExplanation(detail);
                  const rank = idx + 1;
                  const priorityText = rank === 1 ? '1st Priority' : rank === 2 ? '2nd Priority' : rank === 3 ? '3rd Priority' : '4th Priority';
                  const labels = { price: 'Price', turnaroundTime: 'Time', distance: 'Distance', rating: 'Rating' };
                  
                  return (
                    <div key={detail.criterion} className="flex items-center justify-between bg-white p-4 md:px-6 rounded-[20px] shadow-[0_2px_8px_rgba(1,68,33,0.03)] border border-[#014421]/5">
                      <div className="flex flex-col">
                        <span className="text-[18px] md:text-[20px] font-normal text-[#1D1D1F] leading-none mb-1 shadow-sm-text">
                          {info.actualValue} <span className="text-[14px] text-[#014421]/60 font-medium">{info.unit}</span>
                        </span>
                        <span className="text-[13px] text-[#014421]/80 font-normal">{labels[detail.criterion]}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[13px] md:text-[14px] font-normal text-[#014421] bg-[#E4EFE7]/50 px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(1,68,33,0.04)] border border-[#014421]/15 whitespace-nowrap">
                           {priorityText}
                         </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 2: The Formula Rectangle */}
            <div className="bg-[#F9FBF9] p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-[#014421]/10 shadow-[0_4px_24px_rgba(1,68,33,0.03)] flex flex-col relative overflow-hidden">
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#04e672]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="mb-6 relative z-10">
                 <h6 className="text-[16px] font-normal text-[#1D1D1F]">Formula</h6>
                 <p className="text-[14px] font-normal text-[#014421]/60 mt-0.5">The exact TOPSIS mathematical equation</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[24px] p-6 border border-[#014421]/5 shadow-[0_2px_12px_rgba(1,68,33,0.03)] relative z-10">
                 <div className="text-center w-full">
                   {/* Styled Mathematical Equation */}
                   <div className="flex items-center justify-center gap-3 text-[22px] font-normal text-[#1D1D1F] font-serif tracking-widest pt-4">
                     <span className="italic flex items-center text-[#014421]">S<sub className="text-[14px] italic relative top-1">i</sub></span>
                     <span className="mx-1 text-[#014421]/40">=</span>
                     <div className="flex flex-col items-center justify-center">
                       <span className="border-b-[1.5px] border-[#014421]/30 md:px-6 pb-1.5 mb-1.5 flex items-center italic">
                         D<sub className="text-[12px] italic relative top-1">i</sub><sup className="text-[12px] italic relative bottom-2">-</sup>
                       </span>
                       <span className="flex items-center italic">
                         D<sub className="text-[12px] italic relative top-1">i</sub><sup className="text-[12px] italic relative bottom-2">+</sup> <span className="mx-2 not-italic text-[#014421]/40">+</span> D<sub className="text-[12px] italic relative top-1">i</sub><sup className="text-[12px] italic relative bottom-2">-</sup>
                       </span>
                     </div>
                   </div>
                   
                   {/* Legend / Key */}
                   <div className="text-[13px] text-[#014421]/60 text-left w-full mt-10 space-y-3 border-t border-[#014421]/10 pt-5">
                     <p className="flex items-start gap-2">
                       <span className="text-[#014421] font-serif italic whitespace-nowrap w-[24px]">S<sub className="text-[9px]">i</sub></span> 
                       <span><strong className="font-medium text-[#1D1D1F]">Final Relative Score</strong> (Closer to 1 is better)</span>
                     </p>
                     <p className="flex items-start gap-2">
                       <span className="text-[#1D1D1F] font-serif italic whitespace-nowrap w-[24px]">D<sub className="text-[9px]">+</sub></span> 
                       <span>Distance to the absolute <strong className="font-medium text-[#1D1D1F]">ideal</strong> shop</span>
                     </p>
                     <p className="flex items-start gap-2">
                       <span className="text-[#1D1D1F] font-serif italic whitespace-nowrap w-[24px]">D<sub className="text-[9px]">-</sub></span> 
                       <span>Distance from the absolute <strong className="font-medium text-[#1D1D1F]">worst</strong> shop</span>
                     </p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-[#014421]/5 bg-[#F9FBF9]/80 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-[#014421] text-white rounded-2xl text-[14px] font-medium hover:bg-[#028540] transition-all shadow-[0_4px_16px_rgba(1,68,33,0.3)] active:scale-95"
          >
            Close
          </button>
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
  const [shops, setShops] = useState([]);
  const [shopReviews, setShopReviews] = useState({});
  const [activeRouteShopId, setActiveRouteShopId] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [showWeightManual, setShowWeightManual] = useState(false);
  const [showPriorityManual, setShowPriorityManual] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchPreview, setMatchPreview] = useState(null);
  const [surveyStep, setSurveyStep] = useState(1);

  const handleMovePriority = (index, direction) => {
    const newPriorities = [...priorities];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPriorities.length) return;
    
    // Swap elements
    const temp = newPriorities[index];
    newPriorities[index] = newPriorities[targetIndex];
    newPriorities[targetIndex] = temp;
    
    setPriorities(newPriorities);
    setIsApplied(false);
  }; // 1: 4 Questions, 2: Priority, 3: Results

  // New Filter & Sort State
  const [activeSort, setActiveSort] = useState('price');
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

  // Reset map and modal states when changing tabs
  useEffect(() => {
    setActiveRouteShopId(null);
    setRoutePath([]);
    setSelectedShop(null);
    setShowComputation(null);
    setActiveImageGallery(null);
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
    
    // In Computation results, we show details beside the list, not in a popup
    if (sidebarTab === "computation" && surveyStep === 3) {
      setMatchPreview(shop);
      const shopId = shop._id || shop.id;
      if (shopId) {
        api.get(`/reviews/${shopId}`)
          .then(({ data }) => setShopReviews(prev => ({ ...prev, [shopId]: data })))
          .catch(() => { });
      }
      return;
    }

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
      const { data: review } = await api.post("/reviews", { ...payload, shopId });

      // Refresh reviews list for the modal
      const { data: updatedReviews } = await api.get(`/reviews/${shopId}`);
      setShopReviews(prev => ({ ...prev, [shopId]: updatedReviews }));

      // Also refresh shop data (rating and reviewCount) from backend
      const { data: updatedShop } = await api.get(`/shops/${shopId}`);
      if (updatedShop) {
        setShops(prevShops =>
          prevShops.map(s => (s.id === shopId || s._id === shopId)
            ? { ...s, rating: updatedShop.rating, reviewCount: updatedShop.reviewCount, actualTurnaroundTime: updatedShop.actualTurnaroundTime, reliabilityScore: updatedShop.reliabilityScore }
            : s)
        );
        setSelectedShop(prev => prev ? { ...prev, rating: updatedShop.rating, reviewCount: updatedShop.reviewCount, actualTurnaroundTime: updatedShop.actualTurnaroundTime, reliabilityScore: updatedShop.reliabilityScore } : null);
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

  const handleLogout = () => { logout(); navigate("/"); };

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

  // Auto-select first match in Step 3
  useEffect(() => {
    if (surveyStep === 3 && !matchPreview && top3.length > 0) {
      handleSelectShop(top3[0]);
    }
    // Clean up preview if we go back to step 1
    if (surveyStep === 1) setMatchPreview(null);
  }, [surveyStep, top3, matchPreview]);

  const filteredShops = useMemo(() => {
    let result = [...rankedShops];

    // Applying Filters
    if (filters.rating > 0) result = result.filter(s => s.rating >= filters.rating);
    if (filters.price < 100) result = result.filter(s => s.price <= filters.price);
    if (filters.distance < 50) result = result.filter(s => s.distance <= filters.distance);
    if (filters.openNow) result = result.filter(s => isShopOpen(s.operatingHours));

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
            <div className="flex flex-row items-stretch gap-3 md:gap-6 h-[160px]">
              <div 
                className="flex-1 rounded-[24px] md:rounded-[40px] px-5 py-6 md:px-10 md:py-8 text-white shadow-2xl relative flex flex-col justify-center gap-4 h-full bg-no-repeat overflow-hidden"
                style={{
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 55%',
                  backgroundImage: `linear-gradient(to bottom, rgba(13, 58, 44, 0.4), rgba(13, 58, 44, 0.85)), url('/welcome-bg.png')`
                }}
              >
                <div className="relative z-10 w-full flex items-center">
                  <h2 className="text-[28px] md:text-[38px] font-normal tracking-tighter leading-none font-outfit truncate pr-4 mt-2">Welcome, {user?.name?.split(' ')[0] || 'Maria'}</h2>
                </div>
                <div className="relative z-30 self-end w-full md:max-w-[70%] lg:max-w-xl flex-shrink-0 pointer-events-auto group">
                  <input
                    type="text"
                    placeholder="Search laundry shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full h-12 md:h-16 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[24px] md:rounded-[32px] pl-14 md:pl-16 pr-6 text-white text-[14px] md:text-[15px] font-medium shadow-2xl focus:bg-white focus:text-[#1D1D1F] focus:ring-8 focus:ring-black/10 transition-all duration-500 outline-none placeholder:text-white/60 placeholder:font-normal"
                  />
                  <div className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-white group-focus-within:text-[#014421] transition-colors pointer-events-none">
                    <Search className="w-4 h-4 md:w-6 md:h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  </div>
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
              <div className="flex flex-col justify-between gap-2 h-[160px]">
                <button onClick={() => setSidebarTab("computation")} className="w-[58px] md:w-[70px] flex-1 rounded-[16px] md:rounded-[20px] bg-[#7B1113] shadow-lg flex items-center justify-center group transition-all hover:scale-105 shrink-0">
                  <Sliders className="w-6 h-6 md:w-7 md:h-7 text-white transition-all" />
                </button>
                <button onClick={() => setSidebarTab("map")} className="w-[58px] md:w-[70px] flex-1 rounded-[16px] md:rounded-[20px] bg-[#FF8C00] shadow-lg flex items-center justify-center group transition-all hover:scale-105 shrink-0">
                  <LocateFixed className="w-6 h-6 md:w-7 md:h-7 text-white transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCROLLABLE CONTENT (shops grid / computation) ── */}
        <div className={`flex-1 overflow-y-auto no-scrollbar animate-fadeUp ${sidebarTab === "overview" ? "px-6 md:px-10 pb-10 pt-3" : (sidebarTab === "computation" ? "p-0" : "p-6 md:p-10")}`}>


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
                        {activeSort === 'distance' ? 'By Distance' : 
                         activeSort === 'price' ? 'Lowest Price' :
                         activeSort === 'rating' ? 'Highest Rating' :
                         activeSort === 'topsis' ? 'Best Match' : 'Sort by'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showSortDropdown && (
                        <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-[24px] shadow-2xl border border-black/[0.05] py-3 z-[150] animate-fadeUp">
                          {[
                            { id: 'distance', label: 'By Distance' },
                            { id: 'price', label: 'Lowest Price' },
                            { id: 'rating', label: 'Highest Rating' },
                            ...(isApplied ? [{ id: 'topsis', label: 'Best Match' }] : []),
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
                    onClick={() => handleSelectShop(s)}
                    className={`bg-white rounded-[24px] md:rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm transition-all overflow-hidden p-3 md:p-4 cursor-pointer hover:shadow-xl group`}
                  >
                    <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-2">
                      <img
                        src={s.image || "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80"}
                        alt={s.name}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";
                        }}
                      />
                      <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all shadow-md backdrop-blur-md ${isShopOpen(s.operatingHours) ? 'bg-white/90 border-[#228B22]/20 text-[#228B22]' : 'bg-white/90 border-[#7B1113]/20 text-[#7B1113]'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isShopOpen(s.operatingHours) ? 'bg-[#228B22]' : 'bg-[#7B1113]'}`} />
                        <span className="text-[12px] font-normal capitalize tracking-wide">{isShopOpen(s.operatingHours) ? 'open' : 'closed'}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2 pointer-events-none">
                        {isApplied && s.score > 0 && (
                          <div
                            onClick={(e) => { e.stopPropagation(); setShowComputation(s); }}
                            className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2.5 border border-white/20 shadow-xl cursor-help transition-all hover:scale-105 active:scale-95 group/match pointer-events-auto"
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
                    </div>
                    <div className="px-2 py-3 space-y-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight leading-normal font-outfit truncate py-0.5">{s.name}</h4>
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className={`w-3.5 h-3.5 ${s.actualTurnaroundTime >= s.turnaroundTime + 0.5 ? 'text-[#7B1113]' : 'text-[#1D1D1F]'}`} />
                          <span className={`text-[12px] font-medium lowercase ${s.actualTurnaroundTime >= s.turnaroundTime + 0.5 ? 'text-[#7B1113]' : 'text-[#1D1D1F]'}`}>
                            {s.turnaroundTime} hrs
                          </span>
                        </div>
                        {s.actualTurnaroundTime >= s.turnaroundTime + 0.5 && (
                          <div className="relative group/badge">
                            <div className="flex items-center px-1.5 py-[2px] rounded bg-[#FFF5F5] border border-[#7B1113]/25 shadow-sm cursor-help transition-all">
                              <span className="text-[10px] font-bold text-[#7B1113] uppercase tracking-wide leading-[1] whitespace-nowrap pt-[0.5px]">Delays Reported</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1D1D1F] text-white text-[11px] font-normal rounded-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl z-50 text-center">
                              Actual time: <span className="font-bold text-[#E53935]">{s.actualTurnaroundTime} hrs</span>
                              <span className="block opacity-60 text-[9px] mt-0.5">computed from recent reviews</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1D1D1F]" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-normal text-[#7B1113] tracking-tight font-outfit leading-none">₱{s.price}<span className="text-[12px] font-normal text-[#7B1113]/60 lowercase ml-1">/kg</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sidebarTab === "computation" && (() => {
            const surveyQuestions = [
              { id: "distance", icon: <Navigation2 className="w-3.5 h-3.5" />, label: "How far are you willing to travel?", subtitle: "We will highlight shops within your preferred range",
                options: [{ label: "Very Near", sub: "Under 1 km", value: 1 },{ label: "Walking", sub: "1-3 km", value: 3 },{ label: "Anywhere", sub: "3 km+", value: 10 }], stateKey: "distance" },
              { id: "price", icon: <Banknote className="w-3.5 h-3.5" />, label: "What is your ideal budget per kilogram?", subtitle: "We will prioritize shops within your range",
                options: [{ label: "Budget", sub: "P1-P25/kg", value: 20 },{ label: "Moderate", sub: "P26-P50/kg", value: 45 },{ label: "Premium", sub: "P51+/kg", value: 80 }], stateKey: "price" },
              { id: "time", icon: <Timer className="w-3.5 h-3.5" />, label: "How fast do you need your laundry done?", subtitle: "Turnaround time preference",
                options: [{ label: "Same Day", sub: "1-6 hrs", value: 5 },{ label: "Next Day", sub: "7-18 hrs", value: 14 },{ label: "Flexible", sub: "18-48 hrs", value: 30 }], stateKey: "time" },
              { id: "rating", icon: <Star className="w-3.5 h-3.5" />, label: "How important are shop ratings to you?", subtitle: "Minimum acceptable rating from customers",
                options: [{ label: "Any Shop", sub: "1.0+ stars", value: 1 },{ label: "Good", sub: "3.0+ stars", value: 3 },{ label: "Excellent", sub: "4.5+ stars", value: 4.5 }], stateKey: "rating" }
            ];

            const answeredCount = surveyQuestions.filter(q => q.options.some(o => o.value === weights[q.stateKey])).length;
            const isFirstStepDone = answeredCount === 4;
            return (
              <div className="h-full flex flex-col bg-white overflow-hidden animate-fadeUp">

                {/* ── FIXED HEADER ── */}
                <div className="sticky top-0 bg-white z-30 pt-10 md:pt-[72px] pb-6 px-4 md:px-10 border-b border-black/[0.03]">
                  <div className="text-center mb-10">
                    <h1 className="text-[24px] md:text-[28px] font-medium tracking-tight text-[#1D1D1F] font-outfit mb-2">Computation</h1>
                    <p className="text-[14px] text-black/40 font-normal">Let's find the best shop for your specific needs.</p>
                  </div>


                  {/* ── STEP INDICATOR ── */}
                  <div className="flex items-center justify-center mb-16 px-4 max-w-4xl mx-auto w-full">
                    {[1, 2, 3].map((num, i) => {
                      const isActive = surveyStep === num;
                      const isPassed = surveyStep > num;
                      const labels = ["Preferences", "Ranking", "Results"];
                      return (
                        <Fragment key={num}>
                          <div className="flex flex-col items-center relative z-10 shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${
                              isActive 
                                ? "bg-white border-[#014421] shadow-md scale-105" 
                                : isPassed 
                                  ? "bg-[#014421] border-[#014421] text-white" 
                                  : "bg-white border-black/10"
                            }`}>
                              {isPassed ? (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              ) : isActive ? (
                                <div className="w-1.5 h-1.5 bg-[#014421] rounded-full" />
                              ) : null}
                            </div>
                            <span className={`absolute top-full mt-3 text-[12px] font-normal tracking-tight whitespace-nowrap ${isActive || isPassed ? "text-[#1D1D1F]" : "text-black/20"}`}>
                              {labels[i]}
                            </span>
                          </div>
                          {i < 2 && (
                            <div className={`flex-1 h-[1px] mx-2 md:mx-4 transition-all ${
                              isPassed ? "bg-[#014421]/20" : "bg-black/[0.05]"
                            }`} />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* ── SCROLLABLE CONTENT ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-12 py-10 custom-scrollbar overscroll-contain">
                  <div className="max-w-[1400px] mx-auto w-full">
                    <div className="min-h-full flex flex-col">

                  {surveyStep === 1 && (
                    <div className="flex flex-col gap-6 max-w-full w-full animate-fadeUp">
                      <div className="mb-10 text-left">
                        <h2 className="text-[18px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Set your preferences</h2>
                        <p className="text-[14px] text-black/40 font-normal">Adjust the sliders below</p>
                      </div>









                      <div className="space-y-12">
                        {[
                          { id: "distance", label: "Distance (km)", sub: "Maximum distance you'd travel", min: 1, max: 20, unit: "km", stateKey: "distance" },
                          { id: "price", label: "Price (₱/kg)", sub: "Maximum affordable price per kg", min: 10, max: 100, unit: "₱", stateKey: "price" },
                          { id: "time", label: "Turnaround time (hrs)", sub: "Maximum acceptable waiting time", min: 6, max: 72, unit: "hrs", stateKey: "time" },
                          { id: "rating", label: "Ratings", sub: "Minimum acceptable star rating", min: 1, max: 5, step: 0.5, unit: "stars", stateKey: "rating" }
                        ].map((q) => {
                          const val = weights[q.stateKey];
                          const percent = ((val - q.min) / (q.max - q.min)) * 100;
                          
                          return (
                            <div key={q.id} className="space-y-4">
                              <div className="flex justify-between items-end gap-4">
                                <div className="space-y-1 flex-1">
                                  <h4 className="text-[14px] font-normal text-[#1D1D1F] font-outfit">{q.label}</h4>
                                  <p className="text-[14px] text-black/40 font-normal">{q.sub}</p>
                                </div>
                                
                                {/* Right-Aligned Fixed Width Numbers */}
                                <div className="text-right flex items-baseline justify-end gap-1.5 w-[90px] shrink-0">
                                  <span className="text-[24px] font-medium text-[#555555] tracking-tight font-outfit">{val}</span>
                                  <span className="text-[14px] text-[#555555]/60 font-medium">{q.id === 'rating' ? '' : q.unit}</span>
                                </div>
                              </div>
                              
                              <div className="relative pt-4 pb-2 w-full">
                                <div className="relative h-2 w-full bg-[#E5E7EB] rounded-full">
                                  {/* Active Fill Track */}
                                  <div 
                                    className="absolute top-0 left-0 h-full bg-[#555555] rounded-full pointer-events-none transition-all duration-75"
                                    style={{ width: `${percent}%` }}
                                  />
                                  
                                  {/* Minimal Style Thumb */}
                                  <div 
                                    className="absolute top-1/2 w-4 h-4 bg-white border-[3px] border-[#555555] rounded-full pointer-events-none z-10 transition-all duration-75 shadow-md"
                                    style={{ left: `${percent}%`, transform: `translate(-50%, -50%)` }}
                                  />

                                  {/* Invisible Interactive Range Input */}
                                  <input
                                    type="range"
                                    min={q.min}
                                    max={q.max}
                                    step={q.step || 1}
                                    value={val}
                                    onChange={(e) => {
                                      setWeights(prev => ({ ...prev, [q.stateKey]: parseFloat(e.target.value) }));
                                      setIsApplied(false);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 z-20"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                                     {/* No local footer here anymore, moved to global footer block */}
                    </div>
                  )}

                  {surveyStep === 2 && (
                    <div className="flex flex-col gap-8 max-w-full w-full animate-fadeUp">
                      <div className="mb-10 text-left">
                        <h2 className="text-[18px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Rank the factors</h2>
                        <p className="text-[14px] text-black/40 font-normal">Drag or use arrows to set priority</p>
                      </div>









                      <div className="space-y-4">
                        {priorities.map((key, index) => {
                          const labelMapping = {
                            price: { label: "Price", desc: "How much you value cost savings" },
                            distance: { label: "Distance", desc: "How much distance matters" },
                            time: { label: "Turnaround time", desc: "Need for rapid service turnaround" },
                            rating: { label: "Ratings", desc: "User review and quality weighting" }
                          };
                          const factor = labelMapping[key];

                          return (
                            <div key={key} className="bg-white p-5 rounded-[24px] border-2 border-black/[0.04] flex items-center gap-6 animate-fadeUp transition-all hover:border-[#014421]/20 h-28" style={{ animationDelay: `${index * 100}ms` }}>
                              <div className="w-14 h-14 rounded-full bg-[#F1F8F4] flex items-center justify-center text-[#014421] text-xl font-normal font-outfit">{index + 1}</div>

                              <div className="flex-1">
                                <h4 className="text-[14px] font-normal text-[#1D1D1F] font-outfit">{factor.label}</h4>

                                <p className="text-[14px] text-black/40 font-normal">{factor.desc}</p>
                              </div>



                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleMovePriority(index, -1)}
                                  disabled={index === 0}
                                  className="w-12 h-12 rounded-2xl border border-black/[0.05] hover:bg-black/[0.02] flex items-center justify-center disabled:opacity-5 transition-all active:scale-90"
                                >
                                  <ChevronUp className="w-6 h-6 text-black/40" />
                                </button>
                                <button 
                                  onClick={() => handleMovePriority(index, 1)}
                                  disabled={index === priorities.length - 1}
                                  className="w-12 h-12 rounded-2xl border border-black/[0.05] hover:bg-black/[0.02] flex items-center justify-center disabled:opacity-5 transition-all active:scale-90"
                                >
                                  <ChevronDown className="w-6 h-6 text-black/40" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {surveyStep === 3 && (
                  <div className="flex flex-col gap-10 max-w-full w-full animate-fadeUp">
                      <div className="flex flex-col lg:flex-row gap-10 items-stretch">
                        
                        {/* ── LEFT: MATCH LIST (Fixed Sidebar) ── */}
                        <div className="w-full lg:w-[420px] shrink-0 space-y-10">
                          <div className="text-left px-2">
                            <h2 className="text-[20px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Best matches</h2>
                            <p className="text-[14px] text-black/40 font-normal tracking-tight">Top recommendations based on your profile.</p>
                          </div>

                          <div className="space-y-4">
                            {top3.map((s, i) => {
                              const isActive = matchPreview?.id === s.id || matchPreview?._id === s._id;
                              const score = (s.score * 100).toFixed(0);
                              
                              return (
                                <div
                                  key={s.id || s._id || i}
                                  onClick={() => handleSelectShop(s)}
                                  className={`group flex items-center justify-between p-8 md:p-10 rounded-[40px] border-2 transition-all duration-300 cursor-pointer relative overflow-hidden gap-4 ${
                                    isActive 
                                      ? "bg-white border-[#014421] shadow-[0_8px_30px_rgb(0,0,0,0.08)] scale-[1.02] z-10" 
                                      : "bg-[#F8F9FA]/50 border-black/[0.04] hover:bg-white hover:border-[#014421]/20 hover:shadow-lg"
                                  }`}
                                >
                                  {/* Glassmorphism Ghost Background */}
                                  <div 
                                    className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700 grayscale ${isActive ? 'opacity-[0.06] blur-[2px] scale-105' : 'opacity-[0.02] blur-[4px] scale-100'}`} 
                                    style={{
                                      backgroundImage: `url(${s.image || "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80"})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  />
                                  {/* Fade gradient to ensure text readability */}
                                  <div className={`absolute inset-0 z-0 bg-gradient-to-r ${isActive ? 'from-white via-white/80' : 'from-[#F8F9FA] via-[#F8F9FA]/90'} to-transparent pointer-events-none`} />

                                  <div className="space-y-3 flex-1 min-w-[200px] relative z-10">
                                     <div className={`text-[11px] font-medium uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-[#014421]' : 'text-black/40'}`}>
                                        #{i + 1} Best Match
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <h4 className={`text-[20px] font-normal leading-normal font-outfit truncate pb-1 transition-colors ${isActive ? 'text-[#014421]' : 'text-[#1D1D1F]'}`}>
                                           {s.name}
                                        </h4>
                                        {s.permitStatus === 'approved' && (
                                          <div className="w-5 h-5 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-sm border border-white/20" title="Verified Permitted Shop">
                                            <Check className="w-3 h-3 text-white stroke-[3]" />
                                          </div>
                                        )}
                                     </div>
                                  </div>

                                  {/* Animated Progress Ring */}
                                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 z-10 ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'}`}>
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                                      <circle 
                                        cx="50" cy="50" r="44" 
                                        fill="none" 
                                        stroke={isActive ? "rgba(1,68,33,0.1)" : "rgba(0,0,0,0.05)"} 
                                        strokeWidth="5" 
                                      />
                                      <circle 
                                        cx="50" cy="50" r="44" 
                                        fill="none" 
                                        stroke={isActive ? "#014421" : "rgba(1,68,33,0.25)"} 
                                        strokeWidth="5" 
                                        strokeLinecap="round"
                                        strokeDasharray="276.46"
                                        strokeDashoffset={276.46 - (s.score * 276.46)}
                                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                      />
                                    </svg>
                                    <span className={`text-[20px] font-normal leading-none font-outfit tracking-tight ${isActive ? 'text-[#014421]' : 'text-black/50'}`}>{score}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                          <div className="flex-1 sticky top-0 animate-fadeLeft">
                          {matchPreview ? (
                            <div className="bg-white rounded-[44px] border border-black/[0.1] shadow-2xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
                              {/* Modal Header */}
                              <div className="px-8 py-6 border-b border-black/[0.03] flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                 <div className="w-fit p-2.5" />
                                 <button 
                                   onClick={() => setShowComputation(matchPreview)}
                                   className="bg-[#014421]/5 px-5 py-2.5 rounded-full border border-[#014421]/10 flex items-center gap-3 shadow-sm hover:bg-[#014421] hover:text-white transition-all group/match"
                                 >
                                    <TrendingUp className="w-4 h-4 text-[#014421] group-hover/match:text-white" />
                                    <div className="flex items-center gap-2 text-[14px] font-normal">
                                       <span className="opacity-50 group-hover/match:opacity-80">Match:</span>
                                       <span className="font-medium">{(matchPreview.score * 100).toFixed(0)}%</span>
                                       <div className="w-[1px] h-3 bg-black/10 group-hover/match:bg-white/20 mx-1" />
                                       <span className="group-hover/match:translate-x-0.5 transition-transform">View computation</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover/match:opacity-100 group-hover/match:translate-x-0.5 transition-all" />
                                 </button>
                              </div>

                              <div className="flex h-full min-h-0 flex-col md:flex-row overflow-y-auto custom-scrollbar p-2">
                                 {/* LEFT: PICTURE & INSIGHTS */}
                                 <div className="w-full md:w-[45%] p-8 pr-4 shrink-0 flex flex-col h-full">
                                   <div className="flex-1 h-full w-full rounded-[44px] overflow-hidden shadow-2xl relative group">
                                      <img 
                                        src={matchPreview.image} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt={matchPreview.name} 
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                      <div className={`absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all shadow-md backdrop-blur-md ${isShopOpen(matchPreview.operatingHours) ? 'bg-white/90 border-[#228B22]/20 text-[#228B22]' : 'bg-white/90 border-[#7B1113]/20 text-[#7B1113]'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isShopOpen(matchPreview.operatingHours) ? 'bg-[#228B22]' : 'bg-[#7B1113]'} ${isShopOpen(matchPreview.operatingHours) ? 'animate-pulse' : ''}`} />
                                        <span className="text-[12px] font-normal tracking-wide capitalize">{isShopOpen(matchPreview.operatingHours) ? 'open' : 'closed'}</span>
                                      </div>
                                   </div>

                                 </div>

                                 {/* RIGHT: CORE DETAILS */}
                                 <div className="flex-1 p-8 pl-4 h-full flex flex-col justify-between">
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-3">
                                          <h3 className="text-[32px] font-normal font-outfit text-[#1D1D1F] tracking-tight leading-none">{matchPreview.name}</h3>
                                          {matchPreview.permitStatus === 'approved' && (
                                             <div className="w-6 h-6 rounded-full bg-[#228B22] flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                                             </div>
                                          )}
                                       </div>
                                       <div className="bg-[#F8F9FA] rounded-full px-6 py-4 border border-black/[0.03] space-y-0.5">
                                          <span className="text-[12px] font-normal text-gray-400 tracking-tight block ml-1">Location address</span>
                                          <p className="text-[14px] font-normal text-[#1D1D1F] leading-tight ml-1">{matchPreview.address}</p>
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                       <div className="bg-[#F8F9FA] py-4 px-6 rounded-full border border-black/[0.03] space-y-0.5 group">
                                          <span className="text-[12px] font-normal text-gray-400 tracking-tight block ml-1">Operating hours</span>
                                          <p className="text-[14px] font-normal text-[#1D1D1F] ml-1">{formatOperatingHours(matchPreview.operatingHours)}</p>
                                       </div>
                                       <div className="bg-[#F8F9FA] py-4 px-6 rounded-full border border-black/[0.03] space-y-0.5 group">
                                          <span className="text-[12px] font-normal text-gray-400 tracking-tight block ml-1">Live Status</span>
                                          <p className={`text-[14px] font-normal ${isShopOpen(matchPreview.operatingHours) ? 'text-emerald-600' : 'text-[#7B1113]'} capitalize ml-1`}>
                                             {isShopOpen(matchPreview.operatingHours) ? 'Open' : 'Closed'}
                                          </p>
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                       {[
                                          { label: "Price", value: `₱${matchPreview.price}/kg`, color: 'text-[#7B1113]' },
                                          { label: "Turnaround", value: `${matchPreview.turnaroundTime} hrs`, color: 'text-[#014421]' },
                                          { label: "Distance", value: `${matchPreview.distance?.toFixed(1)} km`, color: 'text-[#1D1D1F]' }
                                       ].map((stat, si) => (
                                          <div key={si} className="bg-[#F8F9FA] px-4 py-3 rounded-full border border-black/[0.03] flex flex-col items-center justify-center text-center">
                                             <span className="text-[12px] font-normal text-gray-400 mb-0.5">{stat.label}</span>
                                             <p className={`text-[14px] font-normal ${stat.color}`}>{stat.value}</p>
                                          </div>
                                       ))}
                                    </div>

                                    {matchPreview.actualTurnaroundTime > matchPreview.turnaroundTime && (
                                       <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl">
                                          <p className="text-[13px] font-normal text-red-800 leading-snug">
                                             <span className="font-bold">Warning:</span> The stated turnaround time is frequently exceeded. Actual computed return time is <span className="font-bold">{matchPreview.actualTurnaroundTime} hours</span>.
                                          </p>
                                       </div>
                                    )}

                                    <div className="pt-2">
                                       <button
                                          onClick={() => { setSidebarTab("map"); setActiveRouteShopId(matchPreview.id || matchPreview._id); }}
                                          className="w-full py-5 rounded-full border-2 border-black/10 text-[14px] font-normal text-[#1D1D1F] flex items-center justify-center gap-3 hover:bg-[#F8F9FA] transition-all group/nav"
                                       >
                                          Get directions
                                          <Navigation className="w-4 h-4 fill-[#014421] text-[#014421] group-hover/nav:animate-bounce" />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#F8F9FA] rounded-[48px] border-2 border-dashed border-black/[0.05] h-[600px] flex flex-col items-center justify-center p-12 text-center group">
                               <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border border-black/[0.05] mb-8 transition-all group-hover:scale-110 shadow-sm">
                                  <MousePointer2 className="w-10 h-10 text-black/10" />
                               </div>
                               <h4 className="text-[18px] font-normal font-outfit text-[#1D1D1F] mb-3">Shop Profile</h4>
                               <p className="text-[14px] text-black/30 font-normal max-w-[240px] leading-relaxed">Select a candidate from the left to begin the technical evaluation and review the shop profile.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── FIXED FOOTER ── */}
            <div className="sticky bottom-0 bg-white z-30 py-6 px-4 md:px-12 border-t border-black/[0.03]">
              <div className="max-w-[1400px] mx-auto w-full">
                {surveyStep === 1 && (
                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => setSurveyStep(2)}
                      className="w-[200px] h-[56px] rounded-full bg-[#014421] text-white font-normal text-[14px] flex items-center justify-center transition-all hover:scale-[1.02] shadow-xl shadow-[#014421]/20 border-2 border-white/10"
                    >
                      Next
                    </button>
                  </div>
                )}
                {surveyStep === 2 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSurveyStep(1)}
                      className="text-[14px] text-black/40 font-normal hover:text-[#014421] transition-all flex items-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setIsApplied(true);
                        setSurveyStep(3);
                      }}
                      className="w-[200px] h-[56px] rounded-full bg-[#014421] text-white font-normal text-[14px] flex items-center justify-center transition-all hover:scale-[1.02] shadow-xl shadow-[#014421]/20 border-2 border-white/10"
                    >
                      Discover Best Matches
                    </button>
                  </div>
                )}
                {surveyStep === 3 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSurveyStep(2)}
                      className="text-[14px] text-black/40 font-normal hover:text-[#014421] transition-all flex items-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button 
                      onClick={() => { 
                        setSurveyStep(1); 
                        setIsApplied(false); 
                      }}
                      className="w-[200px] h-[56px] rounded-full border-2 border-[#014421] font-normal text-[14px] text-[#014421] hover:bg-[#014421] hover:text-white transition-all flex items-center justify-center hover:scale-[1.02] shadow-[0_4px_14px_rgba(1,68,33,0.08)] bg-white active:scale-95"
                    >
                      Reset survey
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}


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

                  {/* Show all filtered shops on map */}
                  <ShopMarkers 
                    shops={filteredShops} 
                    activeShopId={activeRouteShopId} 
                    onSelectShop={setActiveRouteShopId} 
                  />

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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSidebarTab("overview"); setActiveRouteShopId(null); }}
                      className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-[#1D1D1F] shadow-md hover:bg-[#1D1D1F] hover:text-white transition-all transform active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                    </button>

                    <div className="relative flex-1 md:w-[480px] group/input shadow-sm rounded-full border border-black/[0.02]">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        onFocus={() => setShowMapSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowMapSuggestions(false), 200)}
                        className="w-full h-12 md:h-14 bg-[#F0F0F0] rounded-full pl-6 pr-14 text-[16px] md:text-[18px] font-normal shadow-inner placeholder:text-[#A0A0A0] text-[#1D1D1F] outline-none transition-all focus:bg-[#EAEAEA]"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                        <Search className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>



                <div className="mt-auto self-start pointer-events-auto flex flex-col gap-4 animate-fadeUp delay-300">
                  <div className="bg-white/90 backdrop-blur-2xl p-5 rounded-[40px] border border-white shadow-2xl flex items-center gap-6 min-w-[280px]">
                    <div className="w-12 h-12 rounded-3xl bg-[#014421]/10 flex items-center justify-center text-[#014421]">
                      <MapIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] leading-none mb-2">Live Status</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[#014421]">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#014421] animate-pulse" />
                          {shops.filter(s => isShopOpen(s.operatingHours)).length} Open
                        </div>
                        <div className="w-[1px] h-3 bg-black/10" />
                        <div className="text-[13px] font-semibold text-black/60 truncate max-w-[150px]">
                          Los Baños, Laguna
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`absolute top-0 right-0 h-full pointer-events-none w-full md:w-[460px] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] z-[40] p-4 md:p-10
                  ${activeRouteShopId ? 'translate-x-[calc(100%+40px)] md:translate-x-0' : (isMapSheetExpanded ? 'translate-x-0' : 'translate-y-[calc(100%-100px)] md:translate-y-0')}
                `}>
                  <div className="w-full h-full pointer-events-auto bg-white/80 backdrop-blur-3xl rounded-[48px] border border-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] md:ring-1 md:ring-black/5 flex flex-col overflow-hidden">

                  {(() => {
                    const query = mapSearchQuery.toLowerCase().trim();
                    const filtered = (query
                      ? shopsWithDistance.filter(s => s?.name?.toLowerCase().includes(query) || s?.address?.toLowerCase().includes(query))
                      : [...shopsWithDistance]
                    ).sort((a, b) => a.distance - b.distance);

                    const avgPrice = Math.round(filtered.reduce((acc, s) => acc + (s.price || 0), 0) / (filtered.length || 1));

                    return (
                      <>
                        <div className="px-8 pt-10 pb-6 pointer-events-auto relative border-b border-black/[0.03]">
                          <div className="md:hidden flex flex-col items-center py-2 mb-4" onClick={() => setIsMapSheetExpanded(!isMapSheetExpanded)}>
                            <div className="w-16 h-1.5 bg-black/10 rounded-full" />
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-[22px] font-normal text-[#1D1D1F] tracking-tighter leading-none">{filtered.length} Shops Around You</h3>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar pointer-events-auto transition-all duration-500">
                          <div className="px-6 py-6 space-y-4">
                            {filtered
                              .map((s, i) => {
                                const isActive = activeRouteShopId === s.id;

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
                                    className={`relative p-5 rounded-[36px] bg-white border transition-all duration-300 cursor-pointer overflow-hidden group ${isActive ? 'border-[#014421] ring-4 ring-[#014421]/10 shadow-2xl z-10 scale-[1.02]' : 'border-black/[0.05] hover:border-[#014421]/30 hover:shadow-xl hover:-translate-y-1'}`}
                                  >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#014421]/5 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                                    <div className="flex items-start gap-6">
                                      {/* Left Side: Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-1">
                                          {i === 0 && (
                                            <div className="flex items-center gap-1.5 mb-1 animate-pulse">
                                              <MapPin className="w-3 h-3 text-[#014421] fill-[#014421]/10" />
                                              <span className="text-[10px] font-black text-[#014421] uppercase tracking-[0.2em]">Nearest to you</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-[16px] font-normal text-[#1D1D1F] tracking-tight leading-normal font-outfit truncate py-0.5">{s.name}</h4>
                                            {s.permitStatus === 'approved' && (
                                              <div className="w-5 h-5 rounded-full bg-[#228B22] flex items-center justify-center shrink-0 shadow-md">
                                                <Check className="w-3 h-3 text-white stroke-[4]" />
                                              </div>
                                            )}
                                          </div>
                                          {/* REAL-TIME STATUS INDICATOR */}

                                        </div>

                                        <div className="mt-2 space-y-2">
                                          <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                              <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, idx) => (
                                                  <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.floor(s.rating) ? 'fill-[#FF8C00] text-[#FF8C00]' : 'text-[#1D1D1F]/20'}`} />
                                                ))}
                                              </div>
                                              <span className="text-[12px] font-medium text-[#1D1D1F] ml-1">{s.rating} <span className="text-[#1D1D1F] font-medium">({s.reviewCount || 0})</span></span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shadow-sm backdrop-blur-sm ${isShopOpen(s.operatingHours) ? 'bg-[#228B22]/5 border-[#228B22]/20 text-[#228B22]' : 'bg-[#7B1113]/5 border-[#7B1113]/20 text-[#7B1113]'}`}>
                                              <div className={`w-1.5 h-1.5 rounded-full ${isShopOpen(s.operatingHours) ? 'bg-[#228B22]' : 'bg-[#7B1113]'}`} />
                                              <span className="text-[10px] font-normal uppercase tracking-wider">{isShopOpen(s.operatingHours) ? 'open' : 'closed'}</span>
                                            </div>
                                          </div>

                                          <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[15px] font-normal text-[#7B1113] leading-none">₱{s.price}<span className="text-[12px] ml-0.5 opacity-60 lowercase font-normal">/kg</span></span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-[#1D1D1F]/60" />
                                                <span className="text-[13px] font-medium text-[#1D1D1F]">{s.turnaroundTime} hrs</span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#014421] bg-[#014421]/5 px-2.5 py-1 rounded-full border border-[#014421]/10">
                                                <Navigation2 className="w-3 h-3 fill-[#014421]" />
                                                {(s.distance || 0).toFixed(1)} km away
                                              </div>
                                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#1D1D1F]/60">
                                                <Timer className="w-3 h-3" />
                                                <span>~{Math.round((s.distance || 0) * 12)} min walk</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="w-32 h-32 md:w-36 md:h-36 rounded-[36px] md:rounded-[44px] overflow-hidden shrink-0 shadow-2xl border-4 border-white relative group/img">
                                        <img src={s.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={s.name} />
                                        {isActive && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white/80 rounded-full p-2.5 shadow-xl">
                                              <Navigation className="w-5 h-5 text-[#014421]" />
                                            </div>
                                          </div>
                                        )}
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
      </div>
      )}

      </div>
    </main>



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
        <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center p-6 animate-fadeIn lg:pl-[320px]">
          <div className="absolute top-8 left-8 lg:left-[calc(32px+320px)] z-[2001]">
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
    </div>


  );
}
