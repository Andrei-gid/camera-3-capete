import type { ReactNode } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { fireContact } from "@/lib/metaPixel";

// WhatsApp + Viber buttons in the bottom-right corner, stacked above the
// "Întrebări?" assistant bubble. The logos are the official files uploaded in
// /admin (Contacte); until then a plain round button in the brand colour.

const digits = (v: string) => (v || "").replace(/\D/g, "");

export const FloatingMessengers = () => {
  const { contact } = useContent();
  const wa = digits(contact.whatsapp);
  const vb = digits(contact.viber);
  if (!wa && !vb) return null;

  const items = [
    wa && {
      id: "WhatsApp",
      href: `https://wa.me/${wa}${contact.chatText ? `?text=${encodeURIComponent(contact.chatText)}` : ""}`,
      icon: contact.whatsappIcon,
      bg: "#25D366",
      fallback: <MessageCircle className="w-7 h-7" />,
      external: true,
    },
    vb && {
      id: "Viber",
      href: `viber://chat?number=%2B${vb}`,
      icon: contact.viberIcon,
      bg: "#7360F2",
      fallback: <Phone className="w-6 h-6" />,
      external: false,
    },
  ].filter(Boolean) as { id: string; href: string; icon: string; bg: string; fallback: ReactNode; external: boolean }[];

  return (
    <div className="fixed right-5 bottom-[84px] z-50 flex flex-col items-end gap-3">
      {items.map((i) => (
        <a
          key={i.id}
          href={i.href}
          target={i.external ? "_blank" : undefined}
          rel={i.external ? "noopener noreferrer" : undefined}
          onClick={() => fireContact(i.id)}
          aria-label={`Scrieți-ne pe ${i.id}`}
          title={i.id}
          className="block w-14 h-14 rounded-full shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          {i.icon ? (
            <img src={i.icon} alt={i.id} className="w-full h-full object-contain" draggable={false} />
          ) : (
            <span className="flex w-full h-full items-center justify-center rounded-full text-white" style={{ background: i.bg }}>
              {i.fallback}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default FloatingMessengers;
