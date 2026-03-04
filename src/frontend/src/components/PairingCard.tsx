import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Car,
  Container,
  Droplet,
  Edit,
  FileText,
  MoreVertical,
  Tag,
  Truck,
  Unlink,
  User,
} from "lucide-react";
import { useState } from "react";
import { AssetLabel, AssetType, Category } from "../backend";
import type { AssetPairing } from "../backend";
import { useGetAllAssets, useUnpairAssets } from "../hooks/useQueries";

interface PairingCardProps {
  pairing: AssetPairing;
  onEdit: (pairing: AssetPairing) => void;
  categoryColor?: string;
}

export default function PairingCard({
  pairing,
  onEdit,
  categoryColor,
}: PairingCardProps) {
  const [unpairDialogOpen, setUnpairDialogOpen] = useState(false);
  const unpairAssets = useUnpairAssets();
  const { data: assets = [] } = useGetAllAssets();

  const pairedDate = new Date(Number(pairing.pairedDate) / 1000000);

  const firstAsset = assets.find((a) => a.assetNumber === pairing.tractorId);
  const secondAsset = assets.find(
    (a) => a.assetNumber === pairing.secondAssetId,
  );

  const getAssetLabelText = (label?: AssetLabel) => {
    if (!label) return null;
    switch (label) {
      case AssetLabel.ptoTractor:
        return "PTO Tractor";
      case AssetLabel.twoTank:
        return "2 Tank";
      case AssetLabel.threeTank:
        return "3 Tank";
      case AssetLabel.f250:
        return "F-250";
      case AssetLabel.f350:
        return "F-350";
      case AssetLabel.dodgeRam:
        return "Dodge Ram";
      case AssetLabel.tundra:
        return "Tundra";
      default:
        return null;
    }
  };

  const firstAssetLabel = getAssetLabelText(firstAsset?.assetLabel);
  const secondAssetLabel = getAssetLabelText(secondAsset?.assetLabel);

  const handleUnpair = () => {
    unpairAssets.mutate(pairing.tractorId, {
      onSuccess: () => setUnpairDialogOpen(false),
    });
  };

  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  const getFirstAssetTypeLabel = () => {
    return firstAsset?.assetType === AssetType.pickup ? "Pickup" : "Tractor";
  };

  const getSecondAssetTypeLabel = () => {
    switch (pairing.assetType) {
      case AssetType.trailer:
        return "Trailer";
      case AssetType.pump:
        return "Pump";
      case AssetType.pickup:
        return "Pickup";
      default:
        return "Asset";
    }
  };

  const getFirstAssetIcon = () => {
    return firstAsset?.assetType === AssetType.pickup ? Car : Truck;
  };

  const getSecondAssetIcon = () => {
    switch (pairing.assetType) {
      case AssetType.trailer:
        return Container;
      case AssetType.pump:
        return Droplet;
      case AssetType.pickup:
        return Car;
      default:
        return Container;
    }
  };

  const FirstAssetIcon = getFirstAssetIcon();
  const SecondAssetIcon = getSecondAssetIcon();

  // Check if this is a Treater Trucks & Trailers pairing with a driver name
  const showPairingDriverName =
    pairing.category === Category.treatersTrucksAndTrailers &&
    pairing.driverName;

  // Check if first asset (pickup) has a driver name
  const showPickupDriverName =
    firstAsset?.assetType === AssetType.pickup && firstAsset?.driverName;

  return (
    <>
      <div className="flex flex-row items-center gap-2 w-full">
        {/* First Asset Card (Tractor or Pickup) */}
        <Card
          className={`flex-1 hover:shadow-md transition-shadow border-l-4 ${categoryColor ? `border-${categoryColor}` : ""}`}
        >
          <CardHeader className="pb-1 pt-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {getFirstAssetTypeLabel()}
              </CardTitle>
              <FirstAssetIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-3 pb-2">
            <div className="text-base font-bold">{pairing.tractorId}</div>
            {firstAssetLabel && (
              <Badge
                variant="outline"
                className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 px-1 py-0"
              >
                <Tag className="h-2 w-2" />
                {firstAssetLabel}
              </Badge>
            )}
            {showPickupDriverName && (
              <Badge
                variant="outline"
                className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 px-1 py-0"
              >
                <User className="h-2 w-2" />
                {firstAsset.driverName}
              </Badge>
            )}
            {firstAsset && (
              <div className="text-xs text-muted-foreground">
                AVI: {formatDate(firstAsset.aviDate)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pairing Symbol */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <img
            src="/assets/generated/chain-link-icon-transparent.dim_32x32.png"
            alt="Paired"
            className="w-6 h-6 opacity-70"
          />
        </div>

        {/* Second Asset Card (Trailer or Pump) */}
        <Card
          className={`flex-1 hover:shadow-md transition-shadow border-l-4 ${categoryColor ? `border-${categoryColor}` : ""}`}
        >
          <CardHeader className="pb-1 pt-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {getSecondAssetTypeLabel()}
              </CardTitle>
              <SecondAssetIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-3 pb-2">
            <div className="text-base font-bold">{pairing.secondAssetId}</div>
            {secondAssetLabel && (
              <Badge
                variant="outline"
                className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 px-1 py-0"
              >
                <Tag className="h-2 w-2" />
                {secondAssetLabel}
              </Badge>
            )}
            {secondAsset && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>AVI: {formatDate(secondAsset.aviDate)}</div>
                {secondAsset.vilkDate && (
                  <div>VILK: {formatDate(secondAsset.vilkDate)}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Dropdown */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(pairing)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setUnpairDialogOpen(true)}
                className="text-destructive"
              >
                <Unlink className="mr-2 h-4 w-4" />
                Unpair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pairing Details - Driver Name Prominently Displayed */}
      <div className="mt-2 px-1 space-y-1">
        {showPairingDriverName && (
          <div className="flex items-center gap-2 p-1.5 bg-primary/5 rounded-md border border-primary/20">
            <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary">
              Driver: {pairing.driverName}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Paired: {pairedDate.toLocaleDateString()}</span>
        </div>
        {pairing.notes && (
          <div className="flex items-start gap-2 text-xs">
            <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{pairing.notes}</span>
          </div>
        )}
      </div>

      <AlertDialog open={unpairDialogOpen} onOpenChange={setUnpairDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpair Assets</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpair{" "}
              <strong>{pairing.tractorId}</strong> and{" "}
              <strong>{pairing.secondAssetId}</strong>? The assets will remain
              in the system but will no longer be paired.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpair}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unpairAssets.isPending}
            >
              {unpairAssets.isPending ? "Unpairing..." : "Unpair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
