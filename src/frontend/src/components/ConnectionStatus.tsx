import { Badge } from "@/components/ui/badge";
import { Loader2, WifiOff } from "lucide-react";
import { useActorWithReconnection } from "../hooks/useActorWithReconnection";

export default function ConnectionStatus() {
  const { actor, isFetching, isConnecting, hasError } =
    useActorWithReconnection();

  // Don't show anything if connected and not fetching
  if (actor && !isFetching && !hasError && !isConnecting) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isConnecting && (
        <Badge
          variant="outline"
          className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">Reconnecting...</span>
        </Badge>
      )}
      {hasError && !isConnecting && (
        <Badge
          variant="destructive"
          className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Connection Error</span>
        </Badge>
      )}
      {isFetching && !isConnecting && !actor && (
        <Badge
          variant="outline"
          className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm">Connecting...</span>
        </Badge>
      )}
    </div>
  );
}
