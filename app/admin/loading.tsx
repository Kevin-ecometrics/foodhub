export default function AdminLoading() {
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
          <div className="h-7 w-40 bg-slate-200 rounded-lg animate-pulse mx-auto mb-3" />
          <div className="h-4 w-52 bg-slate-100 rounded-md animate-pulse mx-auto" />
        </div>

        <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-3" />
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-5" />

        <div className="h-[50px] w-full bg-slate-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
