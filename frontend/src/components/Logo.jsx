import { Boxes } from "lucide-react";

export default function Logo({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
        <Boxes size={20} className="text-slate-950" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-white">
          ForgeBase
        </span>
      )}
    </span>
  );
}
