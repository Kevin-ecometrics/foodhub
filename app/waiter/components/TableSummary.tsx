interface TableSummaryProps {
  tableTotal: number;
  customerCount: number;
  orderCount: number;
  isHighlighted?: boolean;
}

export default function TableSummary({ tableTotal, customerCount, orderCount, isHighlighted = false }: TableSummaryProps) {
  return (
    <div style={{ padding:"12px 14px",background:"oklch(97% 0 0)",borderTop:"2px solid var(--border)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
        <span style={{ fontSize:14,fontWeight:800,color:isHighlighted?"var(--red)":"var(--text)" }}>TOTAL A PAGAR:</span>
        <span style={{ fontSize:16,fontWeight:800,color:isHighlighted?"var(--red)":"var(--green)" }}>${tableTotal.toFixed(2)}</span>
      </div>
      <p style={{ fontSize:11,color:"var(--muted)",textAlign:"center",margin:0 }}>
        {customerCount} comensal{customerCount > 1 ? "es" : ""} • {orderCount} pedido{orderCount > 1 ? "s" : ""} enviado{orderCount > 1 ? "s" : ""}
      </p>
    </div>
  );
}
