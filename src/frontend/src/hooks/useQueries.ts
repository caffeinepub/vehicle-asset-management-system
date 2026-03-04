import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Asset,
  AssetHistory,
  AssetLabel,
  AssetPairing,
  AssetType,
  Category,
  DownAsset,
  DownAssetWithPairing,
  UserProfile,
  Variant_upcoming_expired,
} from "../backend";
import { useActor } from "./useActor";

// Helper function to detect if an error is a connection/actor error
function isConnectionError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    errorMessage.includes("actor not available") ||
    errorMessage.includes("actor is not initialized") ||
    errorMessage.includes("network") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("agent") ||
    errorMessage.includes("identity") ||
    errorMessage.includes("certificate") ||
    errorMessage.includes("replica") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("unreachable")
  );
}

// Enhanced wrapper function for queries with automatic reconnection and request queuing
async function executeQueryWithRetry<T>(
  queryFn: () => Promise<T>,
  queryClient: ReturnType<typeof useQueryClient>,
  retryCount = 0,
  maxRetries = 3,
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    if (isConnectionError(error) && retryCount < maxRetries) {
      // Show reconnection toast
      const toastId = toast.loading(
        `Reconnecting to backend… (Attempt ${retryCount + 1}/${maxRetries})`,
      );

      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * 2 ** retryCount, 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Force actor reinitialization
      await queryClient.invalidateQueries({ queryKey: ["actor"] });
      await queryClient.refetchQueries({ queryKey: ["actor"] });

      // Wait a bit for actor to reinitialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Dismiss the loading toast
      toast.dismiss(toastId);

      // Retry the operation
      return executeQueryWithRetry(
        queryFn,
        queryClient,
        retryCount + 1,
        maxRetries,
      );
    }

    // If not a connection error or max retries reached, throw
    throw error;
  }
}

// Enhanced wrapper function for mutations with automatic reconnection and request queuing
async function executeMutationWithRetry<T>(
  mutationFn: () => Promise<T>,
  queryClient: ReturnType<typeof useQueryClient>,
  retryCount = 0,
  maxRetries = 3,
): Promise<T> {
  try {
    return await mutationFn();
  } catch (error) {
    if (isConnectionError(error) && retryCount < maxRetries) {
      // Show reconnection toast with retry count
      const toastId = toast.loading(
        `Reconnecting to backend… (Attempt ${retryCount + 1}/${maxRetries})`,
      );

      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * 2 ** retryCount, 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Force actor reinitialization
      await queryClient.invalidateQueries({ queryKey: ["actor"] });
      await queryClient.refetchQueries({ queryKey: ["actor"] });

      // Wait a bit for actor to reinitialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Dismiss the loading toast
      toast.dismiss(toastId);

      // Show info that we're retrying the operation
      toast.info("Retrying operation…", { duration: 1000 });

      // Retry the operation
      return executeMutationWithRetry(
        mutationFn,
        queryClient,
        retryCount + 1,
        maxRetries,
      );
    }

    // If not a connection error or max retries reached, throw
    throw error;
  }
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return executeQueryWithRetry(
        () => actor.getCallerUserProfile(),
        queryClient,
      );
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () => actor.saveCallerUserProfile(profile),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile saved successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to save profile: ${error.message}`);
      }
    },
  });
}

// Asset Queries
export function useGetAllAssets() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(() => actor.getAllAssets(), queryClient);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAssetsByType(assetType: AssetType) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Asset[]>({
    queryKey: ["assets", assetType],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(
        () => actor.getAssetsByType(assetType),
        queryClient,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetNumber,
      assetType,
      aviDate,
      vilkDate,
      assetLabel,
      standaloneCategory,
      driverName,
    }: {
      assetNumber: string;
      assetType: AssetType;
      aviDate: bigint;
      vilkDate: bigint | null;
      assetLabel: AssetLabel | null;
      standaloneCategory?: Category | null;
      driverName?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () =>
          actor.createAsset(
            assetNumber,
            assetType,
            aviDate,
            vilkDate,
            assetLabel,
            standaloneCategory || null,
            driverName || null,
          ),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["inspectionAlerts"] });
      toast.success("Asset created successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to create asset: ${error.message}`);
      }
    },
  });
}

