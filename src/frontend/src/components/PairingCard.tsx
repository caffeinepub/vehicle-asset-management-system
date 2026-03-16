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

  const showPairingDriverName =
    pairing.category === Category.treatersTrucksAndTrailers &&
    pairing.driverName;

  const showPickupDriverName =
    firstAsset?.assetType === AssetType.pickup && firstAsset?.driverName;

  return (
    <>
      {/* Main row: both asset cards + chain icon + actions */}
      <div className="flex flex-row items-center gap-1.5 w-full">
        {/* First Asset Card */}
        <Card
          className={`flex-1 hover:shadow-sm transition-shadow border-l-4 ${categoryColor ? `border-${categoryColor}` : ""}`}
        >
          <CardHeader className="pb-0 pt-1.5 px-2.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {getFirstAssetTypeLabel()}
              </CardTitle>
              <FirstAssetIcon className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-2.5 pb-1.5">
            <div className="text-sm font-bold leading-tight">
              {pairing.tractorId}
            </div>
            <div className="flex flex-wrap gap-1">
              {firstAssetLabel && (
                <Badge
                  variant="outline"
                  className="gap-0.5 text-[10px] bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4"
                >
                  <Tag className="h-1.5 w-1.5" />
                  {firstAssetLabel}
                </Badge>
              )}
              {showPickupDriverName && (
                <Badge
                  variant="outline"
                  className="gap-0.5 text-[10px] bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4"
                >
                  <User className="h-1.5 w-1.5" />
                  {firstAsset.driverName}
                </Badge>
              )}
            </div>
            {firstAsset && (
              <div className="text-[10px] text-muted-foreground">
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
            className="w-4 h-4 opacity-60"
          />
        </div>

        {/* Second Asset Card */}
        <Card
          className={`flex-1 hover:shadow-sm transition-shadow border-l-4 ${categoryColor ? `border-${categoryColor}` : ""}`}
        >
          <CardHeader className="pb-0 pt-1.5 px-2.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {getSecondAssetTypeLabel()}
              </CardTitle>
              <SecondAssetIcon className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-2.5 pb-1.5">
            <div className="text-sm font-bold leading-tight">
              {pairing.secondAssetId}
            </div>
            {secondAssetLabel && (
              <Badge
                variant="outline"
                className="gap-0.5 text-[10px] bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4"
              >
                <Tag className="h-1.5 w-1.5" />
                {secondAssetLabel}
              </Badge>
            )}
            {secondAsset && (
              <div className="text-[10px] text-muted-foreground">
                AVI: {formatDate(secondAsset.aviDate)}
                {secondAsset.vilkDate && (
                  <span className="ml-1.5">
                    VILK: {formatDate(secondAsset.vilkDate)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Dropdown */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
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

      {/* Compact details row below */}
      <div className="flex flex-row flex-wrap gap-x-3 gap-y-0.5 items-center text-[10px] text-muted-foreground mt-1 px-0.5">
        {showPairingDriverName && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <User className="h-2.5 w-2.5" />
            Driver: {pairing.driverName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          Paired: {pairedDate.toLocaleDateString()}
        </span>
        {pairing.notes && (
          <span className="flex items-center gap-1">
            <FileText className="h-2.5 w-2.5" />
            {pairing.notes}
          </span>
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
            <AlertDialogCancel data-ocid="unpair.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="unpair.confirm_button"
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
