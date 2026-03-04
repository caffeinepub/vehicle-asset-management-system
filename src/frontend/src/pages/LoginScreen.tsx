import { Button } from "@/components/ui/button";
import { LogIn, Truck } from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Truck className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Fleet Manager
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Vehicle Asset Management System
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-base text-muted-foreground">
            Professional fleet management with AVI and VILK inspection tracking,
            asset pairing, and comprehensive reporting for multi-user
            operations.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Track tractors, trailers, pumps, and pickups
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Monitor AVI and VILK inspection dates
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Manage asset pairings and categories
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Generate detailed reports
            </p>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="w-full max-w-xs mx-auto h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Logging In...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Log In
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Secure authentication via Internet Identity
          </p>
        </div>
      </div>
    </div>
  );
}
