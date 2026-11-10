import { Bluetooth, Camera, ChevronLeft, ChevronRight, Lock, Play, Plus, Wifi, Check } from "lucide-react";
import type { AppScreenKey } from "@/data/siteContent";

// Code-drawn phone screens in the style of the camera app (white UI, blue
// primary button), in Romanian, with example data only — no real accounts.
// Crisp at any size, no glare, consistent with the site.

const BLUE = "#2f7bf6";

const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div className={`h-[5%] flex items-end justify-between px-[7%] pb-[1%] text-[7px] font-semibold ${dark ? "text-white/85" : "text-slate-800"}`}>
    <span className="tabular-nums">14:32</span>
    <span className="flex items-center gap-[3px]">
      <Wifi className="w-2 h-2" />
      <span className={`inline-block w-3.5 h-[7px] rounded-[2px] border ${dark ? "border-white/80" : "border-slate-700"} p-[1px]`}>
        <span className={`block h-full w-[70%] rounded-[1px] ${dark ? "bg-white/85" : "bg-slate-700"}`} />
      </span>
    </span>
  </div>
);

const TopBar = ({ action }: { action?: string }) => (
  <div className="h-[6%] flex items-center justify-between px-[5%]">
    <ChevronLeft className="w-3 h-3 text-slate-600" />
    {action && <span className="text-[7px] font-medium" style={{ color: BLUE }}>{action}</span>}
  </div>
);

const PrimaryButton = ({ label, enabled = true }: { label: string; enabled?: boolean }) => (
  <div
    className="absolute left-[6%] right-[6%] bottom-[5%] h-[6%] rounded-full flex items-center justify-center text-[8px] font-semibold text-white"
    style={{ background: BLUE, opacity: enabled ? 1 : 0.55, boxShadow: enabled ? "0 6px 14px -6px rgba(47,123,246,0.8)" : "none" }}
  >
    {label}
  </div>
);

const Field = ({ label, value, caret }: { label: string; value?: string; caret?: boolean }) => (
  <div className="mx-[6%] mt-[5%]">
    <p className="text-[6.5px] text-slate-500">{label}</p>
    <div className="mt-[2px] pb-[3px] border-b text-[8px] text-slate-900 flex items-center" style={{ borderColor: caret ? BLUE : "#cbd5e1" }}>
      <span>{value}</span>
      {caret && <span className="ml-[1px] inline-block w-[1px] h-[9px] animate-pulse" style={{ background: BLUE }} />}
    </div>
  </div>
);

const Title = ({ children, sub }: { children: string; sub?: string }) => (
  <div className="px-[6%] mt-[3%]">
    <p className="text-[12px] font-bold text-slate-900 leading-tight">{children}</p>
    {sub && <p className="mt-[3px] text-[6.5px] text-slate-500 leading-snug">{sub}</p>}
  </div>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50">{children}</div>
);

