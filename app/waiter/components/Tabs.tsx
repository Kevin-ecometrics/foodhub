import { FaBell, FaTable } from "react-icons/fa";

interface TabsProps {
  activeTab: "notifications" | "tables";
  onTabChange: (tab: "notifications" | "tables") => void;
  notificationsCount: number;
  occupiedTablesCount: number;
}

export default function Tabs({
  activeTab,
  onTabChange,
  notificationsCount,
  occupiedTablesCount,
}: TabsProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          <button
            onClick={() => onTabChange("notifications")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaBell className="inline mr-2" />
            Notificaciones ({notificationsCount})
          </button>
          <button
            onClick={() => onTabChange("tables")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tables"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaTable className="inline mr-2" />
            Mesas y Cuentas ({occupiedTablesCount})
          </button>
        </div>
      </div>
    </div>
  );
}
