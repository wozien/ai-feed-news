import { Rss } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
        <Rss className="size-4" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        AI Feed <span className="text-muted-foreground">News</span>
      </span>
    </div>
  );
}
