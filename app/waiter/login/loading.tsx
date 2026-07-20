export default function WaiterLoginLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto mb-3" />
          <div className="h-4 w-56 bg-slate-100 rounded-md animate-pulse mx-auto" />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
          <div className="h-9 flex-1 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-9 flex-1 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="h-16 bg-slate-100 rounded-xl animate-pulse mb-5" />

        <div className="h-[50px] w-full bg-slate-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
