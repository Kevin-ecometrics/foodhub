"use client";

import PrintNodeConfig from "@/app/waiter/components/PrintNodeConfig";
import Link from "next/link";

export default function PrintNodeConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Configuración de Impresión
              </h1>
              <p className="text-gray-600">
                Configura tu conexión con PrintNode y selecciona las impresoras
                para cada área.
              </p>
            </div>
            <Link
              href="/waiter"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-sm"
            >
              Volver al Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PrintNodeConfig />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Instrucciones de Configuración
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Instala la aplicación de PrintNode en tu computadora
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    2
                  </span>
                  <span>Regístrate en printnode.com y obtén tu API Key</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    3
                  </span>
                  <span>
                    Configura las impresoras en la aplicación de PrintNode
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    4
                  </span>
                  <span>
                    Ingresa tu API Key en las variables de entorno del servidor
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    5
                  </span>
                  <span>
                    Selecciona las impresoras correspondientes para cada área
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                    6
                  </span>
                  <span>
                    Prueba la configuración con el botón Probar impresión
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Notas Importantes
              </h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    Las impresoras deben estar siempre encendidas y conectadas
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    La aplicación de PrintNode debe estar ejecutándose en
                    segundo plano
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    Verifica que las impresoras tengan papel antes de imprimir
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    Los tickets se envían automáticamente al confirmar pedidos
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800 text-white rounded-lg p-6">
              <h3 className="font-semibold mb-3">Tipos de Impresión</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">👨‍🍳 Cocina</div>
                  <div className="text-gray-300">
                    Platos calientes, entradas y guarniciones
                  </div>
                </div>
                <div>
                  <div className="font-medium">🥤 Barra Fría</div>
                  <div className="text-gray-300">
                    Bebidas, cervezas y cocteles
                  </div>
                </div>
                <div>
                  <div className="font-medium">🧾 Tickets</div>
                  <div className="text-gray-300">
                    Tickets para clientes y tickets finales
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
