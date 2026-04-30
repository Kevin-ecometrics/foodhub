// app/page.tsx
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const IconQR = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    <path d="M14 14h3v3" />
    <path d="M21 14v.01" />
    <path d="M21 21v-4" />
    <path d="M14 21h7" />
  </svg>
);

const IconArrow = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#d97751" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconBolt = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconUtensils = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 2v4M8 2v4M3 10h18M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10M8 2h8" />
    <path d="M6 6l1 4M18 6l-1 4" />
  </svg>
);

const metrics = [
  { num: "100%", label: "Digital, sin papel", icon: null },
  { num: "", label: "Actualización en tiempo real", icon: "bolt" },
  { num: "", label: "Pedido desde la mesa", icon: "utensils" },
];

export default function HomePage() {
  return (
    <div
      className={`${plusJakarta.className} min-h-screen flex flex-col bg-white`}
    >
      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-[60px]">
        {/* Tag */}
        <div className="inline-flex items-center gap-1.5 bg-[oklch(96%_0.05_32)] rounded-full px-3.5 py-1.5 mb-7 animate-fadeDown">
          <IconStar />
          <span className="text-xs font-bold text-[oklch(62%_0.18_32)] tracking-widest uppercase">
            Menú Digital
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(36px,6vw,64px)] font-extrabold text-[oklch(20%_0.02_260)] tracking-tight leading-tight text-center max-w-[640px] mb-5 animate-fadeUp">
          Bienvenido a
          <br />
          <span className="text-[oklch(62%_0.18_32)]">ScanEat</span>
        </h1>

        {/* Description */}
        <p className="text-base text-[oklch(55%_0.02_260)] font-normal leading-relaxed text-center max-w-[400px] mb-11 animate-fadeUp">
          Disfruta de una experiencia digital simple, rápida y elegante. Explora
          nuestro menú desde la comodidad de tu mesa.
        </p>

        {/* CTA */}
        <div className="animate-fadeUp">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 bg-[oklch(62%_0.18_32)] text-white text-[15px] font-bold tracking-tight px-8 py-[15px] rounded-xl transition-all duration-180 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)]"
          >
            Entrar <IconArrow />
          </Link>
        </div>

        {/* Metrics card */}
        <div className="mt-[72px] w-full max-w-[560px] bg-[oklch(98.5%_0.005_80)] border border-[oklch(88%_0.01_260)] rounded-2xl p-7 flex items-center justify-between gap-6 flex-wrap animate-fadeUp">
          {metrics.map((item, i) => (
            <div key={i} className="text-center flex-1 min-w-[100px] flex flex-col items-center">
              <div className="min-h-[28px] flex items-center justify-center">
                {item.num && (
                  <span className="text-[22px] font-extrabold text-[oklch(20%_0.02_260)]">
                    {item.num}
                  </span>
                )}
                {item.icon === "bolt" && <IconBolt />}
                {item.icon === "utensils" && <IconUtensils />}
              </div>
              <div className="text-xs text-[oklch(55%_0.02_260)] font-medium mt-2">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-10 border-t border-[oklch(88%_0.01_260)] flex items-center justify-center gap-1.5">
        <span className="text-xs text-[oklch(55%_0.02_260)]">
          © 2026 ScanEat — Todos los derechos reservados.
        </span>
      </footer>
    </div>
  );
}