import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Container, Droplet, Plus, Truck } from "lucide-react";
import { useState } from "react";
import type { Asset } from "../backend";
import { useGetAllAssets, useGetAllPairings } from "../hooks/useQueries";
import AssetCard from "./AssetCard";
import AssetDialog from "./AssetDialog";

export default function AssetsView() {
  const { data: assets, isLoading } = useGetAllAssets();
  const { data: pairings } = useGetAllPairings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "tractor" | "trailer" | "pump" | "pickup"
  >("all");

  const tractors = assets?.filter((a) => a.assetType === "tractor") || [];
  const trailers = assets?.filter((a) => a.assetType === "trailer") || [];
  const pumps = assets?.filter((a) => a.assetType === "pump") || [];
  const pickups = assets?.filter((a) => a.assetType === "pickup") || [];

  const filteredAssets =
    assets?.filter((asset) => {
      if (filterType === "all") return true;
      return asset.assetType === filterType;
    }) || [];

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAsset(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Tractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tractors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Container className="h-4 w-4" />
              Trailers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trailers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Pumps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pumps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pickups.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Inventory</CardTitle>
              <CardDescription>
                View and manage all vehicle assets
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All Assets
            </Button>
            <Button
              variant={filterType === "tractor" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("tractor")}
            >
              <Truck className="mr-2 h-4 w-4" />
              Tractors
            </Button>
            <Button
              variant={filterType === "trailer" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("trailer")}
            >
              <Container className="mr-2 h-4 w-4" />
              Trailers
            </Button>
            <Button
              variant={filterType === "pump" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("pump")}
            >
              <Droplet className="mr-2 h-4 w-4" />
              Pumps
            </Button>
            <Button
              variant={filterType === "pickup" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("pickup")}
            >
              <Car className="mr-2 h-4 w-4" />
              Pickups
            </Button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No assets found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Get started by adding your first asset
              </p>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.assetNumber}
                  asset={asset}
                  pairings={pairings || []}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssetDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        editingAsset={editingAsset}
      />
    </div>
  );
}