export function useUpdateAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetNumber,
      newAviDate,
      newVilkDate,
      newAssetLabel,
      newStandaloneCategory,
      newDriverName,
    }: {
      assetNumber: string;
      newAviDate: bigint;
      newVilkDate: bigint | null;
      newAssetLabel: AssetLabel | null;
      newStandaloneCategory?: Category | null;
      newDriverName?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () =>
          actor.updateAsset(
            assetNumber,
            newAviDate,
            newVilkDate,
            newAssetLabel,
            newStandaloneCategory || null,
            newDriverName || null,
          ),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["inspectionAlerts"] });
      toast.success("Asset updated successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to update asset: ${error.message}`);
      }
    },
  });
}

export function useDeleteAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetNumber: string) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () => actor.deleteAsset(assetNumber),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      queryClient.invalidateQueries({ queryKey: ["inspectionAlerts"] });
      toast.success("Asset deleted successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to delete asset: ${error.message}`);
      }
    },
  });
}

export function useMarkAssetAsDown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetNumber,
      reason,
    }: { assetNumber: string; reason: string }) => {
      if (!actor) throw new Error("Actor not available");

      return executeMutationWithRetry(async () => {
        // Check if asset is currently paired before marking down
        const pairings = await actor.getAllPairings();
        const isPaired = pairings.some(
          (p) => p.tractorId === assetNumber || p.secondAssetId === assetNumber,
        );

        // Mark asset as down (backend will handle unpairing automatically)
        await actor.markAssetAsDown(assetNumber, reason);

        return { isPaired };
      }, queryClient);
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["downAssets"] });
      queryClient.invalidateQueries({ queryKey: ["downAssetsWithPairing"] });
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrailers"] });
      queryClient.invalidateQueries({ queryKey: ["availablePumps"] });
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      queryClient.invalidateQueries({ queryKey: ["inspectionAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["assetHistory"] });

      // Provide informative feedback
      if (data.isPaired) {
        toast.success("Asset marked as down and automatically unpaired");
      } else {
        toast.success("Asset marked as down");
      }
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to mark asset as down: ${error.message}`);
      }
    },
  });
}

export function useReactivateDownAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetNumber: string) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () => actor.reactivateDownAsset(assetNumber),
        queryClient,
      );
    },
    onSuccess: (result) => {
      // Invalidate all relevant queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["downAssets"] });
      queryClient.invalidateQueries({ queryKey: ["downAssetsWithPairing"] });
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrailers"] });
      queryClient.invalidateQueries({ queryKey: ["availablePumps"] });
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      queryClient.invalidateQueries({ queryKey: ["inspectionAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["assetHistory"] });

      // Provide informative feedback based on pairing restoration
      if (result.restoredPairing) {
        toast.success(
          "Asset reactivated and previous pairing restored successfully",
        );
      } else {
        toast.success("Asset reactivated successfully");
      }
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to reactivate asset: ${error.message}`);
      }
    },
  });
}

