// app/waiter/components/ProductsManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { productsService } from "@/app/lib/supabase/products";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  preparation_time: number | null;
  is_available: boolean;
  is_favorite: boolean;
  rating: number;
  rating_count: number;
  extras?: never[];
}

interface ProductsManagementProps {
  onError: (error: string) => void;
}

export default function ProductsManagement({ onError }: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await productsService.getProducts();
      setProducts(data as never);
    } catch (e) {
      console.error(e);
      onError("Error cargando los productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    setUpdatingProduct(product.id);
    try {
      await productsService.updateProductWithExtras(product.id, { ...product, is_available: !product.is_available, extras: product.extras || [] });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !product.is_available } : p));
    } catch (e) {
      console.error(e);
      onError("Error actualizando la disponibilidad del producto");
    } finally {
      setUpdatingProduct(null);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN" }).format(n);
  const available = products.filter(p => p.is_available).length;

  return (
    <div style={{ animation:"wr-fadeup 0.3s ease" }}>
      <div style={{ display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:20 }}>
        <h2 style={{ fontSize:18,fontWeight:800,color:"var(--text)",margin:0 }}>Gestión de Productos</h2>
        <span style={{ fontSize:13,color:"var(--muted)" }}>
          <strong style={{ color:"var(--green)" }}>{available}</strong> de {products.length} disponibles
        </span>
      </div>

      {productsLoading ? (
        <div style={{ textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
          <div style={{ width:48,height:48,borderRadius:14,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}>
            <svg style={{ animation:"wr-spin 0.9s linear infinite" }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <p style={{ fontSize:14 }}>Cargando productos...</p>
        </div>
      ) : (
        <div style={{ border:"1.5px solid var(--border)",borderRadius:14,overflow:"hidden",background:"white" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 120px 130px",padding:"10px 18px",background:"var(--surface)",borderBottom:"1.5px solid var(--border)" }}>
            {["Producto","Categoría","Estado"].map(h => (
              <span key={h} style={{ fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</span>
            ))}
          </div>
          {products.length === 0 ? (
            <div style={{ textAlign:"center",padding:48,color:"var(--muted)",fontSize:14 }}>No hay productos registrados</div>
          ) : products.map((p, i) => (
            <div key={p.id} style={{ display:"grid",gridTemplateColumns:"1fr 120px 130px",padding:"12px 18px",borderBottom:i<products.length-1?"1px solid var(--border)":"none",alignItems:"center",background:p.is_available?"white":"oklch(99% 0.02 20)",transition:"background 0.15s" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0 }} />
                  : <div style={{ width:44,height:44,borderRadius:8,background:"var(--accent-light)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🍽️</div>
                }
                <div>
                  <p style={{ fontSize:13,fontWeight:700,color:"var(--text)",margin:0 }}>{p.name}</p>
                  <p style={{ fontSize:11,color:"var(--muted)",margin:0,marginTop:2 }}>{p.description}</p>
                  <p style={{ fontSize:12,fontWeight:600,color:"var(--green)",margin:0,marginTop:2 }}>
                    {formatCurrency(p.price)}
                    {p.preparation_time && <span style={{ color:"var(--muted)",fontWeight:400 }}> • {p.preparation_time} min</span>}
                    {p.extras && p.extras.length > 0 && <span style={{ color:"var(--green)",marginLeft:4 }}>+{p.extras.length} extras</span>}
                  </p>
                </div>
              </div>
              <span style={{ fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:6,background:"var(--navy-light)",color:"var(--navy)",display:"inline-block",width:"fit-content" }}>{p.category}</span>
              <button
                onClick={() => toggleProductAvailability(p)}
                disabled={updatingProduct === p.id}
                style={{ padding:"6px 14px",borderRadius:8,border:"none",background:p.is_available?"var(--green-light)":"var(--red-light)",color:p.is_available?"var(--green)":"var(--red)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5,width:"fit-content",opacity:updatingProduct===p.id?0.6:1,transition:"filter 0.15s" }}
              >
                {updatingProduct === p.id ? "↻" : p.is_available ? "✓ Disponible" : "✕ No disponible"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:16,border:"1.5px solid var(--blue-light)",borderRadius:12,padding:"14px 18px",background:"var(--blue-light)" }}>
        <p style={{ fontSize:13,fontWeight:700,color:"var(--blue)",marginBottom:6 }}>ℹ️ Información</p>
        <p style={{ fontSize:12,color:"var(--blue)",margin:0,lineHeight:1.6 }}>
          • Haz clic en el estado del producto para cambiar entre Disponible y No Disponible<br/>
          • Los productos marcados como No Disponible no aparecerán en el menú de los clientes<br/>
          • Los productos con extras mostrarán el contador de extras disponibles
        </p>
      </div>
    </div>
  );
}
