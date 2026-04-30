// app/not-found.tsx
"use client";

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-md">
        {/* Brand name */}
        <div className="flex justify-center mb-8">
          <p
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "oklch(62% 0.18 32)" }}
          >
            ScanEat
          </p>
        </div>

        {/* Main card */}
        <div className="border border-slate-200 rounded-[18px] overflow-hidden hover:bg-slate-50 transition-colors">
          {/* Top accent bar */}
          <div className="h-1 bg-accent" />

          <div className="p-8 text-center">
            {/* Error number */}
            <p className="text-[80px] font-extrabold text-slate-900 leading-none mb-2 tracking-tight">
              404
            </p>

            {/* Divider */}
            <div className="w-10 h-0.5 bg-accent rounded-full mx-auto mb-5" />

            {/* Copy */}
            <p className="text-[15px] font-bold text-slate-900 mb-2">
              Página no encontrada
            </p>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              La página que buscas no existe o fue movida a otra dirección.
              Verifica la URL o regresa al inicio.
            </p>

            {/* Action */}
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-gray-50 text-slate-700 py-2.5 rounded-[9px] text-sm font-semibold hover:bg-accent hover:text-white transition"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver atrás
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-3.5 bg-gray-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">ScanEat</p>
            <p className="text-[11px] text-slate-400">
              Error 404 — recurso no disponible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
