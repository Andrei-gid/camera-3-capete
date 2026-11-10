import { Phone, Mail, Clock, Building2, Sparkles } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { formatPhone } from "@/data/siteContent";
import { Link } from "react-router-dom";

const LuxuryFooter = () => {
  const { contact } = useContent();
  const [hoursDays, hoursTime] = contact.hours.split(",").map((x) => x.trim());
  return (
    <footer className="mt-20 relative">
      <div className="relative mx-4 md:mx-0 rounded-t-3xl overflow-hidden">
        {/* Gradient border top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Glass background */}
        <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-t-3xl">
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noise%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%224%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

          <div className="relative px-6 md:px-12 py-12">
            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">

              {/* Column 1: Company */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <h4 className="text-white/90 font-semibold text-sm uppercase tracking-[0.2em]">
                    Companie
                  </h4>
                </div>
                <div className="space-y-2">
                  <p className="text-white text-base font-semibold tracking-wide">
                    {contact.company}
                  </p>
                  <p className="text-white/50 text-sm font-mono tracking-wide">
                    {contact.cui && <>IDNO: {contact.cui}</>}
                  </p>
                  {contact.address && <p className="text-white/50 text-sm tracking-wide">{contact.address}</p>}
                </div>
              </div>

              {/* Column 2: Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <h4 className="text-white/90 font-semibold text-sm uppercase tracking-[0.2em]">
                    Contact
                  </h4>
                </div>
                <ul className="space-y-3">
                  <li>
                    <a
                      href={`tel:${contact.phone}`}
                      className="group flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-amber-400/40 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-white/70 group-hover:text-amber-400 transition-colors" />
                      </span>
                      <span className="text-sm tracking-wide">{formatPhone(contact.phone)}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="group flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-amber-400/40 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-white/70 group-hover:text-amber-400 transition-colors" />
                      </span>
                      <span className="text-sm tracking-wide break-all">{contact.email}</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3: Program */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-white/90 font-semibold text-sm uppercase tracking-[0.2em]">
                    Program de Lucru
                  </h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-white/90 text-sm font-medium">{hoursDays}</p>
                    {hoursTime && <p className="text-white/50 text-sm font-mono tracking-wide">{hoursTime}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Highlight: Online Ordering Notice */}
            <div className="mt-10">
              <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/[0.07] via-amber-400/[0.04] to-transparent p-5 md:p-6">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500" />
                <div className="flex items-start gap-4 pl-2">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-amber-200/90 text-[13px] uppercase tracking-[0.25em] font-semibold mb-1">
                      Comenzi Online 24/7
                    </p>
                    <p className="text-white/85 text-sm md:text-base leading-relaxed">
                      Comenzile online pot fi plasate în orice zi, la orice oră,
                      <span className="text-white font-medium"> fără absolut nicio restricție.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex flex-col items-center gap-2">
                <Link
                  to="/politica-de-confidentialitate"
                  className="text-white/40 hover:text-white/70 text-sm tracking-wide transition-colors"
                >
                  Politică de Confidențialitate
                </Link>
                <p className="text-white/40 text-sm text-center tracking-wide">
                  © {new Date().getFullYear()} {contact.company}. Toate drepturile rezervate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LuxuryFooter;
