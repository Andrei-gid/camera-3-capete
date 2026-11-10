import { Home, SlidersHorizontal, FileText, ShoppingCart, Phone } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";




interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  action?: "navigate" | "scroll" | "tel" | "external";
  targetId?: string;
}

const FloatingGlassSidebar = () => {
  const { contact } = useContent();
  const allNavItems: NavItem[] = [
    { icon: <Home className="w-5 h-5" />, label: "Acasă", href: "/", action: "navigate" },
    { icon: <SlidersHorizontal className="w-5 h-5" />, label: "Specificații", href: "#specificatii", action: "scroll", targetId: "specificatii" },
    { icon: <FileText className="w-5 h-5" />, label: "Descriere", href: "#descriere", action: "scroll", targetId: "descriere" },
    { icon: <ShoppingCart className="w-5 h-5" />, label: "Comandă", href: "/order", action: "navigate" },
    { icon: <Phone className="w-5 h-5" />, label: "Contact", href: `tel:${contact.phone}`, action: "tel" },
  ];
  // WhatsApp / Viber live in the bottom-right corner (FloatingMessengers)
  const navItems = allNavItems;
  const location = useLocation();

  const isActive = (item: NavItem) => {
    if (item.action !== "navigate") return false;
    if (item.href === "/") return location.pathname === "/";
    return location.pathname === item.href || location.pathname.startsWith(item.href);
  };

  return (
    <nav className="floating-glass-nav">
      <div className="floating-glass-nav-items">
        {navItems.map((item) => (
          <NavIcon key={item.href} item={item} isActive={isActive(item)} />
        ))}
      </div>
    </nav>
  );
};

interface NavIconProps {
  item: NavItem;
  isActive: boolean;
}

const NavIcon = ({ item, isActive }: NavIconProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (item.action === "tel" || item.action === "external") return; // let browser handle tel: and external links
    e.preventDefault();

    if (item.action === "scroll" && item.targetId) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById(item.targetId!)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        document.getElementById(item.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (item.action === "navigate") {
      if (item.href === "/") {
        if (location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/");
        }
      } else {
        navigate(item.href);
      }
    }
  };

  const isWhatsApp = item.label === "WhatsApp";

  return (
    <a
      href={item.href}
      onClick={handleClick}
      target={item.action === "external" ? "_blank" : undefined}
      rel={item.action === "external" ? "noopener noreferrer" : undefined}
      className="group relative flex items-center floating-glass-nav-btn"
    >
      <div
        className={cn(
          "floating-glass-nav-icon",
          "backdrop-blur-[10px]",
          isActive ? "nav-tile-active" : "nav-tile"
        )}
        style={{
          background: isActive
            ? "linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(180,100,255,0.1) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
          borderTop: isActive ? "1px solid rgba(0, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.6)",
          borderLeft: isActive ? "1px solid rgba(0, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.6)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          borderRight: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: isActive
            ? "inset 2px 2px 4px rgba(0,0,0,0.1), 0 0 25px rgba(0, 255, 255, 0.4), 0 0 40px rgba(180, 100, 255, 0.2)"
            : "5px 5px 15px rgba(0,0,0,0.1)",
        }}
      >
        <span
          className={cn(
            "transition-all duration-300",
            isWhatsApp
              ? "text-[#25D366] drop-shadow-[0_0_6px_rgba(37,211,102,0.6)]"
              : isActive
                ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]"
                : "text-foreground/80 group-hover:text-foreground group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          )}
        >
          {item.icon}
        </span>
      </div>

      {/* Tooltip - desktop only */}
      <div className="hidden md:block absolute left-full ml-4 tooltip-slide">
        <div className="glass-panel px-3 py-1.5 rounded-lg whitespace-nowrap">
          <span className="text-sm font-medium text-foreground">{item.label}</span>
        </div>
      </div>
    </a>
  );
};

export default FloatingGlassSidebar;
