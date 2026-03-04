import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useActor } from "./useActor";

const MAX_RETRY_ATTEMPTS = 3;
const _RETRY_DELAY_MS = 1000;
const HEALTH_CHECK_INTERVAL_MS = 30000;

export function useActorWithReconnection() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const retryCountRef = useRef(0);
  const reconnectToastRef = useRef<string | number | null>(null);
  const lastErrorRef = useRef<Error | null>(null);

  // Proactive connection health check
  useEffect(() => {
    if (!actor) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        // Perform a lightweight health check
        await actor.getCallerUserRole();
      } catch (error) {
        console.warn("Health check failed, triggering reconnection:", error);
        lastErrorRef.current = error as Error;
        // Trigger actor reinitialization
        queryClient.invalidateQueries({ queryKey: ["actor"] });
      }
    }, HEALTH_CHECK_INTERVAL_MS);

    return () => clearInterval(healthCheckInterval);
  }, [actor, queryClient]);

  // Monitor connection status
  useEffect(() => {
    if (actor && !isFetching) {
      // Successfully connected
      retryCountRef.current = 0;
      if (reconnectToastRef.current) {
        toast.dismiss(reconnectToastRef.current);
        toast.success("Connected to backend");
        reconnectToastRef.current = null;
      }
      lastErrorRef.current = null;
    } else if (!actor && isFetching && retryCountRef.current > 0) {
      // Show reconnection toast
      if (!reconnectToastRef.current) {
        reconnectToastRef.current = toast.loading(
          `Reconnecting to backend… (Attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`,
        );
      }
    }
  }, [actor, isFetching]);

  const isConnecting = isFetching && retryCountRef.current > 0;
  const hasError = !actor && !isFetching && lastErrorRef.current !== null;

  return {
    actor,
    isFetching,
    isConnecting,
    hasError,
  };
}
