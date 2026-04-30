interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function Header({ loading, onRefresh }: HeaderProps) {
  return (
    <header style={{ padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white",flexShrink:0 }}>
      <div>
        <p style={{ fontSize:17,fontWeight:800,color:"var(--navy)",letterSpacing:"-0.3px",margin:0 }}>Panel del Mesero</p>
        <p style={{ fontSize:11,color:"var(--muted)",margin:0,marginTop:2 }}>Pedidos enviados y cuentas por mesa</p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{ background:"var(--accent)",color:"white",border:"none",borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontFamily:"inherit",opacity:loading?0.7:1,transition:"filter 0.15s" }}
      >
        <span style={{ display:"inline-block",animation:loading?"wr-spin 0.8s linear infinite":"none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </span>
        {loading ? "Actualizando..." : "Actualizar"}
      </button>
    </header>
  );
}
