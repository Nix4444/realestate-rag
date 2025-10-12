import { ElegantBackgroundShapes } from "@/components/ui/shape-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#030303] text-white">
      <div className="relative hidden md:block overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        <ElegantBackgroundShapes />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <img
              src="/simplyphiLogo.png"
              alt="SimplyPhi"
              className="w-12 h-12 md:w-16 md:h-16"
            />
            <span className="text-2xl md:text-3xl font-semibold text-white/90">SimplyPhi</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[#0a0a0a] via-[#0e0e0e] to-[#141414] border-l border-white/10">
        {children}
      </div>
    </div>
  );
}
