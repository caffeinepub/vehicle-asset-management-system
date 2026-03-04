import { Truck } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Fleet Manager</h1>
            <p className="text-xs text-muted-foreground">
              Asset Tracking System
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