// Down Assets Queries - Fetch from both backend collections and merge
export function useGetAllDownAssets() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<DownAssetWithPairing[]>({
    queryKey: ["downAssets"],
    queryFn: async () => {
      if (!actor) return [];

      return executeQueryWithRetry(async () => {
        // Fetch from both collections
        const [downAssetsNoPairing, downAssetsWithPairing] = await Promise.all([
          actor.getAllDownAssets(),
          actor.getAllDownAssetsWithPairing(),
        ]);

        // Convert DownAsset to DownAssetWithPairing format (with previousPairing as undefined)
        const convertedDownAssets: DownAssetWithPairing[] =
          downAssetsNoPairing.map((asset: DownAsset) => ({
            assetNumber: asset.assetNumber,
            assetType: asset.assetType,
            aviDate: asset.aviDate,
            vilkDate: asset.vilkDate,
            assetLabel: asset.assetLabel,
            downReason: asset.downReason,
            downDate: asset.downDate,
            lastUpdated: asset.lastUpdated,
            standaloneCategory: asset.standaloneCategory,
            driverName: asset.driverName,
            ownerId: asset.ownerId,
            previousPairing: undefined,
          }));

        // Merge both arrays
        return [...convertedDownAssets, ...downAssetsWithPairing];
      }, queryClient);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateDownReason() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetNumber,
      newReason,
    }: { assetNumber: string; newReason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () => actor.updateDownReason(assetNumber, newReason),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downAssets"] });
      queryClient.invalidateQueries({ queryKey: ["assetHistory"] });
      toast.success("Down reason updated successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to update down reason: ${error.message}`);
      }
    },
  });
}

// Pairing Queries
export function useGetAllPairings() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<AssetPairing[]>({
    queryKey: ["pairings"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(() => actor.getAllPairings(), queryClient);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAvailableTrailers() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Asset[]>({
    queryKey: ["availableTrailers"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(
        () => actor.getAvailableAssetsForPairing("trailer" as AssetType),
        queryClient,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAvailablePumps() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Asset[]>({
    queryKey: ["availablePumps"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(
        () => actor.getAvailableAssetsForPairing("pump" as AssetType),
        queryClient,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAvailablePickups() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Asset[]>({
    queryKey: ["availablePickups"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(
        () => actor.getAvailableAssetsForPairing("pickup" as AssetType),
        queryClient,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePairing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tractorId,
      secondAssetId,
      assetType,
      category,
      notes,
      driverName,
    }: {
      tractorId: string;
      secondAssetId: string;
      assetType: AssetType;
      category: Category;
      notes: string;
      driverName?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () =>
          actor.createPairing(
            tractorId,
            secondAssetId,
            assetType,
            category,
            notes,
            driverName || null,
          ),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrailers"] });
      queryClient.invalidateQueries({ queryKey: ["availablePumps"] });
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      toast.success("Assets paired successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to pair assets: ${error.message}`);
      }
    },
  });
}

export function useUpdatePairing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tractorId,
      category,
      notes,
      driverName,
    }: {
      tractorId: string;
      category: Category;
      notes: string;
      driverName?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () =>
          actor.updatePairing(tractorId, category, notes, driverName || null),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      toast.success("Pairing updated successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to update pairing: ${error.message}`);
      }
    },
  });
}

export function useUnpairAssets() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tractorId: string) => {
      if (!actor) throw new Error("Actor not available");
      return executeMutationWithRetry(
        () => actor.unpairAssets(tractorId),
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrailers"] });
      queryClient.invalidateQueries({ queryKey: ["availablePumps"] });
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      toast.success("Assets unpaired successfully");
    },
    onError: (error: Error) => {
      if (!isConnectionError(error)) {
        toast.error(`Failed to unpair assets: ${error.message}`);
      }
    },
  });
}

// Inspection Alerts
export function useGetInspectionAlerts() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<{
    upcoming: Asset[];
    expired: Asset[];
    upcomingVilk: Asset[];
    expiredVilk: Asset[];
  }>({
    queryKey: ["inspectionAlerts"],
    queryFn: async () => {
      if (!actor)
        return { upcoming: [], expired: [], upcomingVilk: [], expiredVilk: [] };
      return executeQueryWithRetry(
        () => actor.getInspectionAlerts(),
        queryClient,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

// Asset History
export function useGetAssetHistory() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<AssetHistory[]>({
    queryKey: ["assetHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return executeQueryWithRetry(() => actor.getAssetHistory(), queryClient);
    },
    enabled: !!actor && !isFetching,
  });
}
