import { useEffect, useRef, useState } from "react";
import { useContent } from "@/hooks/useContent";

const VideoSection = () => {
  // hidden until a video is uploaded in /admin
  const VIDEO_SRC = useContent().media.video || null;
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!VIDEO_SRC) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172a]/60 backdrop-blur-sm py-16 md:py-24 overflow-hidden"
    >
      <div
        className={`mx-auto w-full px-3 md:px-8 transition-all duration-1000 ease-out transform
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="max-w-[850px] mx-auto w-full flex flex-col gap-6">
          <video
            ref={videoRef}
            className="w-full h-auto rounded-2xl shadow-2xl shadow-black/50"
            muted
            autoPlay
            loop
            playsInline
          >
            <source src={VIDEO_SRC ?? ""} type="video/mp4" />
            Browser-ul tău nu suportă redarea video HTML5.
          </video>

          <video
            className="w-full h-auto rounded-2xl shadow-2xl shadow-black/50"
            controls
            preload="metadata"
            playsInline
          >
            <source src={VIDEO_SRC ?? ""} type="video/mp4" />
            Browser-ul tău nu suportă redarea video HTML5.
          </video>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
