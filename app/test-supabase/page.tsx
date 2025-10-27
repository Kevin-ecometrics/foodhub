// app/test-supabase/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";

export default function TestSupabase() {
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const testConnection = async () => {
      // Test mesas
      const { data: tablesData } = await supabase.from("tables").select("*");
      setTables(tablesData || []);

      // Test productos
      const { data: productsData } = await supabase
        .from("products")
        .select("*");
      setProducts(productsData || []);
    };

    testConnection();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Mesas ({tables.length})
          </h2>
          {tables.map((table) => (
            <div key={table.id} className="p-2 border-b">
              Mesa {table.number} - {table.status}
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Productos ({products.length})
          </h2>
          {products.map((product) => (
            <div key={product.id} className="p-2 border-b">
              {product.name} - ${product.price}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
