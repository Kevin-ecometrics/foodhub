interface TableSummaryProps {
  tableTotal: number;
  customerCount: number;
  orderCount: number;
  // Nueva prop para el filtro FCFS
  isHighlighted?: boolean;
}

export default function TableSummary({
  tableTotal,
  customerCount,
  orderCount,
  isHighlighted = false,
}: TableSummaryProps) {
  return (
    <div
      className={`mt-4 pt-4 border-t ${
        isHighlighted ? "border-red-300" : "border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <span
          className={`font-bold text-lg ${
            isHighlighted ? "text-red-800" : "text-gray-800"
          }`}
        >
          TOTAL A PAGAR:
        </span>
        <span
          className={`text-xl font-bold ${
            isHighlighted ? "text-red-700" : "text-green-600"
          }`}
        >
          ${tableTotal.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        {customerCount} comensal{customerCount > 1 ? "es" : ""} • {orderCount}{" "}
        pedido{orderCount > 1 ? "s" : ""} enviado
        {orderCount > 1 ? "s" : ""}
      </p>
    </div>
  );
}
