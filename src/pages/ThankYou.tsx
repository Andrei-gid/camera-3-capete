import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { fireLeadEvent } from "@/lib/metaPixel";



const ThankYou = () => {
  useEffect(() => {
    let attempts = 0;
    let timer: number | undefined;

    const fireLeadPixel = () => {
      if (fireLeadEvent()) return;
      if (attempts++ < 20) {
        timer = window.setTimeout(fireLeadPixel, 500);
      }
    };

    fireLeadPixel();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black px-4">
      <div className="max-w-lg w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 tracking-wide">
          Vă mulțumim pentru comandă!
        </h1>
        <p className="text-white/80 text-lg mb-3">
          Comanda dumneavoastră a fost înregistrată cu succes.
        </p>
        <p className="text-amber-400 font-medium mb-8">
          Un operator vă va contacta în scurt timp pentru confirmarea livrării.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold tracking-wide hover:scale-105 transition-transform"
        >
          Înapoi la site
        </Link>
      </div>
    </main>
  );
};

export default ThankYou;
