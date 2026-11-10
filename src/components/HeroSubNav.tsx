import { Sliders, FileText } from "lucide-react";

export const HeroSubNav = () => {
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const baseBtn =
    "group flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl text-sm md:text-base font-medium tracking-wide " +
    "text-white/80 bg-transparent border border-white/5 transition-all duration-300 " +
    "hover:bg-amber-400/10 hover:text-white hover:border-amber-400/30 " +
    "hover:shadow-[0_0_20px_rgba(255,180,50,0.15)] active:scale-[0.98]";

  return (
    <section className="relative w-full px-4 md:px-0 mt-4 md:mt-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] p-2 md:p-3">
        <nav className="grid grid-cols-2 gap-2">
          <a href="#specificatii" onClick={(e) => handleAnchor(e, "specificatii")} className={baseBtn}>
            <Sliders className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
            <span>Specificații Tehnice</span>
          </a>
          <a href="#descriere" onClick={(e) => handleAnchor(e, "descriere")} className={baseBtn}>
            <FileText className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
            <span>Descriere Detaliată</span>
          </a>
        </nav>
      </div>
    </section>
  );
};

export default HeroSubNav;
