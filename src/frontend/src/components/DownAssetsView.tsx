import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  CheckCircle2,
  Container,
  Droplet,
  Truck,
  XCircle,
} from "lucide-react";
import { useGetAllDownAssets } from "../hooks/useQueries";
import DownAssetCard from "./DownAssetCard";

export default function DownAssetsView() {
  const { data: downAssets, isLoading } = useGetAllDownAssets();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const downTractors =
    downAssets?.filter((a) => a.assetType === "tractor") || [];
  const downTrailers =
    downAssets?.filter((a) => a.assetType === "trailer") || [];
  const downPumps = downAssets?.filter((a) => a.assetType === "pump") || [];
  const downPickups = downAssets?.filter((a) => a.assetType === "pickup") || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Total Down Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {downAssets?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Down Tractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{downTractors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Container className="h-4 w-4" />
              Down Trailers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{downTrailers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Down Pumps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{downPumps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Down Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{downPickups.length}</div>
          </CardContent>
        </Card>
      </div>

      {downAssets?.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>All Assets Operational</AlertTitle>
          <AlertDescription>
            No assets are currently marked as down. All vehicles are available
            for operations.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Down Assets</CardTitle>
            <CardDescription>
              Assets currently out of service and unavailable for operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {downAssets?.map((asset) => (
                <DownAssetCard key={asset.assetNumber} asset={asset} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
