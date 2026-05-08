export default function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh",background:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`@keyframes wr-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48,height:48,borderRadius:14,background:"oklch(62% 0.18 32)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"wr-spin 0.9s linear infinite" }}>
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
        <p style={{ color:"oklch(55% 0.02 260)",fontSize:14,fontWeight:500 }}>Cargando panel del mesero...</p>
      </div>
    </div>
  );
}
