import { FaSpinner } from "react-icons/fa";

interface OrderItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  processing: string | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
}

export default function OrderItem({
  item,
  processing,
  onUpdateStatus,
}: OrderItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex justify-between items-start text-sm bg-gray-50 p-2 rounded">
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium">
            {item.product_name} × {item.quantity}
          </span>
          <span className="font-semibold text-green-600">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            ${item.price.toFixed(2)} c/u
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={item.status}
              onChange={(e) => onUpdateStatus(item.id, e.target.value)}
              disabled={processing === item.id}
              className={`text-xs rounded px-2 py-1 ${getStatusColor(
                item.status
              )}`}
            >
              <option value="ordered">Ordenado</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Listo</option>
              <option value="served">Servido</option>
            </select>
            {processing === item.id && (
              <FaSpinner className="animate-spin text-blue-500" />
            )}
          </div>
        </div>
        {item.notes && (
          <p className="text-xs text-gray-600 mt-1">
            <strong>Nota:</strong> {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
