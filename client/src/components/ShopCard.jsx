import { Star, MapPin, Clock, CheckCircle, Sparkles, Award, ArrowRight } from "lucide-react";

export default function ShopCard({ shop, onViewDetails, topsisScore }) {
  const scoreInt = topsisScore !== undefined && !isNaN(topsisScore)
    ? Math.round(topsisScore * 100) : null;
  const isTopMatch = scoreInt !== null && scoreInt >= 85;

  return (
    <div
      onClick={onViewDetails}
      className="card group cursor-pointer flex flex-col overflow-hidden animate-fadeUp h-full bg-white relative"
    >
      {/* ── Image Section ──────────────────────────── */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <img
          src={shop.image}
          alt={shop.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Status indicator - Forest Green */}
        <div className="absolute top-5 left-5 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${shop.status === "open" ? "status-open" : "status-closed"}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${shop.status === 'open' ? 'text-[#228B22]' : 'text-[#FF3B30]'}`}>
            {shop.status || 'open'}
          </span>
        </div>

        {/* TOPSIS Score Overlay */}
        {scoreInt !== null && (
          <div className="absolute bottom-5 left-5 right-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-white uppercase tracking-widest drop-shadow-lg">
              <span className="bg-[#003366] px-3 py-1.5 rounded-xl border border-white/10">{scoreInt}% Match</span>
            </div>
            <div className="w-full h-1.5 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#003366] to-[#0055AA] transition-all duration-1000 ease-out"
                style={{ width: `${scoreInt}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Body Section ───────────────────────────── */}
      <div className="p-8 flex flex-col flex-1 gap-6">
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.04] pb-5">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tighter leading-tight group-hover:text-[#003366] transition-colors line-clamp-1 mb-1 uppercase">
              {shop.name}
            </h3>
            <div className="flex items-center gap-2 text-[12px] text-[#8E8E93] font-bold">
              <MapPin className="w-4 h-4 text-[#003366]/40" />
              <span className="truncate">{shop.address.split(',')[0]}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#800000] tracking-tighter">
              ₱{shop.price}<span className="text-xs text-[#8E8E93] font-bold">/kg</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-[#FFB017] text-[#FFB017]" />
              <span className="text-2xl font-black text-[#1D1D1F] tracking-tighter leading-none">{shop.rating}</span>
              <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-tighter">/5</span>
            </div>
            <div className="h-4 w-[1px] bg-black/10" />
            <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">
              {shop.reviewCount} Reviews
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F9FA] px-4 py-2 rounded-xl group-hover:bg-[#E1EFFF] transition-colors">
            <Clock className="w-3.5 h-3.5 text-[#003366]" />
            <span className="text-[10px] font-black text-[#003366] uppercase tracking-[0.1em]">{shop.turnaroundTime}HR</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] group-hover:text-[#003366] transition-colors">Learn More</span>
          <ArrowRight className="w-5 h-5 text-black/10 group-hover:text-[#003366] group-hover:translate-x-2 transition-all" />
        </div>
      </div>
    </div>
  );
}