export const AppScreen = ({ kind, appName }: { kind: AppScreenKey; appName: string }) => {
  if (kind === "download")
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1430] via-[#0a1024] to-[#05070f]">
        <StatusBar dark />
        <div className="absolute inset-x-0 top-[20%] flex flex-col items-center">
          <div
            className="w-[30%] aspect-square rounded-[22%] flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(47,123,246,0.7)]"
            style={{ background: "linear-gradient(145deg,#4f9bff,#1d4fd8)" }}
          >
            <Camera className="w-1/2 h-1/2 text-white" />
          </div>
          <p className="mt-[8%] font-orbitron text-[11px] font-bold text-white">{appName}</p>
          <p className="mt-[2%] text-[7px] text-white/60">Gratuit</p>
        </div>
        <div className="absolute left-[10%] right-[10%] bottom-[16%] space-y-[6%]">
          {[
            { icon: <Play className="w-2.5 h-2.5 fill-white" />, top: "Disponibil pe", name: "Google Play" },
            { icon: <span className="w-2.5 h-2.5 rounded-full border border-white/80" />, top: "Descărcați din", name: "App Store" },
          ].map((s) => (
            <div key={s.name} className="h-7 rounded-lg bg-black ring-1 ring-white/25 flex items-center gap-2 px-3">
              <span className="text-white">{s.icon}</span>
              <span className="leading-none">
                <span className="block text-[5.5px] text-white/70">{s.top}</span>
                <span className="block text-[8.5px] font-semibold text-white">{s.name}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );

  if (kind === "email")
    return (
      <Light>
        <StatusBar />
        <TopBar action="Verificare telefon" />
        <Title>E-mail</Title>
        <div className="mx-[6%] mt-[8%] pb-[4px] border-b border-slate-200 flex items-center justify-between">
          <span className="text-[8px] font-semibold text-slate-900">Moldova</span>
          <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
        </div>
        <Field label="Introduceți adresa de e-mail" value="nume@exemplu.ro" caret />
        <PrimaryButton label="Înainte" />
      </Light>
    );

  if (kind === "code")
    return (
      <Light>
        <StatusBar />
        <TopBar />
        <Title sub="Codul a fost trimis pe nume@exemplu.ro">Introduceți codul de confirmare</Title>
        <div className="mt-[10%] flex justify-center gap-[2.5%]">
          {["4", "8", "2", "9", "", ""].map((d, i) => (
            <span
              key={i}
              className="w-[11%] aspect-[4/5] rounded-[4px] border flex items-center justify-center text-[10px] font-bold text-slate-900 bg-white"
              style={{ borderColor: i === 4 ? BLUE : "#cbd5e1", boxShadow: i === 4 ? "0 0 0 2px rgba(47,123,246,0.15)" : "none" }}
            >
              {d}
            </span>
          ))}
        </div>
        <p className="absolute inset-x-0 bottom-[14%] text-center text-[6.5px] text-slate-400">Retrimite (55s)</p>
        <PrimaryButton label="Înainte" enabled={false} />
      </Light>
    );

  if (kind === "bluetooth")
    return (
      <Light>
        <StatusBar />
        <div className="h-[6%] flex items-center justify-between px-[5%]">
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-[8px] font-semibold text-slate-900">Adăugare dispozitiv</span>
          <Plus className="w-3 h-3" style={{ color: BLUE }} />
        </div>
        <div className="mt-[10%] flex flex-col items-center">
          <span className="relative w-[26%] aspect-square rounded-full flex items-center justify-center" style={{ background: "rgba(47,123,246,0.1)" }}>
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(47,123,246,0.12)" }} />
            <Bluetooth className="w-1/2 h-1/2" style={{ color: BLUE }} />
          </span>
          <p className="mt-[6%] text-[7px] text-slate-500">Căutare prin Bluetooth…</p>
        </div>
        <div className="mx-[6%] mt-[10%] rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-[5%] flex items-center gap-[5%]">
          <span className="w-[22%] aspect-square rounded-lg bg-slate-100 flex items-center justify-center">
            <Camera className="w-1/2 h-1/2 text-slate-700" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[7.5px] font-semibold text-slate-900">Cameră găsită</span>
            <span className="block text-[6px] text-slate-500">Lângă dvs.</span>
          </span>
          <span className="px-[6%] py-[3%] rounded-full text-[6.5px] font-semibold text-white" style={{ background: BLUE }}>
            Adăugați
          </span>
        </div>
      </Light>
    );

  if (kind === "wifi")
    return (
      <Light>
        <StatusBar />
        <TopBar />
        <Title sub="Alegeți rețeaua de acasă și introduceți parola.">Conectare la WiFi</Title>
        <div className="mx-[6%] mt-[8%] rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
          <div className="flex items-center gap-[4%] p-[4%]">
            <Wifi className="w-2.5 h-2.5" style={{ color: BLUE }} />
            <span className="flex-1 text-[7.5px] font-semibold text-slate-900">Acasa_WiFi</span>
            <Check className="w-2.5 h-2.5" style={{ color: BLUE }} />
          </div>
          <div className="flex items-center gap-[4%] p-[4%]">
            <Lock className="w-2.5 h-2.5 text-slate-500" />
            <span className="flex-1 text-[9px] tracking-[0.2em] text-slate-900">••••••••</span>
          </div>
        </div>
        <PrimaryButton label="Conectare" />
      </Light>
    );

  return <div className="absolute inset-0 bg-[#070b14]" />;
};
