import { useState, useMemo } from "react";
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
  Store, ClipboardList, CheckCircle, XCircle, Target, Activity, Tag, Shield, Timer
} from "lucide-react";

// Mock data
const initialShops = [
  { id: "s1", name: "Fresh & Clean Laundry", address: "Lopez Avenue, Los Baños", price: 45, turnaroundTime: 24, rating: 4.8, reviewCount: 127, distance: 0.8, latitude: 14.1673, longitude: 121.2433, image: "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s2", name: "QuickWash Express", address: "National Highway, Los Baños", price: 50, turnaroundTime: 4, rating: 4.75, reviewCount: 203, distance: 1.2, latitude: 14.1689, longitude: 121.2385, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s3", name: "Elite Washers", address: "Poblacion, Los Baños", price: 60, turnaroundTime: 12, rating: 4.6, reviewCount: 45, distance: 2.5, latitude: 14.1750, longitude: 121.2480, image: "https://images.unsplash.com/photo-1570624040263-54876f161989?w=400&h=250&fit=crop", status: 'closed', permit: 'Pending' },
  { id: "s4", name: "Laba Laban", address: "Anos, Los Baños", price: 35, turnaroundTime: 48, rating: 4.2, reviewCount: 89, distance: 1.8, latitude: 14.1620, longitude: 121.2520, image: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s5", name: "Bubble Up Hub", address: "Batong Malake, Los Baños", price: 42, turnaroundTime: 6, rating: 4.9, reviewCount: 156, distance: 0.5, latitude: 14.1652, longitude: 121.2408, image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s6", name: "Lumina Wash", address: "Junction, Los Baños", price: 55, turnaroundTime: 18, rating: 4.5, reviewCount: 88, distance: 3.2, latitude: 14.1720, longitude: 121.2350, image: "https://images.unsplash.com/photo-1545173168-9f1947e96a36?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s7", name: "Sparkle Hub", address: "Vega Center, Los Baños", price: 48, turnaroundTime: 36, rating: 4.7, reviewCount: 112, distance: 1.5, latitude: 14.1660, longitude: 121.2420, image: "https://images.unsplash.com/photo-1521656693064-159015f21255?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s8", name: "Laundry Line", address: "Maahas, Los Baños", price: 40, turnaroundTime: 48, rating: 4.3, reviewCount: 95, distance: 4.1, latitude: 14.1580, longitude: 121.2650, image: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?w=400&h=250&fit=crop", status: 'closed', permit: 'Approved' },
  { id: "s9", name: "Clean Wave", address: "Tuntungin-Putho", price: 42, turnaroundTime: 24, rating: 4.4, reviewCount: 67, distance: 3.8, latitude: 14.1550, longitude: 121.2550, image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
  { id: "s10", name: "Urban Wash", address: "College, Los Baños", price: 52, turnaroundTime: 12, rating: 4.85, reviewCount: 142, distance: 0.9, latitude: 14.1680, longitude: 121.2420, image: "https://images.unsplash.com/photo-1567113463300-102582b7c61f?w=400&h=250&fit=crop", status: 'open', permit: 'Approved' },
];

const MOCK_REVIEWS = [
  { id: 1, user: "Charolette Hanlin", rating: 5, comment: "As a person who has a hard time picking up a book to read. I very much enjoy this book and definitely wouldn't mind reading it again 🔥🔥🔥", date: "6 months ago", likes: 647, avatar: "https://i.pravatar.cc/150?u=charolette" },
  { id: 2, user: "Alfonzo Schuessler", rating: 4, comment: "Loved it! Best book ever read the whole entire series and this one is the best. Only thing is it's a little violent. But that's fine with me! 😁", date: "4 months ago", likes: 532, avatar: "https://i.pravatar.cc/150?u=alfonzo" },
  { id: 3, user: "Maryland Winkles", rating: 5, comment: "Amazing book. The best out of the entire series in my opinion. I love the story ❤️❤️", date: "8 months ago", likes: 289, avatar: "https://i.pravatar.cc/150?u=maryland" },
];

function ShopDetailModal({ shop, onClose }) {
  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-[300]">
      <div className="bg-white rounded-[40px] w-full max-w-[550px] h-[88vh] overflow-hidden shadow-2xl animate-scaleIn flex flex-col relative font-outfit">
        <div className="p-6 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-black/5">
          <button onClick={onClose} className="p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-black text-[#1D1D1F] tracking-tighter uppercase">{shop.name}</h3>
          <button className="p-2.5 hover:bg-[#F3F4F6] rounded-full transition-all"><MoreVertical className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          <div className="bg-[#F8F9FA] rounded-[32px] p-6 space-y-6 border border-black/[0.03]">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-black/[0.02] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#80000010] rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-[#800000]" /></div>
                <div className="space-y-0.5 overflow-hidden"><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Location</p><p className="text-xs font-black text-[#1D1D1F] truncate">{shop.address}</p></div>
              </div>
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-black/[0.02] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#80000010] rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-[#800000]" /></div>
                <div className="space-y-0.5"><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Market Rate</p><p className="text-xs font-black text-[#1D1D1F]">₱{shop.price}/kg</p></div>
              </div>
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-black/[0.02] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#80000010] rounded-xl flex items-center justify-center"><Timer className="w-5 h-5 text-[#800000]" /></div>
                <div className="space-y-0.5"><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Throughput</p><p className="text-xs font-black text-[#1D1D1F]">{shop.turnaroundTime}HR Cycle</p></div>
              </div>
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-black/[0.02] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#80000010] rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-[#800000]" /></div>
                <div className="space-y-0.5"><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Compliance</p><p className="text-xs font-black text-[#228B22] uppercase tracking-widest">{shop.permit}</p></div>
              </div>
            </div>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`, "_blank")} className="w-full py-5 bg-[#1D1D1F] text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#800000] transition-all shadow-xl shadow-black/10"><Navigation2 className="w-4 h-4 fill-white" /> Access Live Navigation</button>
          </div>
          <div className="h-px bg-black/5" />
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-8">
              <div className="space-y-1">
                <h2 className="text-6xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shop.rating}</h2>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.floor(shop.rating) ? "fill-[#FF9500] text-[#FF9500]" : "text-[#FF9500] opacity-20"}`} />
                  ))}
                </div>
                <p className="text-xs font-bold text-[#8E8E93] tracking-tight">(6.8k reviews)</p>
              </div>
              <div className="flex-1 space-y-2 pt-2">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-[#1D1D1F] w-2">{n}</span>
                    <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-[#FF9500] rounded-full" style={{ width: `${n === 5 ? 85 : n === 4 ? 60 : n === 3 ? 15 : 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-10 pb-6">
            {MOCK_REVIEWS.map(r => (
              <div key={r.id} className="space-y-4 animate-fadeUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                    <span className="text-sm font-black text-[#1D1D1F]">{r.user}</span>
                  </div>
                  <div className="flex items-center gap-2 border border-[#FF9500] px-3 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-[#FF9500] text-[#FF9500]" />
                    <span className="text-[10px] font-black text-[#FF9500]">{r.rating}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#555] leading-relaxed tracking-tight">{r.comment}</p>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-[#1D1D1F] opacity-50"><Heart className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{r.likes}</span></div>
                  <span className="text-[10px] font-bold text-[#8E8E93]">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarTab, setSidebarTab] = useState("overview");
  const [selectedShop, setSelectedShop] = useState(null);
  const [weights, setWeights] = useState({ rating: 40, price: 30, time: 20, distance: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [mapSelection, setMapSelection] = useState(null);
  const [priorities, setPriorities] = useState(['rating', 'price', 'time', 'distance']);
  const [dragIndex, setDragIndex] = useState(null);

  const handleLogout = () => { logout(); navigate("/login"); };

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

  const rankedShops = useMemo(() => {
    const scores = calculateTopsis(initialShops, weights);
    return initialShops.map(shop => ({ ...shop, score: scores.find(s => s.id === shop.id)?.score ?? 0 })).sort((a, b) => b.score - a.score);
  }, [weights]);

  const nearbyShops = useMemo(() => [...initialShops].sort((a, b) => a.distance - b.distance).slice(0, 3), []);
  const top3 = useMemo(() => rankedShops.slice(0, 3), [rankedShops]);

  const filteredShops = useMemo(() =>
    rankedShops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.address.toLowerCase().includes(searchQuery.toLowerCase())),
    [rankedShops, searchQuery]
  );

  return (
    <div className="flex bg-[#F8F9FA] min-h-screen text-[#1D1D1F] font-outfit overflow-hidden">
      <aside className="w-64 bg-white border-r border-black/[0.05] flex flex-col p-6 sticky top-0 h-screen z-50">
        <div className="flex items-center gap-3 mb-12 px-2"><div className="brand-logo bg-[#800000] w-10 h-10 text-xl">E</div><span className="text-[#1D1D1F] font-black text-xl tracking-tighter uppercase font-outfit">ELaBada</span></div>
        <nav className="flex-1 space-y-2">
          <div className="pb-2 px-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Customer Panel</div>
          <button onClick={() => setSidebarTab("overview")} className={`sidebar-link w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-sm font-black transition-all ${sidebarTab === "overview" ? "bg-[#800000] text-white shadow-lg shadow-[#800000]/20" : "text-[#8E8E93] hover:bg-black/5"}`}><LayoutDashboard className="w-4 h-4" /> Overview</button>
          <button onClick={() => setSidebarTab("shops")} className={`sidebar-link w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-sm font-black transition-all ${sidebarTab === "shops" ? "bg-[#800000] text-white shadow-lg shadow-[#800000]/20" : "text-[#8E8E93] hover:bg-black/5"}`}><Store className="w-4 h-4" /> Laundry Shops</button>
          <button onClick={() => setSidebarTab("map")} className={`sidebar-link w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-sm font-black transition-all ${sidebarTab === "map" ? "bg-[#800000] text-white shadow-lg shadow-[#800000]/20" : "text-[#8E8E93] hover:bg-black/5"}`}><MapIcon className="w-4 h-4" /> Global Map</button>
          <button onClick={() => setSidebarTab("computation")} className={`sidebar-link w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-sm font-black transition-all ${sidebarTab === "computation" ? "bg-[#800000] text-white shadow-lg shadow-[#800000]/20" : "text-[#8E8E93] hover:bg-black/5"}`}><BarChart3 className="w-4 h-4" /> Computation</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-black/[0.05]"><button onClick={handleLogout} className="w-full py-3.5 px-4 rounded-2xl text-[#800000] hover:bg-[#80000008] transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><LogOut className="w-4 h-4" /> Log Out</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {sidebarTab !== "overview" && (
          <header className="h-20 px-10 flex items-center justify-between z-40 bg-[#F8F9FA]/80 backdrop-blur-3xl sticky top-0 border-b border-black/5">
            <div className="flex items-center gap-6 flex-1">
              <div className="relative flex-1 group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Search Shops"
                  className="bg-white border border-black/5 rounded-[24px] pl-16 pr-8 py-4 text-base font-bold w-full focus:border-[#800000]/20 focus:shadow-xl transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar animate-fadeUp`}>
          {sidebarTab === "overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div onClick={() => setSidebarTab("computation")} className="lg:col-span-2 bg-gradient-to-br from-[#800000] to-[#400000] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-center">
                  <div className="relative z-10 space-y-2">
                    <h2 className="text-6xl font-black tracking-tighter mb-4 leading-none font-outfit">Welcome,<br />{user?.name || 'Maria'}</h2>
                    <p className="text-xl font-bold text-white/50 tracking-tight lowercase">set your preferences</p>
                    <div className="pt-6"><div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md group-hover:bg-white/20 transition-all border border-white/5">Analyze Matrix <ArrowUpRight className="w-3 h-3" /></div></div>
                  </div>
                  <Zap className="absolute bottom-10 right-10 w-24 h-24 text-white/5 group-hover:text-white/10 group-hover:scale-110 transition-all" />
                </div>
                <div className="bg-white rounded-[48px] p-10 border border-black/[0.04] shadow-sm flex flex-col justify-between group transition-all hover:shadow-2xl">
                  <div className="flex items-center justify-between"><div className="w-16 h-16 rounded-[24px] bg-[#80000010] flex items-center justify-center"><TrendingUp className="w-8 h-8 text-[#800000]" /></div><span className="bg-[#228B2215] text-[#228B22] text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-[#228B2220]">Network Live</span></div>
                  <div className="mt-6"><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-2">Efficiency Rating</p><h3 className="text-5xl font-black text-[#1D1D1F] tracking-tighter font-outfit leading-none">Peak</h3><p className="text-xs font-bold text-[#228B22] mt-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#228B22] animate-pulse" /> 94.2% Optimization</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[400px]">
                <div className="bg-white rounded-[48px] border border-black/[0.04] shadow-xl flex flex-col overflow-hidden animate-fadeUp">
                  <div className="p-8 pb-4 bg-white/50 backdrop-blur-xl border-b border-black/[0.03] flex items-center gap-5 group/header">
                    <div className="w-16 h-16 rounded-[24px] bg-black/[0.03] flex items-center justify-center shrink-0 border border-black/[0.05] transition-all group-hover/header:bg-[#064e3b10] group-hover/header:border-[#064e3b20]"><MapPin className="w-8 h-8 text-[#1D1D1F] transition-colors group-hover/header:text-[#064e3b]" /></div>
                    <div><h3 className="text-xl font-black text-[#1D1D1F] tracking-tighter uppercase font-outfit transition-colors group-hover/header:text-[#064e3b]">Nearby</h3><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Proximity Hub</p></div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {nearbyShops.map((s, i) => (
                      <div key={s.id} onClick={() => setSelectedShop(s)} className="bg-[#F8F9FA] p-6 rounded-[32px] flex items-center justify-between border border-black/[0.01] hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex items-center gap-4"><div className="text-2xl font-black text-black/10 group-hover:text-[#064e3b] transition-colors font-outfit">#0{i + 1}</div><h4 className="text-base font-black text-[#1D1D1F] tracking-tighter uppercase leading-none truncate max-w-[140px] font-outfit">{s.name}</h4></div>
                        <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-sm group-hover:bg-[#064e3b] group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div onClick={() => setSidebarTab("map")} className="bg-[#003366] rounded-[48px] p-12 text-white shadow-2xl flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center backdrop-blur-md group-hover:bg-white/20 transition-all"><MapIcon className="w-8 h-8" /></div>
                    <div className="space-y-2"><h4 className="text-4xl font-black tracking-tighter uppercase leading-none font-outfit">Location Hubs</h4><p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Explore Spatially</p></div>
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                </div>
                <div className="bg-white rounded-[48px] border border-black/[0.04] shadow-xl flex flex-col overflow-hidden animate-fadeUp">
                  <div className="p-8 pb-4 bg-white/50 backdrop-blur-xl border-b border-black/[0.03] flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-[#80000010] flex items-center justify-center shrink-0 border border-[#80000010]"><Award className="w-8 h-8 text-[#800000]" /></div>
                    <div><h3 className="text-xl font-black text-[#800000] tracking-tighter uppercase font-outfit">Top Tier</h3><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Efficiency Results</p></div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {top3.map((s, i) => (
                      <div key={s.id} onClick={() => setSelectedShop(s)} className="bg-[#F8F9FA] p-6 rounded-[32px] flex items-center justify-between border border-black/[0.01] hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex items-center gap-4"><div className="text-2xl font-black text-[#800000]/10 group-hover:text-[#800000] transition-colors font-outfit">#0{i + 1}</div><h4 className="text-base font-black text-[#1D1D1F] tracking-tighter uppercase leading-none truncate max-w-[140px] font-outfit">{s.name}</h4></div>
                        <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-sm group-hover:bg-[#800000] group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {sidebarTab === "shops" && (
            <div className="space-y-12 animate-fadeUp pb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-[#1D1D1F] tracking-tighter uppercase font-outfit">Directory</h3>
                  <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.4em]">All Active Nodes</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-black/[0.03] shadow-sm font-outfit">
                  <Filter className="w-4 h-4 text-[#800000]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1F]">Filter Nodes</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
                {filteredShops.map(s => (
                  <div key={s.id} onClick={() => setSelectedShop(s)} className="bg-white rounded-[40px] flex flex-col border border-black/[0.02] shadow-sm hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1.5 overflow-hidden">
                    <div className="h-40 w-full relative overflow-hidden">
                      <img src={s.image} className="w-full h-full object-cover transition-all duration-[1500ms] group-hover:scale-110" alt="" />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-[14px] flex items-center gap-1.5 shadow-sm border border-white/20">
                        <Star className="w-3 h-3 fill-[#FFB017] text-[#FFB017]" />
                        <span className="text-[10px] font-black">{s.rating}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-[#1D1D1F] tracking-tighter uppercase leading-tight group-hover:text-[#800000] transition-colors font-outfit">{s.name}</h4>
                        <div className="flex items-center gap-2 text-[#8E8E93]"><MapPin className="w-3 h-3 shrink-0 text-[#800000]/40" /><p className="text-[9px] font-bold uppercase tracking-[0.05em] truncate">{s.address}</p></div>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-black/[0.03] pt-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#800000]/5 p-1.5 rounded-lg"><Tag className="w-3.5 h-3.5 text-[#800000]" /></div>
                          <span className="text-base font-black text-[#1D1D1F] tracking-tighter font-outfit">₱{s.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f9fa] border border-black/[0.01]">
                          {s.status === 'open' && <div className="w-1.5 h-1.5 rounded-full bg-[#228B22] shadow-[0_0_8px_rgba(34,139,34,0.3)] animate-pulse" />}
                          <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${s.status === 'open' ? 'text-[#228B22]' : 'text-[#8E8E93]'}`}>{s.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sidebarTab === "map" && (
            <div className="h-full space-y-8 animate-fadeUp">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
                <div className="xl:col-span-3 bg-white rounded-[48px] overflow-hidden border border-black/[0.04] shadow-xl relative flex flex-col">
                  <div className="flex-1 relative bg-[#E8EAED]">
                    <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&h=1200&fit=crop" className="w-full h-full object-cover grayscale opacity-20" alt="" />
                    {rankedShops.map((s, i) => (
                      <div key={s.id} className="absolute animate-fadeUp z-10" style={{ top: `${15 + (i * 10) + (Math.sin(i * 1.2) * 6)}%`, left: `${12 + (i * 15) + (Math.cos(i * 1.2) * 5)}%` }}>
                        <div className="relative group/map">
                          <button onClick={() => setMapSelection({ ...s, index: i + 1 })} className={`w-14 h-14 rounded-full border-[5px] border-white shadow-2xl flex items-center justify-center transition-all hover:scale-125 hover:z-50 ${i < 3 ? 'bg-[#800000] text-white' : 'bg-[#003366] text-white'}`}><MapPin className="w-6 h-6 fill-white" /></button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/map:opacity-100 transition-all pointer-events-none z-50">
                            <div className="bg-[#1D1D1F] text-white px-6 py-3 rounded-[20px] whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex flex-col items-center border border-white/10">
                              <span>{s.name}</span>
                              <div className="w-3 h-3 bg-[#1D1D1F] rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-[48px] border border-black/[0.04] shadow-xl flex flex-col overflow-hidden">
                  <div className="p-8 pb-4 bg-white/50 backdrop-blur-xl border-b border-black/[0.03] flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-[#80000010] flex items-center justify-center shrink-0 border border-[#80000010]"><Award className="w-8 h-8 text-[#800000]" /></div>
                    <div><h3 className="text-xl font-black text-[#800000] tracking-tighter uppercase font-outfit">Top Tier</h3><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Efficiency Nodes</p></div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {top3.map((s, i) => (
                      <div key={s.id} onClick={() => setSelectedShop(s)} className="bg-[#F8F9FA] p-6 rounded-[32px] flex items-center justify-between border border-black/[0.01] hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex items-center gap-4 cursor-pointer overflow-hidden"><div className="text-2xl font-black text-[#800000]/10 font-outfit">#0{i + 1}</div><h4 className="text-base font-black text-[#1D1D1F] tracking-tighter uppercase leading-none truncate max-w-[140px] font-outfit">{s.name}</h4></div>
                        <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 group-hover:bg-[#800000] group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "computation" && (
            <div className="space-y-12 animate-fadeUp h-[calc(100vh-140px)]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-stretch h-full">
                <div className="flex flex-col h-full bg-white rounded-[48px] border border-black/5 shadow-2xl p-12 space-y-10 min-h-[600px]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-[#800000] uppercase tracking-[0.4em]">Sequence Hub</p>
                      <h3 className="text-4xl font-black text-[#1D1D1F] tracking-tighter uppercase leading-none font-outfit font-[900]">Priority Matrix</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#80000010] flex items-center justify-center"><Target className="w-7 h-7 text-[#800000]" /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-4">
                    {priorities.map((key, index) => (
                      <div key={key} draggable onDragStart={() => onDragStart(index)} onDragOver={onDragOver} onDrop={() => onDrop(index)} className="flex items-center gap-6 bg-[#F8F9FA] p-6 rounded-[32px] border border-black/[0.02] group transition-all hover:border-[#80000015] hover:bg-white hover:shadow-xl cursor-grab active:cursor-grabbing">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-black/[0.01] text-[#800000] group-hover:bg-[#800000] group-hover:text-white transition-all shrink-0"><GripVertical className="w-5 h-5" /></div>
                        <div className="flex-1 overflow-hidden"><p className="text-xl font-black capitalize text-[#1D1D1F] tracking-tighter font-outfit">{key === 'time' ? 'Processing Speed' : key}</p><p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-[0.1em]">Level #0{index + 1}</p></div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-7 bg-[#800000] text-white rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] transition-all shadow-[0_20px_50px_rgba(128,0,0,0.25)] flex items-center justify-center gap-4"><Zap className="w-4 h-4 fill-white" /> Execute Re-Sync</button>
                </div>

                <div className="bg-[#1D1D1F] p-12 rounded-[48px] text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
                  <div className="relative z-10 space-y-12 h-full flex flex-col">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Analytic Hub</p>
                      <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none font-outfit font-[900]">Weight Ranges</h3>
                    </div>
                    <div className="space-y-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                      {Object.entries(weights).map(([key, val], i) => (
                        <div key={key} className="space-y-6 animate-fadeUp">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1"><p className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em]">Module 0{i + 1}</p><p className="text-2xl font-black uppercase tracking-tighter font-outfit leading-none">{key === 'time' ? 'Throughput' : key}</p></div>
                            <div className="flex items-end gap-1"><span className="text-4xl font-black text-[#800000] leading-none font-outfit">{val}</span><span className="text-base font-black text-white/30 mb-0.5">%</span></div>
                          </div>
                          <div className="relative h-10 flex items-center group">
                            <div className="absolute inset-x-0 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-[#800000] to-[#FF0000] transition-all duration-300 rounded-full" style={{ width: `${val}%` }} /></div>
                            <input type="range" min="1" max="100" value={val} onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })} className="relative w-full h-full bg-transparent appearance-none cursor-pointer z-10 opacity-0 group-hover:opacity-10 scale-y-150" />
                            <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-2xl border-[3px] border-[#800000] pointer-events-none transition-all" style={{ left: `calc(${val}% - 14px)` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-10 mt-auto border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-5"><div className="w-12 h-12 rounded-xl bg-[#80000020] flex items-center justify-center border border-[#80000030]"><Activity className="w-6 h-6 text-[#800000]" /></div><div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5">State</p><p className="text-base font-black uppercase font-outfit leading-none">Healthy</p></div></div>
                      <div className="text-right"><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5">Stability</p><p className="text-base font-black text-[#228B22] font-outfit uppercase leading-none">Active</p></div>
                    </div>
                  </div>
                  <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#800000] rounded-full blur-[150px] opacity-10" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {selectedShop && <ShopDetailModal shop={selectedShop} onClose={() => setSelectedShop(null)} />}
    </div>
  );
}

function TrendingUp(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>; }
