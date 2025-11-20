// app/not-found.tsx
"use client";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      <div className="text-center max-w-2xl">
        {/* Número 404 con efecto visual */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-9xl font-extrabold text-blue-200 blur-2xl opacity-50 -z-10">
            404
          </div>
        </div>
        {/* Mensaje principal */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto leading-relaxed">
          Lo sentimos, la página que estás buscando no existe o ha sido movida a otra ubicación.
        </p>
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/customer"
            className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}