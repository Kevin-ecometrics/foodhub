/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import {
  waiterService,
  WaiterNotification,
  TableWithOrder,
} from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NotificationsTab from "./components/NotificationsTab";
import TablesTab from "./components/TablesTab";
import ProductsManagement from "./components/ProductsManagement";
import LoadingScreen from "./components/LoadingScreen";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaDollarSign,
  FaExchangeAlt,
  FaTimes,
  FaUsers,
  FaUserPlus,
  FaTrash,
  FaCheck,
  FaUtensils,
} from "react-icons/fa";

// Clave para localStorage
const USD_RATE_STORAGE_KEY = "usd_exchange_rate";

// Modal de confirmación con contraseña - SIMPLIFICADO
function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (password === "restaurant") {
      setError("");
      setPassword("");
      onConfirm();
      onClose();
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Confirmar Cancelación
        </h3>

        <p className="text-gray-600 mb-4">
          Ingrese la contraseña para confirmar la cancelación del producto.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contraseña de autorización"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            disabled={!password}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Calculadora de Pago
function PaymentCalculator({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  tableNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    cash: number;
    terminal: number;
    usd: number;
    usdAmount: number;
    usdRate: number;
    totalPaid: number;
    change: number;
  }) => void;
  totalAmount: number;
  tableNumber: number;
}) {
  // Cargar la tasa de cambio desde localStorage o usar 18.5 por defecto
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [terminalAmount, setTerminalAmount] = useState<number>(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [usdRate, setUsdRate] = useState<number>(getInitialUsdRate);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);
  const [tempRate, setTempRate] = useState<string>(usdRate.toString());

  const usdToMxn = usdAmount * usdRate;
  const totalPaid = cashAmount + terminalAmount + usdToMxn;
  const remainingAmount = totalAmount - totalPaid;
  const change = totalPaid > totalAmount ? totalPaid - totalAmount : 0;
  const needsChange = totalPaid > totalAmount;

  useEffect(() => {
    if (typeof window !== "undefined" && usdRate > 0) {
      localStorage.setItem(USD_RATE_STORAGE_KEY, usdRate.toString());
    }
  }, [usdRate]);

  useEffect(() => {
    if (isOpen) {
      setCashAmount(0);
      setTerminalAmount(0);
      setUsdAmount(0);
      const currentRate = getInitialUsdRate();
      setUsdRate(currentRate);
      setTempRate(currentRate.toString());
      setShowRateInput(false);
    }
  }, [isOpen]);

  const handleCashChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCashAmount(Math.max(0, numValue));
  };

  const handleTerminalChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTerminalAmount(Math.max(0, numValue));
  };

  const handleUsdChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setUsdAmount(Math.max(0, numValue));
  };

  const handleRateChange = () => {
    const newRate = parseFloat(tempRate);
    if (!isNaN(newRate) && newRate > 0) {
      setUsdRate(newRate);
      setShowRateInput(false);
    } else {
      setTempRate(usdRate.toString());
      alert("Por favor ingrese una tasa de cambio válida");
    }
  };

  const handleConfirm = () => {
    if (totalPaid === 0) {
      alert("Debe ingresar al menos un monto de pago");
      return;
    }

    onConfirm({
      cash: cashAmount,
      terminal: terminalAmount,
      usd: usdAmount,
      usdAmount: usdToMxn,
      usdRate: usdRate,
      totalPaid: totalPaid,
      change: change,
    });
    onClose();
  };

  const fillRemaining = () => {
    const remaining = totalAmount - totalPaid;
    if (remaining > 0) {
      setCashAmount(cashAmount + remaining);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Calculadora de Pago
            </h2>
            <p className="text-sm text-gray-600">Mesa {tableNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="border-b pb-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">
                  Total a pagar
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaMoneyBillWave className="text-green-600 text-xl" />
                <span className="font-semibold text-gray-800">
                  Efectivo (MXN)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cashAmount === 0 ? "" : cashAmount}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    setCashAmount(totalAmount - totalPaid + cashAmount)
                  }
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Llenar
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaCreditCard className="text-blue-600 text-xl" />
                <span className="font-semibold text-gray-800">
                  Terminal (MXN)
                </span>
              </div>
              <input
                type="number"
                value={terminalAmount === 0 ? "" : terminalAmount}
                onChange={(e) => handleTerminalChange(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaDollarSign className="text-yellow-600 text-xl" />
                  <span className="font-semibold text-gray-800">
                    Dólares (USD)
                  </span>
                </div>
                <button
                  onClick={() => setShowRateInput(!showRateInput)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <FaExchangeAlt />
                  Cambiar tasa
                </button>
              </div>

              {showRateInput && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <label className="text-xs text-gray-600 block mb-1">
                    Tasa de cambio (USD a MXN):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      step="0.01"
                    />
                    <button
                      onClick={handleRateChange}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              )}

              {!showRateInput && (
                <div className="mb-2 text-xs text-gray-500 text-right">
                  Tasa: 1 USD = ${usdRate.toFixed(2)} MXN
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={usdAmount === 0 ? "" : usdAmount}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">USD</span>
              </div>
              <div className="text-right text-sm text-gray-600">
                = ${usdToMxn.toFixed(2)} MXN
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Efectivo:</span>
              <span className="font-medium">${cashAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Terminal:</span>
              <span className="font-medium">${terminalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Dólares:</span>
              <span className="font-medium">
                ${usdAmount.toFixed(2)} USD = ${usdToMxn.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total pagado:</span>
                <span
                  className={
                    totalPaid >= totalAmount
                      ? "text-green-600"
                      : "text-orange-600"
                  }
                >
                  ${totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold mt-1">
                <span>Falta por pagar:</span>
                <span
                  className={
                    remainingAmount > 0 ? "text-red-600" : "text-green-600"
                  }
                >
                  ${Math.max(0, remainingAmount).toFixed(2)}
                </span>
              </div>
              {needsChange && (
                <div className="flex justify-between font-bold mt-1 text-green-600">
                  <span>Cambio a devolver:</span>
                  <span>${change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={fillRemaining}
              disabled={remainingAmount <= 0}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Completar con Efectivo
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-xl font-medium hover:bg-red-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalPaid === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Pagos Individuales - Usa los comensales existentes
function SeparatePaymentsModal({
  isOpen,
  onClose,
  onConfirm,
  tableOrders,
  tableNumber,
  totalAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    payments: Array<{
      guestName: string;
      items: Array<{
        itemId: string;
        productName: string;
        quantity: number;
        price: number;
        subtotal: number;
      }>;
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
      total: number;
    }>,
  ) => void;
  tableOrders: Array<{
    id: string;
    customer_name: string | null;
    order_items: Array<{
      id: string;
      product_name: string;
      quantity: number;
      price: number;
      cancelled_quantity?: number;
    }>;
  }>;
  tableNumber: number;
  totalAmount: number;
}) {
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  interface Guest {
    id: string;
    name: string;
    items: Array<{
      itemId: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    cashAmount: number;
    terminalAmount: number;
    usdAmount: number;
    usdRate: number;
    orderId: string;
  }

  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGuestForPayment, setSelectedGuestForPayment] = useState<
    string | null
  >(null);

  // Inicializar comensales desde las órdenes existentes
  useEffect(() => {
    if (isOpen && tableOrders.length > 0) {
      const customersMap = new Map<string, Guest>();

      tableOrders.forEach((order) => {
        const customerName = order.customer_name || "Cliente sin nombre";

        if (!customersMap.has(customerName)) {
          customersMap.set(customerName, {
            id: crypto.randomUUID(),
            name: customerName,
            items: [],
            cashAmount: 0,
            terminalAmount: 0,
            usdAmount: 0,
            usdRate: getInitialUsdRate(),
            orderId: order.id,
          });
        }

        const guest = customersMap.get(customerName)!;

        // Agregar items de esta orden
        order.order_items.forEach((item) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;

          if (activeQuantity > 0) {
            const existingItem = guest.items.find((i) => i.itemId === item.id);
            if (existingItem) {
              existingItem.quantity += activeQuantity;
              existingItem.subtotal =
                existingItem.quantity * existingItem.price;
            } else {
              guest.items.push({
                itemId: item.id,
                productName: item.product_name,
                quantity: activeQuantity,
                price: item.price,
                subtotal: activeQuantity * item.price,
              });
            }
          }
        });
      });

      const guestsList = Array.from(customersMap.values());
      setGuests(guestsList);
      if (guestsList.length > 0) {
        setSelectedGuestId(guestsList[0].id);
      }
    }
  }, [isOpen, tableOrders]);

  const updateGuestPayment = (
    guestId: string,
    paymentData: {
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
    },
  ) => {
    setGuests(
      guests.map((guest) => {
        if (guest.id !== guestId) return guest;
        return {
          ...guest,
          cashAmount: paymentData.cash,
          terminalAmount: paymentData.terminal,
          usdAmount: paymentData.usd,
          usdRate: paymentData.usdRate,
        };
      }),
    );
    setShowPaymentModal(false);
    setSelectedGuestForPayment(null);
  };

  const getGuestTotal = (guest: Guest) => {
    const itemsTotal = guest.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const usdToMxn = guest.usdAmount * guest.usdRate;
    const paidTotal = guest.cashAmount + guest.terminalAmount + usdToMxn;
    return { itemsTotal, paidTotal, remaining: itemsTotal - paidTotal };
  };

  const getOverallRemaining = () => {
    const totalPaid = guests.reduce((sum, guest) => {
      const usdToMxn = guest.usdAmount * guest.usdRate;
      return sum + guest.cashAmount + guest.terminalAmount + usdToMxn;
    }, 0);
    return totalAmount - totalPaid;
  };

  const handleConfirmAll = () => {
    // Verificar que cada comensal haya pagado lo suyo
    const guestsWithDebt = guests.filter((guest) => {
      const { remaining } = getGuestTotal(guest);
      return remaining > 0;
    });

    if (guestsWithDebt.length > 0) {
      alert(`Faltan pagos de: ${guestsWithDebt.map((g) => g.name).join(", ")}`);
      return;
    }

    const payments = guests.map((guest) => ({
      guestName: guest.name,
      items: guest.items,
      cash: guest.cashAmount,
      terminal: guest.terminalAmount,
      usd: guest.usdAmount,
      usdRate: guest.usdRate,
      total: guest.items.reduce((sum, item) => sum + item.subtotal, 0),
    }));

    onConfirm(payments);
    onClose();
  };

  if (!isOpen) return null;

  const selectedGuest = guests.find((g) => g.id === selectedGuestId);
  const overallRemaining = getOverallRemaining();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                Pagos Individuales
              </h2>
              <p className="text-sm text-gray-600">Mesa {tableNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="p-6">
            {/* Resumen total */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">
                  Total de la cuenta:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Restante por pagar:</span>
                <span
                  className={`text-xl font-bold ${overallRemaining > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  ${overallRemaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Lista de comensales */}
              <div className="w-80 flex-shrink-0">
                <h3 className="font-semibold text-gray-800 mb-3">Comensales</h3>
                <div className="space-y-2">
                  {guests.map((guest) => {
                    const { itemsTotal, paidTotal, remaining } =
                      getGuestTotal(guest);
                    return (
                      <div
                        key={guest.id}
                        onClick={() => setSelectedGuestId(guest.id)}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          selectedGuestId === guest.id
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-800">
                              {guest.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {guest.items.length} productos
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>${itemsTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pagado:</span>
                            <span className="text-green-600">
                              ${paidTotal.toFixed(2)}
                            </span>
                          </div>
                          {remaining > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Falta:</span>
                              <span>${remaining.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detalle del comensal seleccionado */}
              {selectedGuest && (
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {selectedGuest.name} - Productos
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedGuestForPayment(selectedGuest.id);
                        setShowPaymentModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                    >
                      <FaMoneyBillWave />
                      Registrar Pago
                    </button>
                  </div>

                  {/* Items del comensal */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Productos:
                    </h4>
                    {selectedGuest.items.length === 0 ? (
                      <p className="text-gray-400 text-sm">Sin productos</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedGuest.items.map((item) => (
                          <div
                            key={item.itemId}
                            className="flex justify-between items-center bg-gray-50 p-2 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {item.productName}
                              </span>
                              <span className="text-gray-500 text-sm ml-2">
                                {item.quantity} x ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="font-medium">
                              ${item.subtotal.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen de pagos del comensal */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Total en productos:</span>
                        <span>
                          ${getGuestTotal(selectedGuest).itemsTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Pagado:</span>
                        <span>
                          ${getGuestTotal(selectedGuest).paidTotal.toFixed(2)}
                        </span>
                      </div>
                      {getGuestTotal(selectedGuest).remaining > 0 && (
                        <div className="flex justify-between text-red-600 font-medium">
                          <span>Falta por pagar:</span>
                          <span>
                            ${getGuestTotal(selectedGuest).remaining.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {getGuestTotal(selectedGuest).remaining < 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Sobrante (cambio):</span>
                          <span>
                            $
                            {Math.abs(
                              getGuestTotal(selectedGuest).remaining,
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAll}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FaCheck />
                Finalizar y Cobrar Todo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pago individual */}
      {showPaymentModal && selectedGuestForPayment && (
        <GuestPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedGuestForPayment(null);
          }}
          onConfirm={updateGuestPayment}
          guest={guests.find((g) => g.id === selectedGuestForPayment)!}
          tableNumber={tableNumber}
        />
      )}
    </>
  );
}

// Modal de pago individual por comensal
function GuestPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  guest,
  tableNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    guestId: string,
    paymentData: {
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
    },
  ) => void;
  guest: any;
  tableNumber: number;
}) {
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [terminalAmount, setTerminalAmount] = useState<number>(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [usdRate, setUsdRate] = useState<number>(getInitialUsdRate);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);
  const [tempRate, setTempRate] = useState<string>(usdRate.toString());

  const itemsTotal =
    guest?.items.reduce((sum: number, item: any) => sum + item.subtotal, 0) ||
    0;
  const usdToMxn = usdAmount * usdRate;
  const totalPaid = cashAmount + terminalAmount + usdToMxn;
  const remaining = itemsTotal - totalPaid;

  useEffect(() => {
    if (isOpen && guest) {
      setCashAmount(0);
      setTerminalAmount(0);
      setUsdAmount(0);
      const currentRate = getInitialUsdRate();
      setUsdRate(currentRate);
      setTempRate(currentRate.toString());
    }
  }, [isOpen, guest]);

  const handleConfirm = () => {
    if (totalPaid === 0) {
      alert("Debe ingresar al menos un monto de pago");
      return;
    }

    onConfirm(guest.id, {
      cash: cashAmount,
      terminal: terminalAmount,
      usd: usdAmount,
      usdRate: usdRate,
    });
    onClose();
  };

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Pago de {guest.name}
            </h2>
            <p className="text-sm text-gray-600">Mesa {tableNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-xl font-bold text-green-600">
                ${itemsTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <FaMoneyBillWave className="text-green-600" />
              <span className="font-semibold">Efectivo (MXN)</span>
            </div>
            <input
              type="number"
              value={cashAmount === 0 ? "" : cashAmount}
              onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="bg-white border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <FaCreditCard className="text-blue-600" />
              <span className="font-semibold">Terminal (MXN)</span>
            </div>
            <input
              type="number"
              value={terminalAmount === 0 ? "" : terminalAmount}
              onChange={(e) =>
                setTerminalAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="bg-white border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaDollarSign className="text-yellow-600" />
                <span className="font-semibold">Dólares (USD)</span>
              </div>
              <button
                onClick={() => setShowRateInput(!showRateInput)}
                className="text-xs text-blue-600"
              >
                Cambiar tasa
              </button>
            </div>
            {showRateInput && (
              <div className="mb-2 flex gap-2">
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => {
                    const newRate = parseFloat(tempRate);
                    if (!isNaN(newRate) && newRate > 0) {
                      setUsdRate(newRate);
                      setShowRateInput(false);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  OK
                </button>
              </div>
            )}
            <input
              type="number"
              value={usdAmount === 0 ? "" : usdAmount}
              onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              = ${usdToMxn.toFixed(2)} MXN (tasa: {usdRate})
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between">
              <span>Total pagado:</span>
              <span className="font-bold">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Restante:</span>
              <span
                className={
                  remaining > 0 ? "text-red-600 font-bold" : "text-green-600"
                }
              >
                ${remaining > 0 ? remaining.toFixed(2) : "0.00"}
              </span>
            </div>
            {remaining < 0 && (
              <div className="flex justify-between mt-1 text-green-600">
                <span>Cambio:</span>
                <span>${Math.abs(remaining).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Registrar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente simple para ordenar mesas
function TablesOrderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Ordenar mesas:
        </span>

        <div className="flex bg-gray-100 rounded-lg">
          <button
            onClick={() => onChange("number")}
            className={`
          flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm
          ${
            value === "number"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }
        `}
            title="Ordenar por número de mesa"
          >
            <span>#</span>
            <span>Número</span>
          </button>
          <button
            onClick={() => onChange("occupation")}
            className={`
          flex items-center gap-2 px-3 py-2 rounded-r-lg text-sm
          ${
            value === "occupation"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }
        `}
            title="Ordenar por tiempo de ocupación"
          >
            <span>🕐</span>
            <span>Tiempo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WaiterDashboard() {
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "tables" | "products"
  >("notifications");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [attendedNotifications, setAttendedNotifications] = useState<
    Set<string>
  >(new Set());

  const [fcfsFilter, setFcfsFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_fcfs_filter");
      return saved === "true";
    }
    return false;
  });

  const [tablesOrder, setTablesOrder] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_tables_order");
      return saved || "number";
    }
    return "number";
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingCancelAction, setPendingCancelAction] = useState<{
    itemId: string;
    cancelQuantity: number;
  } | null>(null);

  const [showPaymentCalculator, setShowPaymentCalculator] = useState(false);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<{
    id: number;
    number: number;
    total: number;
  } | null>(null);

  const [showSeparatePayments, setShowSeparatePayments] = useState(false);
  const [selectedTableForSeparate, setSelectedTableForSeparate] = useState<{
    id: number;
    number: number;
    total: number;
    orders: any[];
  } | null>(null);

  const scrollPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    const interval = setInterval(() => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      scrollPositionRef.current =
        window.scrollY || document.documentElement.scrollTop;

      loadData().finally(() => {
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          isUpdatingRef.current = false;
        }, 100);
      });
    }, 120000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("waiter_fcfs_filter", fcfsFilter.toString());
  }, [fcfsFilter]);

  useEffect(() => {
    localStorage.setItem("waiter_tables_order", tablesOrder);
  }, [tablesOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      let processedNotifications = [...notifsData];
      if (fcfsFilter) {
        processedNotifications = applyFcfsFilter(processedNotifications);
      }

      const processedTables = tablesData.map((table) => ({
        ...table,
        orders: table.orders.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const finalCancelledQty =
              item.status === "cancelled" && cancelledQty === 0
                ? item.quantity
                : cancelledQty;

            return {
              ...item,
              cancelled_quantity: finalCancelledQty,
            };
          }),
        })),
      }));

      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedNotifications)
          ? prev
          : processedNotifications,
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedTables)
          ? prev
          : processedTables,
      );
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFcfsFilter = (notificationsList: WaiterNotification[]) => {
    return [...notificationsList].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  };

  const setupRealtimeSubscription = () => {
    const notificationsSub = supabase
      .channel("waiter-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
        },
        () => {
          if (isUpdatingRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const ordersSub = supabase
      .channel("waiter-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          if (isUpdatingRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const orderItemsSub = supabase
      .channel("waiter-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          if (isUpdatingRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const tablesSub = supabase
      .channel("waiter-tables")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          if (isUpdatingRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    return () => {
      notificationsSub.unsubscribe();
      ordersSub.unsubscribe();
      orderItemsSub.unsubscribe();
      tablesSub.unsubscribe();
    };
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      setAttendedNotifications((prev) => new Set(prev).add(notificationId));
    } catch (error) {
      console.error("Error marcando notificación como atendida:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await waiterService.completeNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setAttendedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (error) {
      console.error("Error completando notificación:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelItem = async (
    itemId: string,
    cancelQuantity: number = 1,
  ) => {
    setPendingCancelAction({ itemId, cancelQuantity });
    setShowPasswordModal(true);
  };

  const executeCancelItem = async () => {
    if (!pendingCancelAction) return;

    const { itemId, cancelQuantity } = pendingCancelAction;
    setProcessing(itemId);

    try {
      await waiterService.cancelOrderItem(itemId, cancelQuantity);

      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map((order) => ({
            ...order,
            order_items: order.order_items.map((item) => {
              if (item.id === itemId) {
                const newCancelledQty =
                  (item.cancelled_quantity || 0) + cancelQuantity;
                const newStatus =
                  item.quantity - newCancelledQty === 0
                    ? "cancelled"
                    : item.status;

                return {
                  ...item,
                  cancelled_quantity: newCancelledQty,
                  status: newStatus,
                };
              }
              return item;
            }),
          })),
        })),
      );
    } catch (error: any) {
      console.error("Error cancelando producto:", error);
      alert(`Error al cancelar el producto:\n${error.message}`);
      await loadData();
    } finally {
      setProcessing(null);
      setPendingCancelAction(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      await waiterService.updateItemStatus(itemId, newStatus as never);

      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map(
            (order) =>
              ({
                ...order,
                order_items: order.order_items.map((item) =>
                  item.id === itemId ? { ...item, status: newStatus } : item,
                ),
              }) as never,
          ),
        })),
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        const orderTotal = order.order_items.reduce(
          (orderSum: number, item: any) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            if (activeQuantity > 0) {
              return orderSum + item.price * activeQuantity;
            }
            return orderSum;
          },
          0,
        );
        return total + orderTotal;
      }
      return total + order.total_amount;
    }, 0);
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    setSelectedTableForPayment({
      id: tableId,
      number: tableNumber,
      total: tableTotal,
    });
    setShowPaymentCalculator(true);
  };

  const handlePagarPorSeparado = async (
    tableId: number,
    tableNumber: number,
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const tableTotal = calculateTableTotal(table);

    setSelectedTableForSeparate({
      id: tableId,
      number: tableNumber,
      total: tableTotal,
      orders: table.orders,
    });
    setShowSeparatePayments(true);
  };

  const handleSeparatePaymentsConfirm = async (payments: any[]) => {
    if (!selectedTableForSeparate) return;

    setProcessing(`separate-${selectedTableForSeparate.id}`);
    try {
      let totalCash = 0;
      let totalTerminal = 0;
      let totalUsd = 0;
      let usdRateUsed = 18.5;

      payments.forEach((payment) => {
        totalCash += payment.cash;
        totalTerminal += payment.terminal;
        totalUsd += payment.usd;
        if (payment.usdRate) usdRateUsed = payment.usdRate;
      });

      let paymentMethod: "cash" | "terminal" | "mixed" | "usd" | null = null;
      let methodsUsed = 0;
      if (totalCash > 0) methodsUsed++;
      if (totalTerminal > 0) methodsUsed++;
      if (totalUsd > 0) methodsUsed++;

      if (methodsUsed === 1) {
        if (totalCash > 0) paymentMethod = "cash";
        else if (totalTerminal > 0) paymentMethod = "terminal";
        else if (totalUsd > 0) paymentMethod = "usd";
      } else if (methodsUsed > 1) {
        paymentMethod = "mixed";
      }

      await waiterService.freeTableAndClean(
        selectedTableForSeparate.id,
        selectedTableForSeparate.number,
        paymentMethod,
      );

      let successMessage = `✅ Mesa ${selectedTableForSeparate.number} cobrada exitosamente (Pagos Individuales).\n\n`;
      successMessage += `💰 Total: $${selectedTableForSeparate.total.toFixed(2)}\n`;
      successMessage += `👥 ${payments.length} comensales\n\n`;

      payments.forEach((payment, idx) => {
        successMessage += `👤 ${payment.guestName}:\n`;
        successMessage += `   Productos: $${payment.total.toFixed(2)}\n`;
        successMessage += `   Pagado: $${(payment.cash + payment.terminal + payment.usd * (payment.usdRate || usdRateUsed)).toFixed(2)}\n`;
        if (payment.cash > 0)
          successMessage += `   💵 Efectivo: $${payment.cash.toFixed(2)}\n`;
        if (payment.terminal > 0)
          successMessage += `   💳 Terminal: $${payment.terminal.toFixed(2)}\n`;
        if (payment.usd > 0)
          successMessage += `   💵 Dólares: $${payment.usd.toFixed(2)} USD\n`;
        successMessage += `\n`;
      });

      alert(successMessage);
      await loadData();
    } catch (error: any) {
      console.error("Error en pagos individuales:", error);
      alert(
        `❌ Error al procesar pagos individuales de la mesa ${selectedTableForSeparate.number}:\n${error.message}`,
      );
    } finally {
      setProcessing(null);
      setShowSeparatePayments(false);
      setSelectedTableForSeparate(null);
    }
  };

  const handlePaymentConfirm = async (paymentData: any) => {
    if (!selectedTableForPayment) return;

    setProcessing(`cobrar-${selectedTableForPayment.id}`);
    try {
      let paymentMethod: "cash" | "terminal" | "mixed" | "usd" | null = null;

      let methodsUsed = 0;
      if (paymentData.cash > 0) methodsUsed++;
      if (paymentData.terminal > 0) methodsUsed++;
      if (paymentData.usd > 0) methodsUsed++;

      if (methodsUsed === 1) {
        if (paymentData.cash > 0) {
          paymentMethod = "cash";
        } else if (paymentData.terminal > 0) {
          paymentMethod = "terminal";
        } else if (paymentData.usd > 0) {
          paymentMethod = "usd";
        }
      } else if (methodsUsed > 1) {
        paymentMethod = "mixed";
      }

      await waiterService.freeTableAndClean(
        selectedTableForPayment.id,
        selectedTableForPayment.number,
        paymentMethod,
      );

      let successMessage = `✅ Mesa ${selectedTableForPayment.number} cobrada exitosamente.\n\n`;
      successMessage += `💰 Total: $${selectedTableForPayment.total.toFixed(2)}\n`;
      successMessage += `💵 Pagado: $${paymentData.totalPaid.toFixed(2)}\n`;
      successMessage += `💳 Método: ${
        paymentMethod === "cash"
          ? "EFECTIVO"
          : paymentMethod === "terminal"
            ? "TERMINAL"
            : paymentMethod === "usd"
              ? "DÓLARES"
              : "MIXTO"
      }\n\n`;

      if (paymentData.cash > 0) {
        successMessage += `💵 Efectivo: $${paymentData.cash.toFixed(2)}\n`;
      }
      if (paymentData.terminal > 0) {
        successMessage += `💳 Terminal: $${paymentData.terminal.toFixed(2)}\n`;
      }
      if (paymentData.usd > 0) {
        successMessage += `💵 Dólares: $${paymentData.usd.toFixed(2)} USD ($${paymentData.usdAmount.toFixed(2)} MXN)\n`;
      }
      if (paymentData.change > 0) {
        successMessage += `\n🔄 Cambio a devolver: $${paymentData.change.toFixed(2)}`;
      }

      alert(successMessage);
      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      alert(
        `❌ Error al cobrar la mesa ${selectedTableForPayment.number}:\n${error.message}`,
      );
    } finally {
      setProcessing(null);
      setShowPaymentCalculator(false);
      setSelectedTableForPayment(null);
    }
  };

  const handleGoToTables = () => {
    setActiveTab("tables");
  };

  const handleError = (error: string) => {
    alert(error);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header loading={loading} onRefresh={loadData} />

      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationsCount={notifications.length}
        occupiedTablesCount={
          tables.filter((t) => t.status === "occupied").length
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            processing={processing}
            attendedNotifications={attendedNotifications}
            onAcknowledgeNotification={handleAcknowledgeNotification}
            onCompleteNotification={handleCompleteNotification}
            onGoToTables={handleGoToTables}
          />
        )}

        {activeTab === "tables" && (
          <>
            <TablesOrderSelect value={tablesOrder} onChange={setTablesOrder} />

            <TablesTab
              tables={tables}
              processing={processing}
              onUpdateItemStatus={handleUpdateItemStatus}
              onCancelItem={handleCancelItem}
              onCobrarMesa={handleCobrarMesa}
              onPagarPorSeparado={handlePagarPorSeparado}
              calculateTableTotal={calculateTableTotal}
              notifications={notifications}
              tablesOrder={tablesOrder}
            />
          </>
        )}

        {activeTab === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={executeCancelItem}
      />

      <PaymentCalculator
        isOpen={showPaymentCalculator}
        onClose={() => {
          setShowPaymentCalculator(false);
          setSelectedTableForPayment(null);
        }}
        onConfirm={handlePaymentConfirm}
        totalAmount={selectedTableForPayment?.total || 0}
        tableNumber={selectedTableForPayment?.number || 0}
      />

      <SeparatePaymentsModal
        isOpen={showSeparatePayments}
        onClose={() => {
          setShowSeparatePayments(false);
          setSelectedTableForSeparate(null);
        }}
        onConfirm={handleSeparatePaymentsConfirm}
        tableOrders={selectedTableForSeparate?.orders || []}
        tableNumber={selectedTableForSeparate?.number || 0}
        totalAmount={selectedTableForSeparate?.total || 0}
      />
    </div>
  );
}
