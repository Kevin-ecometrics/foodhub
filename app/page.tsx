// app/page.tsx
"use client";
import Link from "next/link";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900">
            Scan<span className="font-semibold">Eat</span>
          </h1>
          <p className="text-xs text-slate-500 tracking-wide mt-1">
            Disfruta de una experiencia digital simple, rápida y elegante
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background shapes mejorados */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-slate-200/40 to-slate-300/20 rounded-full blur-3xl animate-pulse top-[-150px] left-[-150px]" />
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/40 to-slate-300/20 rounded-full blur-3xl animate-pulse delay-1000 bottom-[-150px] right-[-150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-slate-100/40 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Glow wrapper */}
          <div className="relative group">
            {/* Glow mejorado */}
            <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 opacity-30 blur-xl group-hover:opacity-60 transition duration-700"></div>

            {/* Card mejorada */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-10 sm:p-12 border border-slate-200/50 shadow-xl group-hover:shadow-2xl transition-all duration-500">
              {/* Accent line */}
              <div className="w-16 h-1 bg-gradient-to-r from-slate-700 to-slate-500 rounded-full mb-8 mx-auto"></div>

              {/* Content */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-4">
                  Bienvenido
                </h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Disfruta de una experiencia digital simple, rápida y elegante
                </p>
              </div>

              {/* Button mejorado */}
              <Link
                href="/admin"
                className="relative w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white text-sm font-medium tracking-wide overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                <FaMapMarkerAlt className="text-base transition-transform duration-300 group-hover:scale-110" />
                <span>Entrar</span>
              </Link>
            </div>
          </div>

          {/* Text abajo mejorado */}
          <p className="text-center text-xs text-slate-400 mt-8 tracking-wide">
            Explora nuestro menú digital y haz tu pedido desde la comodidad de
            tu mesa. ¡Buen provecho!
          </p>
        </div>
      </main>

      {/* Footer mejorado */}
      <footer className="border-t border-slate-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-slate-500">
            &copy;{new Date().getFullYear()} ScanEat — Todos los derechos
            reservados{" "}
            <a
              href="https://e-commetrics.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-800 font-medium hover:text-slate-600 transition-colors"
            >
              e-commetrics
            </a>
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
          }
        }

        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
