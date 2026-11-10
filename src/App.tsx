import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PoliticaRetur from "./pages/PoliticaRetur";
import PoliticaConfidentialitate from "./pages/PoliticaConfidentialitate";
import ThankYou from "./pages/ThankYou";
import OrderPage from "./pages/OrderPage";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/politica-de-retur" element={<PoliticaRetur />} />
            <Route path="/politica-de-confidentialitate" element={<PoliticaConfidentialitate />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
