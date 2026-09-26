// Auth layout — centered card, no sidebar/topbar
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold text-white">
            Stock<span className="text-indigo-400">Sense</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Inventory Management System</p>
        </div>
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
