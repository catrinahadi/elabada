import { Star, MapPin, Clock, ChevronRight, ClipboardList, Tag, AlertTriangle } from "lucide-react";

export default function ShopCard({ shop, onViewDetails, topsisScore }) {
  const scoreInt = topsisScore !== undefined && !isNaN(topsisScore)
    ? Math.round(topsisScore * 100) : null;

  return (
    <div
      onClick={() => shop.status === 'open' && onViewDetails()}
      className={`bg-white rounded-[32px] flex flex-col border border-black/[0.05] shadow-sm transition-all overflow-hidden p-4 h-full ${shop.status === 'open' ? 'hover:shadow-xl cursor-pointer group' : 'opacity-60 cursor-not-allowed grayscale-[0.3]'}`}
    >
      <div className="aspect-[4/3] w-full relative overflow-hidden rounded-[24px] mb-5">
        <img
          src={shop.image || "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80"}
          alt={shop.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";
          }}
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${shop.status === "open" ? "bg-[#228B22]" : "bg-[#8E8E93]"}`} />
          <span className={`text-[9px] font-black capitalize tracking-widest ${shop.status === 'open' ? 'text-[#228B22]' : 'text-[#8E8E93]'}`}>
            {shop.status || 'open'}
          </span>
        </div>

        {scoreInt !== null && (
          <div className="absolute top-3 right-3 bg-[#014421] text-white px-3 py-1.5 rounded-xl text-[10px] font-black capitalize tracking-widest shadow-lg">
            {scoreInt}% Match
          </div>
        )}

      </div>

      <div className="px-1 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-[900] text-[#1D1D1F] tracking-tight leading-none font-outfit truncate">{shop.name}</h4>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />
            <span className="text-xs font-black text-[#1D1D1F]">{shop.rating}</span>
            <span className="text-xs font-bold text-[#8E8E93]">({shop.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#8E8E93]">
          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
          <p className="text-[11px] font-bold truncate">{shop.address}</p>
        </div>

        <div className="flex items-center gap-2 py-1 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className={`w-3.5 h-3.5 ${shop.actualTurnaroundTime >= shop.turnaroundTime + 0.5 ? 'text-[#7B1113]' : 'text-[#014421] opacity-60'}`} />
            <span className={`text-[10px] font-black ${shop.actualTurnaroundTime >= shop.turnaroundTime + 0.5 ? 'text-[#7B1113]' : 'text-[#1D1D1F]'}`}>{shop.turnaroundTime} hr</span>
          </div>
          {shop.actualTurnaroundTime >= shop.turnaroundTime + 0.5 && (
            <div className="relative group/badge">
              <div className="flex items-center px-2 py-[3px] rounded bg-[#FFF5F5] border border-[#7B1113]/20 shadow-sm cursor-help transition-all">
                <span className="text-[9px] font-bold text-[#7B1113] uppercase tracking-wide leading-none pt-[1px]">Delays Reported</span>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1D1D1F] text-white text-[11px] font-normal rounded-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl z-50 text-center">
                Actual time: <span className="font-bold text-[#E53935]">{shop.actualTurnaroundTime} hrs</span>
                <span className="block opacity-60 text-[9px] mt-0.5">computed from recent reviews</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1D1D1F]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8E8E93] capitalize tracking-wider">Price</span>
            <span className="text-lg font-[900] text-[#7B1113] tracking-tighter font-outfit leading-none">₱{shop.price}<span className="text-xs font-bold text-[#8E8E93]/60 lowercase ml-0.5">/kg</span></span>
          </div>
          <button
            disabled={shop.status !== 'open'}
            onClick={(e) => { e.stopPropagation(); shop.status === 'open' && onViewDetails(); }}
            className={`px-5 py-3 rounded-full text-[10px] font-bold capitalize tracking-wider transition-all shadow-lg shadow-black/10 flex items-center justify-center ${shop.status === 'open' ? 'bg-[#1D1D1F] text-white' : 'bg-[#8E8E93]/20 text-[#8E8E93] cursor-not-allowed'}`}
          >
            See details
          </button>
        </div>
      </div>
    </div>
  );
}
