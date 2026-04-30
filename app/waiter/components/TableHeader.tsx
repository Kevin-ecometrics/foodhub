/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import { useState, useEffect } from "react";

interface TableHeaderProps {
  table: TableWithOrder;
  tableTotal: number;
  processing: string | null;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  onPagarPorSeparado: (tableId: number, tableNumber: number) => void;
  notifications: WaiterNotification[];
  onOrderAdded?: () => void;
  hasNotifications?: boolean;
  isHighlighted?: boolean;
  occupationTime?: string;
}

interface Product {
  id: number; name: string; description: string; price: number;
  category: string; image_url: string | null; preparation_time: number | null;
  is_available: boolean; is_favorite: boolean; rating: number; rating_count: number; extras?: never[];
}

export default function TableHeader({
  table, tableTotal, processing, onCobrarMesa, onPagarPorSeparado,
  notifications = [], onOrderAdded, hasNotifications = false,
  isHighlighted = false, occupationTime,
}: TableHeaderProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ [k: number]: number }>({});
  const [addingOrder, setAddingOrder] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (showAddModal) loadProducts(); }, [showAddModal]);

  const loadProducts = async () => {
    setProductsLoading(true); setError(null);
    try {
      const { data, error } = await supabase.from("products").select("*").eq("is_available", true).order("name", { ascending: true });
      if (error) throw new Error(error.message);
      setProducts(data || []);
    } catch (e) { console.error(e); setError("Error cargando los productos"); }
    finally { setProductsLoading(false); }
  };

  const calculateTotalItems = (t: TableWithOrder) =>
    t.orders.reduce((s, o) => s + o.order_items.reduce((ss: number, i: any) => ss + i.quantity, 0), 0);

  const calculateItemsByStatus = (t: TableWithOrder) => {
    const pending = t.orders.reduce((s, o) => s + o.order_items.filter((i: any) => i.status==="ordered"||i.status==="preparing").length, 0);
    const ready   = t.orders.reduce((s, o) => s + o.order_items.filter((i: any) => i.status==="ready").length, 0);
    const served  = t.orders.reduce((s, o) => s + o.order_items.filter((i: any) => i.status==="served").length, 0);
    return { pending, ready, served };
  };

  const billRequestNotifs = notifications.filter((n: any) => n.table_id === table.id && n.type === "bill_request");
  const latestBillRequest = billRequestNotifs.length > 0 ? billRequestNotifs[billRequestNotifs.length - 1] : null;
  const showPaymentButtons = latestBillRequest?.type === "bill_request";

  const getPaymentLabel = (method: string | null) => {
    if (method === "cash") return { text:"EFECTIVO", color:"var(--green)", bg:"var(--green-light)" };
    if (method === "terminal") return { text:"TARJETA", color:"var(--blue)", bg:"var(--blue-light)" };
    return { text:"PENDIENTE", color:"var(--muted)", bg:"var(--surface)" };
  };

  const handleProductQtyChange = (id: number, qty: number) =>
    setSelectedProducts(prev => ({ ...prev, [id]: qty }));

  const getTotalItems = () => Object.values(selectedProducts).reduce((s, q) => s + q, 0);
  const getTotalAmount = () => Object.entries(selectedProducts).reduce((s, [id, q]) => {
    const p = products.find(x => x.id === parseInt(id)); return s + (p?.price||0)*q;
  }, 0);

  const formatCurrency = (n: number) => new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN" }).format(n);

  const handleConfirmAddOrder = async () => {
    setAddingOrder(true); setError(null);
    try {
      const selectedItems = Object.entries(selectedProducts).filter(([,q]) => q > 0).map(([pid, qty]) => {
        const p = products.find(x => x.id === parseInt(pid));
        if (!p) throw new Error(`Producto ${pid} no encontrado`);
        return { product_id: p.id, product_name: p.name, price: p.price, quantity: qty, notes: "Agregado por el mesero" };
      });
      if (selectedItems.length === 0) { setError("Por favor selecciona al menos un producto"); return; }
      const orderTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const { data: order, error: orderError } = await supabase.from("orders")
        .insert([{ table_id: table.id, customer_name: `Mesero ${table.number}`, status: "sent", total_amount: orderTotal }] as any)
        .select().single();
      if (orderError) throw new Error(orderError.message);
      const { error: itemsError } = await supabase.from("order_items").insert(
        selectedItems.map(i => ({ order_id: (order as any).id, product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, notes: i.notes, status: "ordered" as const, cancelled_quantity: 0 })) as any
      );
      if (itemsError) { await supabase.from("orders").delete().eq("id", (order as any).id); throw new Error(itemsError.message); }
      setShowAddModal(false); setSelectedProducts({});
      if (onOrderAdded) onOrderAdded();
      alert(`✅ ${selectedItems.length} producto(s) agregado(s) a la mesa ${table.number}`);
    } catch (e) { console.error(e); setError(`Error: ${e instanceof Error ? e.message : "Error desconocido"}`); }
    finally { setAddingOrder(false); }
  };

  const totalItems = calculateTotalItems(table);
  const statusCounts = calculateItemsByStatus(table);
  const getTimeColor = () => {
    if (!occupationTime) return "var(--muted)";
    if (occupationTime.includes("h")) return "var(--red)";
    if (occupationTime.includes("min") && parseInt(occupationTime) > 30) return "var(--amber)";
    return "var(--green)";
  };
  const payLabel = getPaymentLabel(latestBillRequest?.payment_method || null);

  return (
    <>
      <div>
        {/* Time bar */}
        {occupationTime && (
          <div style={{ padding:"10px 14px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"var(--muted)",fontWeight:600 }}>Tiempo de ocupación:</span>
            <span style={{ fontSize:12,fontWeight:700,color:getTimeColor() }}>{occupationTime}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ padding:"10px 14px",borderBottom:"1px solid var(--border)" }}>
          {/* Title row */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8 }}>
            <span style={{ fontSize:16,fontWeight:800,color:isHighlighted?"var(--red)":"var(--navy)" }}>
              Mesa {table.number}
            </span>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {(table.status==="occupied"||table.status==="reserved") && (
                <button onClick={() => setShowAddModal(true)} style={{ padding:"6px 12px",borderRadius:8,border:"none",background:"var(--green)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
                  + Agregar
                </button>
              )}
              {showPaymentButtons && (
                <>
                  <button onClick={() => onPagarPorSeparado(table.id, table.number)} disabled={processing===`separate-${table.id}`} style={{ padding:"6px 12px",borderRadius:8,border:"none",background:"var(--blue)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,opacity:processing===`separate-${table.id}`?0.6:1 }}>
                    {processing===`separate-${table.id}` ? "↻" : "⇌ Separado"}
                  </button>
                  <button onClick={() => onCobrarMesa(table.id, table.number)} disabled={processing===`cobrar-${table.id}`} style={{ padding:"6px 12px",borderRadius:8,border:"none",background:"var(--amber)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,opacity:processing===`cobrar-${table.id}`?0.6:1 }}>
                    {processing===`cobrar-${table.id}` ? "↻" : "$ Cobrar"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Time + source */}
          {occupationTime && (
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,fontSize:11 }}>
              <span style={{ color:getTimeColor(),fontWeight:700 }}>⏱ {occupationTime}</span>
              <span style={{ color:"var(--muted)" }}>•</span>
              <span style={{ color:"var(--muted)" }}>
                Desde: {table.orders.length>0 ? new Date(table.orders[0].created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "Sin registro"}
              </span>
            </div>
          )}

          {/* Badges */}
          <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:6 }}>
            <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:table.status==="occupied"?"var(--green-light)":table.status==="reserved"?"var(--amber-light)":"var(--surface)",color:table.status==="occupied"?"var(--green)":table.status==="reserved"?"var(--amber)":"var(--muted)" }}>
              {table.status==="occupied"?"Ocupada":table.status==="reserved"?"Reservada":"Disponible"}
            </span>
            {latestBillRequest && (
              <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:payLabel.bg,color:payLabel.color }}>
                {payLabel.text}
              </span>
            )}
            {statusCounts.served > 0 && <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"var(--surface)",color:"var(--muted)",border:"1px solid var(--border)" }}>{statusCounts.served} servido{statusCounts.served>1?"s":""}</span>}
            {statusCounts.ready > 0 && <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"var(--blue-light)",color:"var(--blue)" }}>{statusCounts.ready} listo{statusCounts.ready>1?"s":""}</span>}
            {statusCounts.pending > 0 && <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"var(--amber-light)",color:"var(--amber)" }}>{statusCounts.pending} pendiente{statusCounts.pending>1?"s":""}</span>}
          </div>

          <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>{table.location} • {table.capacity} personas</p>
        </div>
      </div>

      {/* Add Products Modal */}
      {showAddModal && (
        <div onClick={() => { setShowAddModal(false); setSelectedProducts({}); setError(null); }} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:16,animation:"wr-fadein 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white",borderRadius:18,width:"100%",maxWidth:640,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",animation:"wr-scalein 0.22s ease",overflow:"hidden" }}>
            {/* Modal header */}
            <div style={{ padding:"18px 22px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
              <div>
                <p style={{ fontSize:17,fontWeight:800,color:"var(--text)",margin:0 }}>Agregar Productos — Mesa {table.number}</p>
                <p style={{ fontSize:12,color:"var(--muted)",margin:0,marginTop:2 }}>Selecciona los productos que deseas agregar a la orden</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSelectedProducts({}); setError(null); }} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:4,fontSize:18 }}>✕</button>
            </div>

            {error && <div style={{ margin:"12px 22px 0",padding:"10px 14px",background:"var(--red-light)",borderRadius:10,color:"var(--red)",fontSize:13 }}>{error}</div>}

            {/* Product grid */}
            <div style={{ overflowY:"auto",flex:1,padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {productsLoading ? (
                <div style={{ gridColumn:"1/-1",textAlign:"center",padding:40,color:"var(--muted)" }}>
                  <div style={{ width:48,height:48,borderRadius:14,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px" }}>
                    <svg style={{ animation:"wr-spin 0.9s linear infinite" }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </div>
                  <p style={{ fontSize:14 }}>Cargando productos...</p>
                </div>
              ) : products.map(p => (
                <div key={p.id} style={{ border:"1.5px solid var(--border)",borderRadius:12,padding:12,display:"flex",alignItems:"flex-start",gap:10,background:"white" }}>
                  <div style={{ width:48,height:48,borderRadius:8,background:"var(--accent-light)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:20 }}>🍽️</span>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13,fontWeight:700,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</p>
                    <p style={{ fontSize:11,color:"var(--muted)",margin:0,marginTop:2,lineHeight:1.4 }}>{p.description}</p>
                    <p style={{ fontSize:13,fontWeight:700,color:"var(--green)",margin:0,marginTop:4 }}>
                      ${p.price.toFixed(2)} <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>• {p.preparation_time} min</span>
                    </p>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
                    <button onClick={() => handleProductQtyChange(p.id, Math.max(0, (selectedProducts[p.id]||0)-1))} style={{ width:26,height:26,borderRadius:7,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"inherit" }}>−</button>
                    <span style={{ width:22,textAlign:"center",fontSize:13,fontWeight:700,color:"var(--text)" }}>{selectedProducts[p.id]||0}</span>
                    <button onClick={() => handleProductQtyChange(p.id, (selectedProducts[p.id]||0)+1)} style={{ width:26,height:26,borderRadius:7,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text)",fontFamily:"inherit" }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 20px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
              <div>
                <p style={{ fontSize:13,color:"var(--muted)",margin:0 }}>Items: <strong style={{ color:"var(--text)" }}>{getTotalItems()}</strong></p>
                <p style={{ fontSize:14,fontWeight:700,color:"var(--green)",margin:0 }}>Total: {formatCurrency(getTotalAmount())}</p>
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={() => { setShowAddModal(false); setSelectedProducts({}); setError(null); }} disabled={addingOrder} style={{ padding:"11px 20px",borderRadius:10,border:"1.5px solid var(--border)",background:"var(--surface)",fontSize:13,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit" }}>Cancelar</button>
                <button onClick={handleConfirmAddOrder} disabled={addingOrder||getTotalItems()===0} style={{ padding:"11px 20px",borderRadius:10,border:"none",background:getTotalItems()===0?"var(--border)":"var(--green)",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,opacity:addingOrder?0.7:1 }}>
                  {addingOrder ? "↻ Agregando..." : `+ Agregar a Mesa ${table.number}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
