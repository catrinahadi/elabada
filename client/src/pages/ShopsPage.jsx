import React, { useState, useMemo, useEffect, useRef, Fragment, cloneElement } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calculateTopsis } from "../utils/topsis";
import {
  Star, MapPin, Search, Filter, Map as MapIcon,
  Clock, Package, Check, ChevronRight,
  X, Info, MessageSquare, ArrowUpRight, Award,
  Droplets, Zap, ThumbsUp, DollarSign, LayoutGrid, List,
  ArrowUp, ArrowDown, Map as GoogleMap, ArrowRight,
  MoreHorizontal, Heart, ArrowLeft, ChevronLeft, MoreVertical, LocateFixed, Camera,
  LayoutDashboard, LogOut, Settings, BarChart3, Sliders, Navigation, Navigation2, Plus, Trash2, Menu, ChevronUp,
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer, Circle, ChevronDown, Banknote, Wifi, Coffee, TrendingUp, AlertCircle
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

const createShopMarkerIcon = (rank) => {
  const mainColor = "#014421"; 
  const maroonColor = "#7B1113";

  return L.divIcon({
    className: 'custom-shop-marker',
    html: `<div class="flex flex-col items-center group cursor-pointer">
      <div class="relative transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-110">
        <svg width="42" height="54" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-2xl">
          <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${mainColor}"/>
          <path d="M14 2C7.37258 2 2 7.37258 2 14C2 22.5 14 32.5 14 32.5C14 32.5 26 22.5 26 14C26 7.37258 20.6274 2 14 2Z" fill="${maroonColor}" opacity="0.1"/>
          <circle cx="14" cy="14" r="6" fill="#FFFFFF" class="shadow-sm"/>
        </svg>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>`,
    iconSize: [42, 54],
    iconAnchor: [21, 54]
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
  if (!operatingHours || operatingHours.toLowerCase().includes('24')) return true;
  try {
    const hoursPart = operatingHours.split(/[,-]/)[0] + (operatingHours.includes('-') ? '-' + operatingHours.split('-')[1] : '');
    const segments = hoursPart.split('-');
    if (segments.length !== 2) return true;
    
    const parseMins = (str) => {
      const match = str.trim().match(/(\d+):?(\d*)\s*(AM|PM)/i);
      if (!match) return null;
      let [_, h, m, mdn] = match;
      h = parseInt(h); m = parseInt(m) || 0;
      if (h === 12) h = 0;
      if (mdn.toUpperCase() === 'PM') h += 12;
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
                <Star className={`w-10 h-10 ${s <= rating ? 'fill-[#7B1113] text-[#7B1113]' : errors.rating ? 'text-red-200' : 'text-gray-200'}`} />
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
                    ? 'bg-[#7B1113] text-white shadow-lg shadow-[#7B1113]/20'
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
                      <p className="text-[14px] font-normal text-[#1D1D1F]">{shop.operatingHours || '8:00 AM - 8:00 PM'}</p>
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
                      <p className="text-[14px] font-normal text-blue-900">{(shop.distance || 0).toFixed(1)} km</p>
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
                                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-[#7B1113] text-[#7B1113]" : "text-gray-200"}`} />
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
  const [showFormula, setShowFormula] = useState(false);

  const getExplanation = (detail) => {
    const { criterion, rating, actualValue, isBenefit, weight } = detail;
    const labels = {
      price: 'Price',
      turnaroundTime: 'Turnaround Time',
      rating: 'Rating',
      distance: 'Range'
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
    <div className="modal-overlay flex items-center justify-center p-2 md:p-4 z-[2000] backdrop-blur-md bg-black/60">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-[850px] max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-scaleIn flex flex-col overflow-hidden border border-black/5 font-outfit">
        {/* Header */}
        <div className="p-8 border-b border-black/[0.03] flex items-center justify-between bg-[#F8F9FA]/50">
          <div className="space-y-1">
            <h3 className="text-[24px] font-bold text-[#1D1D1F] tracking-tight">{shop.name}</h3>
            <p className="text-[14px] text-gray-500 font-normal">Computation Breakdown</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-all">
            <X className="w-6 h-6 text-[#1D1D1F]" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar space-y-10">
          {/* 1. Final Match Score - Now Clickable for Transparency */}
          <section 
            onClick={() => setShowFormula(!showFormula)}
            className="bg-[#014421] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                  Match Score <Info className="w-3 h-3" />
                </p>
                <h4 className="text-7xl font-normal tracking-tighter">{shop.score.toFixed(2)}</h4>
                <p className="text-white/80 text-[14px] font-medium leading-relaxed max-w-[280px]">
                  This shop is <span className="text-white font-bold">{Math.round(shop.score * 100)}% close</span> to the ideal laundry shop based on your preferences.
                </p>
                <p className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest pt-2 flex items-center gap-2 justify-center md:justify-start">
                  {showFormula ? 'Hide computation' : 'See computation'}
                </p>
              </div>
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform">
                <Target className="w-12 h-12 text-emerald-300" />
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" />
          </section>

          {/* 1.1 Hidden Computation Logic Section */}
          {showFormula && (
            <div className="space-y-8 animate-fadeUp bg-[#F8F9FA] p-8 md:p-10 rounded-[40px] border border-[#014421]/10">
              <div className="flex items-center gap-4 border-b border-black/[0.05] pb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ClipboardList className="w-6 h-6 text-[#014421]" />
                </div>
                <div>
                  <h5 className="text-[16px] font-bold text-[#1D1D1F]">TOPSIS Methodology</h5>
                  <p className="text-[12px] text-gray-500">Technique for Order of Preference by Similarity to Ideal Solution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#014421] uppercase tracking-widest bg-[#014421]/5 px-3 py-1 rounded-full">Step 1: Normalize</span>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">We convert raw data (₱, km, hrs) into a universal 0-1 scale so factors can be compared fairly.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#014421] uppercase tracking-widest bg-[#014421]/5 px-3 py-1 rounded-full">Step 2: Weighted Matrix</span>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">Your priority weights are applied. Factors at the top of your list score higher points.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#014421] uppercase tracking-widest bg-[#014421]/5 px-3 py-1 rounded-full">Step 3: Ideal Points</span>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">We identify an "Ideal Best" (cheapest, closest, fastest) and "Ideal Worst" in the group.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#014421] uppercase tracking-widest bg-[#014421]/5 px-3 py-1 rounded-full">Step 4: Match Ranking</span>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">The results are sorted by their closeness to the ideal, giving you the best recommendations.</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-black/5 space-y-6 shadow-inner">
                  <h6 className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#014421]" /> The Formula
                  </h6>
                  <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-black/5 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="space-y-1">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Relative Closeness</p>
                      <p className="text-2xl font-normal text-[#1D1D1F] tracking-tighter">C<sub>i</sub> = d<sub>i</sub><sup>-</sup> / (d<sub>i</sub><sup>+</sup> + d<sub>i</sub><sup>-</sup>)</p>
                    </div>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                      Matches are calculated based on how far a shop is from the <span className="text-[#7B1113] font-bold italic">Worst Case (d-)</span> vs the <span className="text-[#014421] font-bold italic">Best Case (d+)</span>.
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium italic text-center">A score of 1.0 means the shop is mathematically perfect based on your criteria.</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Weighted Importance */}
          <section className="space-y-4 px-2">
            <h5 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Weighted Importance
            </h5>
            <div className="bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.03]">
              <p className="text-[14px] font-medium text-gray-600 leading-relaxed italic">
                Your ranking prioritizes:{" "}
                {[...shop.details].sort((a, b) => a.criterion === 'distance' ? -1 : b.criterion === 'distance' ? 1 : 0).map((d, i) => {
                  const label = d.criterion === 'turnaroundTime' ? 'Time' : d.criterion === 'distance' ? 'Range' : d.criterion.charAt(0).toUpperCase() + d.criterion.slice(1);
                  return (
                    <span key={d.criterion} className="text-[#1D1D1F] font-bold">
                      {label} ({Math.round(d.weight * 100)}){i < shop.details.length - 1 ? " • " : ""}
                    </span>
                  );
                })}
              </p>
              <p className="mt-3 text-[12px] text-gray-400">This helps explain why this shop achieved its specific match ranking.</p>
            </div>
          </section>

          {/* 3. Criteria Performance */}
          <section className="space-y-4 px-2">
            <h5 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Criteria Performance
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sorted so distance/range always comes first */}
              {[...shop.details].sort((a, b) => a.criterion === 'distance' ? -1 : b.criterion === 'distance' ? 1 : 0).map((detail) => {
                const info = getExplanation(detail);
                const Icon = info.icon;

                return (
                  <div key={detail.criterion} className="bg-white p-6 rounded-[32px] border border-black/[0.04] shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#014421] group-hover:text-white transition-all">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1D1D1F]">{info.label}</p>
                          {info.isDelay ? (
                            <div className="flex items-center gap-4 mt-1 bg-[#7B1113]/[0.02] border border-[#7B1113]/10 p-2 rounded-xl">
                              <div className="flex flex-col px-1">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Stated</span>
                                <span className="text-[13px] font-medium text-gray-400 leading-none">{info.promisedValue} {info.unit}</span>
                              </div>
                              <div className="h-6 w-[1px] bg-[#7B1113]/20" />
                              <div className="flex flex-col px-1">
                                <span className="text-[9px] text-[#7B1113] font-black uppercase tracking-widest leading-none mb-1">Reality</span>
                                <span className="text-[13px] font-black text-[#7B1113] leading-none">{info.actualValue} {info.unit}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12px] font-normal text-gray-500">
                              {info.actualValue} {info.unit}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[14px] font-bold text-[#1D1D1F] block">{info.percentage}</span>
                        {info.isDelay && <span className="text-[9px] text-[#7B1113] font-bold uppercase block opacity-60">Truth-Adjusted</span>}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#014421] transition-all duration-1000"
                        style={{ width: `${info.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-black/[0.03] bg-[#F8F9FA]/50 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-[#1D1D1F] text-white rounded-2xl text-[14px] font-medium hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
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
            price: Number(s.price) || 0,
            turnaroundTime: Number(s.turnaroundTime) || 24,
            rating: Number(s.rating) || 0,
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
    // We use a base importance of 25 for all factors,
    // then multiply by the user's priority position order (1st = 4x, 2nd = 3x, etc)
    const baseImportance = { price: 25, time: 25, distance: 25, rating: 25 };
    const w = {};
    const POSITION_WEIGHTS = [1.0, 0.75, 0.5, 0.25]; // Priority multipliers
    priorities.forEach((key, i) => {
      w[key] = baseImportance[key] * (POSITION_WEIGHTS[i] || 1);
    });
    return w;
  }, [priorities]);

  const shopsWithDistance = useMemo(() => {
    return shops.map(s => ({
      ...s,
      distance: calcDistance(userLocation[0], userLocation[1], s.latitude || 14.1675, s.longitude || 121.2433)
    }));
  }, [shops, userLocation]);

  const rankedShops = useMemo(() => {
    if (!shopsWithDistance || shopsWithDistance.length === 0) return [];
    
    // Pass the actual weights from the state, merged with priority position multipliers
    const scores = calculateTopsis(shopsWithDistance, combinedWeights, priorities);
    
    // Merge scores back into shop objects by finding the match (standardizing ID check)
    return shopsWithDistance.map(shop => {
      const shopId = shop.id || shop._id;
      const scoreData = scores.find(s => s.id === shopId);
      
      return {
        ...shop,
        score: scoreData?.score ?? 0,
        details: scoreData?.details ?? []
      };
    }).sort((a, b) => b.score - a.score); // Absolute sorting by TOPSIS score
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
    <div className="flex bg-[#FAFAF7] min-h-screen text-[#1D1D1F] font-outfit overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conditional classes for responsiveness */}
      <aside className={`fixed lg:sticky top-0 h-screen transition-all duration-300 ease-in-out z-[100] bg-[#FAFAF7] flex flex-col p-8 
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
                <button onClick={() => setSidebarTab("map")} className="w-[58px] md:w-[70px] flex-1 rounded-[16px] md:rounded-[20px] bg-[#014421] shadow-lg flex items-center justify-center group transition-all hover:scale-105 shrink-0">
                  <LocateFixed className="w-6 h-6 md:w-7 md:h-7 text-white transition-all" />
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
                            { id: 'distance', label: 'By Range' },
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
                      <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all shadow-md backdrop-blur-md ${isShopOpen(s.operatingHours) && s.status !== 'closed' ? 'bg-white/90 border-[#228B22]/20 text-[#228B22]' : 'bg-white/90 border-[#7B1113]/20 text-[#7B1113]'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isShopOpen(s.operatingHours) && s.status !== 'closed' ? 'bg-[#228B22]' : 'bg-[#7B1113]'}`} />
                        <span className="text-[12px] font-normal capitalize tracking-wide">{isShopOpen(s.operatingHours) && s.status !== 'closed' ? 'open' : 'closed'}</span>
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
                            <div className="flex flex-row items-baseline gap-2">
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
                          <Star className="w-3.5 h-3.5 fill-[#7B1113] text-[#7B1113]" />
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
              { id: "distance", icon: <Navigation2 className="w-4 h-4" />, label: "Distance preference (km)", subtitle: "Maximum distance you'd travel",
                options: [{ label: "Near", value: 1 },{ label: "Mid", value: 5 },{ label: "Far", value: 15 }], stateKey: "distance", min: 0.5, max: 20, step: 0.5, unit: "km" },
              { id: "price", icon: <Banknote className="w-4 h-4" />, label: "Budget preference (₱/kg)", subtitle: "Ideal cost per kilogram",
                options: [{ label: "Cheap", value: 25 },{ label: "Mid", value: 50 },{ label: "Premium", value: 100 }], stateKey: "price", min: 10, max: 200, step: 5, unit: "₱" },
              { id: "time", icon: <Timer className="w-4 h-4" />, label: "Time preference (hrs)", subtitle: "Ideal turnaround time",
                options: [{ label: "Flash", value: 6 },{ label: "Normal", value: 24 },{ label: "Flexible", value: 72 }], stateKey: "time", min: 1, max: 96, step: 1, unit: "hrs" },
              { id: "rating", icon: <Star className="w-4 h-4" />, label: "Minimum rating (★)", subtitle: "Lowest acceptable shop rating",
                options: [{ label: "Any", value: 1 },{ label: "Excl", value: 3 },{ label: "High", value: 4.5 }], stateKey: "rating", min: 1, max: 5, step: 0.1, unit: "stars" }
            ];

            const isFirstStepDone = true; // Sliders always have a default value

            return (
              <div className="max-w-[1400px] mx-auto py-8 px-4 md:px-12 animate-fadeUp relative overflow-hidden bg-white shadow-[0_0_80px_rgba(0,0,0,0.02)] min-h-screen">



                <div className="min-h-[500px]">
                  {/* STEP 1: PREFERENCES */}
                  {surveyStep === 1 && (
                    <div className="flex flex-col gap-10 animate-fadeUp">
                        <div className="flex flex-col gap-8 items-center text-center w-full">
                          {/* Title Section (Centered) */}
                          <div className="space-y-1">
                            <h2 className="text-[28px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Computation</h2>
                            <p className="text-[14px] text-black/40 font-normal leading-relaxed">Let's find the best shop for your specific needs.</p>
                          </div>
  
                          {/* Step Indicator (Centered) */}
                          <div className="flex items-center justify-between w-full relative px-2 max-w-[800px] mx-auto">
                          {["Preferences", "Ranking", "Results"].map((label, i) => {
                            const num = i + 1;
                            const isActive = surveyStep === num;
                            const isCompleted = surveyStep > num;
                            
                            return (
                              <Fragment key={label}>
                                <div className="flex flex-col items-center gap-3 relative z-10 w-fit">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                                    isCompleted ? "bg-[#014421] border-[#014421] text-white shadow-lg" : 
                                    isActive ? "bg-white border-[#014421] border-2" : 
                                    "bg-white border-black/10"
                                  }`}>
                                    {isCompleted ? (
                                      <Check className="w-5 h-5" />
                                    ) : isActive ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#014421]" />
                                    ) : null}
                                  </div>
                                  <span className={`text-[12px] whitespace-nowrap translate-y-1 text-[#1D1D1F] ${isActive ? "opacity-100 font-normal" : "opacity-40 font-normal"}`}>
                                    {label}
                                  </span>
                                </div>
                                {i < 2 && (
                                  <div className={`flex-1 h-[2px] transition-all -translate-y-5 ${isCompleted ? "bg-[#014421]" : "bg-black/5"}`} />
                                )}
                              </Fragment>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[56px] p-8 md:p-16 space-y-16 relative">
                        <div className="space-y-0.5">
                          <h3 className="text-[18px] font-normal text-[#1D1D1F] font-outfit tracking-tight">Set your preferences</h3>
                          <p className="text-[14px] text-black/40 font-normal">Adjust the sliders below</p>
                        </div>
                        
                        <div className="space-y-10">
                          {surveyQuestions.map((q, idx) => {
                            return (
                              <div key={q.id} className="group relative space-y-6 animate-fadeUp" style={{ animationDelay: `${idx * 150}ms` }}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="flex items-center gap-4">
                                    <div className="space-y-0.5">
                                      <h3 className="text-[14px] font-normal text-[#1D1D1F] font-outfit tracking-normal leading-none">{q.label}</h3>
                                      <p className="text-[12px] text-black/40 font-normal">{q.subtitle}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6 self-end md:self-auto">
                                    <div className="text-right">
                                      <span className="text-[22px] font-normal text-[#1D1D1F] font-outfit tabular-nums leading-none">
                                        {weights[q.stateKey]}
                                      </span>
                                      <span className="text-[12px] ml-1 font-normal text-black/30 lowercase tracking-widest">{q.unit}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="relative h-2 flex items-center">
                                  <div className="absolute inset-0 bg-black/[0.05] rounded-full overflow-hidden">
                                    <div className={`h-full bg-[#1D1D1F] transition-all duration-1000 ease-out`} style={{ width: `${((weights[q.stateKey]-q.min)/(q.max-q.min)) * 100}%` }} />
                                  </div>
                                  <input 
                                    type="range"
                                    min={q.min}
                                    max={q.max}
                                    step={q.step}
                                    value={weights[q.stateKey]}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      setWeights(prev => ({ ...prev, [q.stateKey]: val }));
                                      setIsApplied(false);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <div className="absolute h-6 w-6 bg-white border-2 border-[#1D1D1F] rounded-full shadow-lg pointer-events-none transition-all duration-200" style={{ left: `calc(${((weights[q.stateKey]-q.min)/(q.max-q.min)) * 100}% - 12px)` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>



                      <div className="flex justify-end pt-6">
                        <button 
                          onClick={() => setSurveyStep(2)}
                          className="bg-[#014421] text-white px-10 py-5 rounded-[22px] font-normal text-[14px] shadow-2xl shadow-[#014421]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group"
                        >
                          Continue to priority
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: RANKING */}
                  {surveyStep === 2 && (
                    <div className="flex flex-col gap-10 animate-fadeUp">
                        <div className="flex flex-col gap-8 items-center text-center w-full">
                          {/* Title Section (Centered) */}
                          <div className="space-y-1">
                            <h2 className="text-[28px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Computation</h2>
                            <p className="text-[14px] text-black/40 font-normal leading-relaxed">Let's find the best shop for your specific needs.</p>
                          </div>
  
                          {/* Step Indicator (Centered) */}
                          <div className="flex items-center justify-between w-full relative px-2 max-w-[800px] mx-auto">
                          {["Preferences", "Ranking", "Results"].map((label, i) => {
                            const num = i + 1;
                            const isActive = surveyStep === num;
                            const isCompleted = surveyStep > num;
                            
                            return (
                              <Fragment key={label}>
                                <div className="flex flex-col items-center gap-3 relative z-10 w-fit">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                                    isCompleted ? "bg-[#014421] border-[#014421] text-white shadow-lg" : 
                                    isActive ? "bg-white border-[#014421] border-2" : 
                                    "bg-white border-black/10"
                                  }`}>
                                    {isCompleted ? (
                                      <Check className="w-5 h-5" />
                                    ) : isActive ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#014421]" />
                                    ) : null}
                                  </div>
                                  <span className={`text-[12px] whitespace-nowrap translate-y-1 text-[#1D1D1F] ${isActive ? "opacity-100 font-normal" : "opacity-40 font-normal"}`}>
                                    {label}
                                  </span>
                                </div>
                                {i < 2 && (
                                  <div className={`flex-1 h-[2px] transition-all -translate-y-5 ${isCompleted ? "bg-[#014421]" : "bg-black/5"}`} />
                                )}
                              </Fragment>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[40px] p-4 md:p-8 space-y-4">
                        <div className="space-y-0.5 mb-6 px-4">
                          <h3 className="text-[18px] font-normal text-[#1D1D1F] font-outfit tracking-tight">Rank the factors</h3>
                          <p className="text-[14px] text-black/40 font-normal">Drag or use arrows to set priority</p>
                        </div>
                        {priorities.map((key, index) => {
                          const labelMapping = {
                            price: { label: "Price strategy", desc: "How much you value cost savings", icon: <Banknote className="w-6 h-6" /> },
                            distance: { label: "Proximity", desc: "How much distance matters", icon: <Navigation2 className="w-6 h-6" /> },
                            time: { label: "Velocity", desc: "Need for rapid service turnaround", icon: <Timer className="w-6 h-6" /> },
                            rating: { label: "Trust score", desc: "User review and quality weighting", icon: <Star className="w-6 h-6" /> }
                          };
                          const factor = labelMapping[key];
                          return (
                            <div key={key} className="p-6 md:p-8 rounded-[32px] border border-black/[0.05] hover:border-[#014421]/30 transition-all duration-300 flex items-center gap-8 group">
                              <div className="w-16 h-16 rounded-[22px] border border-[#014421]/30 bg-[#014421]/5 text-[#014421] flex items-center justify-center font-normal text-2xl font-outfit transition-all duration-700">{index + 1}</div>
                              <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div>
                                    <h4 className="text-[14px] font-normal text-[#1D1D1F] font-outfit tracking-wider">{factor.label}</h4>
                                    <p className="text-[12px] text-black/30 font-normal">{factor.desc}</p>
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <button onClick={() => handleMovePriority(index, -1)} disabled={index === 0} className="w-12 h-12 rounded-2xl border border-black/5 bg-white shadow-sm hover:bg-[#7B1113] hover:text-white flex items-center justify-center disabled:opacity-5 transition-all active:scale-90">
                                    <ChevronUp className="w-6 h-6" />
                                  </button>
                                  <button onClick={() => handleMovePriority(index, 1)} disabled={index === priorities.length - 1} className="w-12 h-12 rounded-2xl border border-black/5 bg-white shadow-sm hover:bg-[#7B1113] hover:text-white flex items-center justify-center disabled:opacity-5 transition-all active:scale-90">
                                    <ChevronDown className="w-6 h-6" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>


                      <div className="flex items-center justify-between pt-6">
                        <button onClick={() => setSurveyStep(1)} className="px-8 py-5 rounded-[22px] font-normal text-[14px] text-black/30 hover:text-[#014421] hover:bg-[#014421]/5 transition-all flex items-center gap-2 group">
                          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                          Back to preferences
                        </button>
                        <button 
                          onClick={() => {
                            setIsApplied(true);
                            setSurveyStep(3);
                          }} 
                          className="px-12 py-5 rounded-[22px] bg-[#014421] text-white font-normal text-[14px] shadow-[0_24px_48px_-12px_rgba(1,68,33,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group"
                        >
                          Discover Best Matches
                          <Zap className="w-5 h-5 fill-white group-hover:animate-bounce" />
                        </button>
                      </div>
                    </div>
                  )}



                  {/* STEP 3: RESULTS */}
                  {surveyStep === 3 && (
                    <div className="flex flex-col gap-10 animate-fadeUp">
                        <div className="flex flex-col gap-8 items-center text-center w-full">
                          {/* Title Section (Centered) */}
                          <div className="space-y-1">
                            <h2 className="text-[28px] font-normal tracking-tight text-[#1D1D1F] font-outfit">Computation</h2>
                            <p className="text-[14px] text-black/40 font-normal leading-relaxed">Let's find the best shop for your specific needs.</p>
                          </div>
  
                          {/* Step Indicator (Centered) */}
                          <div className="flex items-center justify-between w-full relative px-2 max-w-[800px] mx-auto">
                          {["Preferences", "Ranking", "Results"].map((label, i) => {
                            const num = i + 1;
                            const isActive = surveyStep === num;
                            const isCompleted = surveyStep > num;
                            
                            return (
                              <Fragment key={label}>
                                <div className="flex flex-col items-center gap-3 relative z-10 w-fit">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                                    isCompleted ? "bg-[#014421] border-[#014421] text-white shadow-lg" : 
                                    isActive ? "bg-white border-[#014421] border-2" : 
                                    "bg-white border-black/10"
                                  }`}>
                                    {isCompleted ? (
                                      <Check className="w-5 h-5" />
                                    ) : isActive ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#014421]" />
                                    ) : null}
                                  </div>
                                  <span className={`text-[12px] whitespace-nowrap translate-y-1 text-[#1D1D1F] ${isActive ? "opacity-100 font-normal" : "opacity-40 font-normal"}`}>
                                    {label}
                                  </span>
                                </div>
                                {i < 2 && (
                                  <div className={`flex-1 h-[2px] transition-all -translate-y-5 ${isCompleted ? "bg-[#014421]" : "bg-black/5"}`} />
                                )}
                              </Fragment>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[56px] p-8 md:p-16 space-y-16 relative">
                        <div className="space-y-0.5">
                          <h3 className="text-[18px] font-normal text-[#1D1D1F] font-outfit tracking-tight">Best matches</h3>
                          <p className="text-[14px] text-black/40 font-normal">Top recommendations based on your profile.</p>
                        </div>
                        <div className="space-y-6">
                          {top3.slice(0, 3).map((s, i) => {
                            return (
                              <div 
                                key={s._id || s.id || i} 
                                onClick={() => handleSelectShop(s)} 
                                className="bg-white p-5 md:p-6 rounded-[32px] border-[1px] border-black/[0.08] hover:border-black/20 hover:bg-gray-50/50 transition-all cursor-pointer group relative flex flex-row items-center gap-6 md:gap-8 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.06)] hover:shadow-lg"
                              >
                                {/* Left: Circular Gauge */}
                                <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center shrink-0">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="50%" cy="50%" r="42%" stroke="#F0F0F0" strokeWidth="8" fill="transparent" />
                                    <circle 
                                      cx="50%" 
                                      cy="50%" 
                                      r="42%" 
                                      stroke="#014421" 
                                      strokeWidth="8" 
                                      fill="transparent" 
                                      strokeDasharray="264" 
                                      strokeDashoffset={264 - (264 * (s.score || 0))} 
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[18px] md:text-[22px] font-normal text-[#1D1D1F] font-outfit leading-none mb-1">
                                      {((s.score || 0) * 100).toFixed(0)}%
                                    </span>
                                    <span className="text-[8px] md:text-[10px] font-normal text-black/30 uppercase tracking-widest leading-none">Match</span>
                                  </div>
                                </div>
  
                                {/* Right: Info */}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <h4 className="text-[18px] font-normal text-[#1D1D1F] font-outfit leading-tight tracking-tight truncate">
                                        {s.name}
                                      </h4>
                                      <p className="text-[16px] text-[#1D1D1F]/60 font-normal leading-relaxed max-w-xl">
                                        Located at {s.address}. Offering quality service at ₱{s.price}/kg with a {s.turnaroundTime} hour turnaround.
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-8 pt-2">
                                      <button className="text-[16px] font-normal text-[#014421] underline underline-offset-8 decoration-2 hover:text-[#7B1113] hover:decoration-[#7B1113] transition-all">
                                        View details
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {top3.length === 0 && (
                        <div className="col-span-full py-40 text-center glassmorphism rounded-[60px] border-2 border-dashed border-[#014421]/10">
                          <div className="w-24 h-24 bg-[#014421]/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-[#014421]">
                            <Store className="w-10 h-10" />
                          </div>
                          <h3 className="text-[24px] font-normal text-[#1D1D1F] font-outfit opacity-20">Optimizing inventory...</h3>
                          <p className="text-[14px] text-black/20 font-normal mt-2">Connecting to local providers</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6">
                        <button onClick={() => setSurveyStep(2)} className="px-8 py-5 rounded-[22px] font-normal text-[14px] text-black/30 hover:text-[#014421] hover:bg-[#014421]/5 transition-all flex items-center gap-2 group">
                          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                          Back to priority
                        </button>
                        <button onClick={() => { setSurveyStep(1); setIsApplied(false); }} className="px-12 py-5 rounded-[22px] bg-[#014421] text-white font-normal text-[14px] shadow-[0_24px_48px_-12px_rgba(1,68,33,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group">
                          <LogOut className="w-5 h-5 rotate-180" />
                          Reset survey
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
                  <div className="flex items-center gap-3 p-2.5 bg-white/60 backdrop-blur-3xl rounded-[32px] md:rounded-[44px] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] group/search-container">
                    <button
                      onClick={() => { setSidebarTab("overview"); setActiveRouteShopId(null); }}
                      className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-[24px] md:rounded-[36px] bg-white text-[#1D1D1F] shadow-lg hover:bg-[#1D1D1F] hover:text-white transition-all transform active:scale-95 group-hover/search-container:scale-[1.02]"
                    >
                      <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
                    </button>
                    <button
                      onClick={refreshLocation}
                      className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-[24px] md:rounded-[36px] bg-white text-[#014421] shadow-lg hover:bg-[#014421] hover:text-white transition-all transform active:scale-95 group-hover/search-container:scale-[1.02]"
                      title="Detect my current location"
                    >
                      <LocateFixed className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
                    </button>
                    <div className="relative flex-1 md:w-[480px] group/input">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#014421] opacity-60 z-10 group-focus-within/input:opacity-100 transition-opacity"><Search className="w-5 h-5 md:w-6 md:h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" /></div>
                      <input
                        type="text"
                        placeholder="Search laundry near you..."
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        onFocus={() => setShowMapSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowMapSuggestions(false), 200)}
                        className="w-full h-12 md:h-16 bg-white/80 rounded-[24px] md:rounded-[36px] pl-16 pr-6 text-[14px] md:text-[16px] font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-white/50 outline-none transition-all placeholder:text-gray-400 text-[#1D1D1F] focus:bg-white focus:ring-8 focus:ring-[#014421]/5"
                      />
                    </div>
                  </div>
                </div>

                {activeRouteShopId && (
                  <div className="mt-6 self-start pointer-events-auto animate-fadeDown">
                    <div className="bg-[#014421] text-white px-6 py-4 rounded-[28px] shadow-2xl flex items-center gap-5 border border-white/20 backdrop-blur-xl">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                        <Navigation className="w-5 h-5 fill-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold tracking-tight">Navigating to {shops.find(s => s.id === activeRouteShopId || s._id === activeRouteShopId)?.name}</span>
                        <span className="text-[11px] font-medium opacity-70">Estimated travel dist: {shopsWithDistance.find(s => s.id === activeRouteShopId || s._id === activeRouteShopId)?.distance?.toFixed(1)} km</span>
                      </div>
                      <button onClick={() => setActiveRouteShopId(null)} className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

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
                              <h3 className="text-[22px] font-black text-[#1D1D1F] tracking-tighter leading-none">{filtered.length} Shops Around You</h3>
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
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          <div className="flex items-center gap-1.5">
                                            <div className="flex items-center gap-0.5">
                                              {[...Array(5)].map((_, idx) => (
                                                <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.floor(s.rating) ? 'fill-[#7B1113] text-[#7B1113]' : 'text-[#1D1D1F]/20'}`} />
                                              ))}
                                            </div>
                                            <span className="text-[12px] font-medium text-[#1D1D1F] ml-1">{s.rating} <span className="text-[#1D1D1F] font-medium">({s.reviewCount || 0})</span></span>
                                          </div>

                                          <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-6">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-normal text-[#7B1113] leading-none">₱{s.price}<span className="text-[12px] ml-0.5 opacity-60 lowercase">/kg</span></span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-[#1D1D1F]" />
                                                <span className="text-[12px] font-normal text-[#1D1D1F]">{s.turnaroundTime} hrs</span>
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

                                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] md:rounded-[32px] overflow-hidden shrink-0 shadow-lg border-2 border-white relative">
                                        <img src={s.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={s.name} />
                                        {isActive && (
                                          <div className="absolute inset-0 bg-[#014421]/20 backdrop-blur-[2px] flex items-center justify-center">
                                            <Navigation className="w-6 h-6 text-white" />
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
    </div>
  );
}
