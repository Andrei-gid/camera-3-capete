import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem } from "@/components/CartDrawer";
import { toast } from "sonner";

interface CartProduct {
  id: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  category: "security" | "kitchen";
  checkoutUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addToCart: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const addToCart = (product: CartProduct, quantity: number = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          variantId: product.variantId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          category: product.category,
        },
      ];
    });
    toast.success(`${product.name} adăugat în coș!`);
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Produs eliminat din coș");
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        isCheckoutOpen,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
