import { Minus, Plus, Trash2, X, Wallet, ShoppingBag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface CartItem {
  id: string;
  variantId: string; // Shopify variant ID for checkout
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  category: "security" | "kitchen";
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="cart-drawer-glass w-full sm:max-w-md border-l border-white/10 bg-black/90 backdrop-blur-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-white/80" />
              Coșul tău
              {itemCount > 0 && (
                <span className="ml-2 px-2.5 py-0.5 text-sm bg-white/10 rounded-full text-white/70">
                  {itemCount} {itemCount === 1 ? "produs" : "produse"}
                </span>
              )}
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </SheetHeader>

        {/* Gamified Discount Progress Bar */}
        {itemCount > 0 && (
          <div className="px-4 pt-4">
            <DiscountProgressBar itemCount={itemCount} />
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/50 text-lg">Coșul tău este gol</p>
              <p className="text-white/30 text-sm mt-2">
                Adaugă produse pentru a continua
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </div>

        {/* Footer - Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5 space-y-4 bg-black/50 backdrop-blur-xl">
            {/* Delivery Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Livrare</span>
              <span className="text-emerald-400 font-semibold">GRATUIT</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg text-white/80 font-medium">TOTAL</span>
              <span className="text-2xl font-bold text-white">
                {total.toFixed(2)} <span className="text-lg text-white/60">lei</span>
              </span>
            </div>

            {/* Payment Badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 text-sm">
                Plată la livrare (ramburs)
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full h-14 rounded-xl text-lg font-bold tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-[1.02]"
            >
              TRIMITE COMANDA
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Individual Cart Item Card - Holographic Capsule
function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const isSecurityTheme = item.category === "security";
  
  const themeClasses = isSecurityTheme
    ? "cart-item-security"
    : "cart-item-kitchen";
  
  const priceColor = isSecurityTheme
    ? "text-cyan-400"
    : "text-amber-400";

  return (
    <div className={`cart-item-capsule ${themeClasses}`}>
      {/* Left: Product Image */}
      <div className="cart-item-image-container">
        <img
          src={item.image}
          alt={item.name}
          className="cart-item-image"
        />
      </div>

      {/* Center: Product Info */}
      <div className="cart-item-info">
        <h4 className="cart-item-title">{item.name}</h4>
        {item.variant && (
          <p className="cart-item-variant">{item.variant}</p>
        )}
        <p className={`cart-item-price ${priceColor}`}>
          {item.price.toFixed(2)} lei
        </p>
      </div>

      {/* Right: Actions */}
      <div className="cart-item-actions">
        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="cart-item-remove"
          aria-label="Șterge produsul"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Quantity Controls */}
        <div className="cart-item-quantity">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            className="cart-qty-btn"
            aria-label="Scade cantitatea"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="cart-qty-value">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="cart-qty-btn"
            aria-label="Crește cantitatea"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Gamified Discount Progress Bar Component
function DiscountProgressBar({ itemCount }: { itemCount: number }) {
  const getDiscountLevel = () => {
    if (itemCount >= 3) return { level: 3, progress: 100, text: "👑 REDUCERE VIP -15% ACTIVA", tier: "vip" };
    if (itemCount === 2) return { level: 2, progress: 66, text: "🔥 Ai 10% Reducere!", tier: "hot" };
    return { level: 1, progress: 33, text: "✅ 5% Reducere aplicată", tier: "starter" };
  };

  const { progress, text, tier } = getDiscountLevel();

  const tierStyles = {
    starter: {
      bar: "bg-gradient-to-r from-emerald-500 to-cyan-500",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      container: "border-emerald-500/30 bg-emerald-500/10",
    },
    hot: {
      bar: "bg-gradient-to-r from-red-500 to-orange-500 animate-pulse",
      glow: "shadow-[0_0_25px_rgba(239,68,68,0.6)]",
      container: "border-red-500/30 bg-red-500/10",
    },
    vip: {
      bar: "bg-gradient-to-r from-emerald-400 via-pink-500 to-red-500",
      glow: "shadow-[0_0_30px_rgba(236,72,153,0.6)]",
      container: "border-pink-500/30 bg-pink-500/10",
    },
  };

  const styles = tierStyles[tier as keyof typeof tierStyles];

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-xl ${styles.container} ${styles.glow} transition-all duration-500`}>
      <p className="text-center text-white font-bold text-sm mb-3 tracking-wide">
        {text}
      </p>
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${styles.bar}`}
          style={{ width: `${progress}%` }}
        />
        {/* Progress markers */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          <div className={`w-2 h-2 rounded-full ${itemCount >= 1 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`w-2 h-2 rounded-full ${itemCount >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`w-2 h-2 rounded-full ${itemCount >= 3 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
      </div>
      <div className="flex justify-between mt-2 text-sm text-white/50">
        <span>5%</span>
        <span>10%</span>
        <span>15%</span>
      </div>
    </div>
  );
}

export default CartDrawer;
