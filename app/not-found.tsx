// app/not-found.tsx
"use client";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Background blur */}
      <div className="absolute w-[400px] h-[400px] bg-slate-200 rounded-full blur-3xl opacity-20 top-[-120px] left-[-120px]" />
      <div className="absolute w-[300px] h-[300px] bg-slate-300 rounded-full blur-3xl opacity-20 bottom-[-120px] right-[-120px]" />

      <div className="text-center max-w-xl w-full relative z-10">
        {/* 404 minimal */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[140px] font-semibold tracking-tight text-slate-900">
            404
          </h1>

          {/* Glow sutil */}
          <div className="absolute inset-0 text-[120px] sm:text-[140px] font-semibold text-slate-300 blur-2xl opacity-40 -z-10">
            404
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          <h2 className="text-2xl font-light text-slate-900 mb-3">
            Página no encontrada
          </h2>

          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            La página que buscas no existe o fue movida. Puedes volver al inicio
            y continuar navegando.
          </p>

          {/* Button */}
          <a
            href="/customer"
            className="relative inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {/* Shine */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition duration-300"></span>
            Volver al inicio
          </a>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-slate-400 mt-6">
          Error 404 — recurso no disponible
        </p>
      </div>
    </div>
  );
}
