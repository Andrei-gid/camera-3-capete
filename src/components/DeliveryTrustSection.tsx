import { useEffect, useRef, useState } from "react";
import { PackageCheck } from "lucide-react";

import { useContent } from "@/hooks/useContent";

const DeliveryTrustSection = () => {
  const content = useContent();
  const deliveryTrustImage = content.media.deliveryImage || null;
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full py-20 md:py-28 px-0 md:px-6"
    >
      <div
        className={`mx-auto w-full md:max-w-[560px] transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {deliveryTrustImage ? (
          <img
            src={deliveryTrustImage}
            alt={content.deliveryCard.title}
            loading="lazy"
            className="w-full h-auto block md:rounded-2xl md:shadow-2xl"
          />
        ) : (
          <div className="mx-4 md:mx-0 rounded-[28px] border border-white/15 bg-white/[0.05] backdrop-blur-2xl shadow-[0_30px_80px_-25px_rgba(0,0,0,0.7)] p-8 md:p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-400/15 border border-emerald-300/40 flex items-center justify-center mb-5">
              <PackageCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <p className="font-orbitron text-xl md:text-2xl font-bold text-white leading-snug">
              {content.deliveryCard.title}
            </p>
            <p className="mt-4 text-emerald-300 font-semibold tracking-wide">{content.deliveryCard.subtitle}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DeliveryTrustSection;
