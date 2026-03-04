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
  AlertCircle,
  Calendar,
  Car,
  Clock,
  Container,
  Droplet,
  Edit,
  Link2,
  RotateCcw,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { AssetLabel, AssetType, Category } from "../backend";
import type { DownAssetWithPairing } from "../backend";
import { useReactivateDownAsset } from "../hooks/useQueries";
import UpdateDownReasonDialog from "./UpdateDownReasonDialog";

interface DownAssetCardProps {
  asset: DownAssetWithPairing;
}

export default function DownAssetCard({ asset }: DownAssetCardProps) {
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [updateReasonDialogOpen, setUpdateReasonDialogOpen] = useState(false);
  const reactivateAsset = useReactivateDownAsset();

  const aviDate = new Date(Number(asset.aviDate) / 1000000);
  const downDate = new Date(Number(asset.downDate) / 1000000);
  const lastUpdatedDate = asset.lastUpdated
    ? new Date(Number(asset.lastUpdated) / 1000000)
    : null;

  const handleReactivate = () => {
    reactivateAsset.mutate(asset.assetNumber, {
      onSuccess: () => setReactivateDialogOpen(false),
    });
  };

  const getCategoryLabel = (category: Category) => {
    const labels: Record<Category, string> = {
      [Category.transports]: "Transports",
      [Category.killTrucks]: "Kill Trucks",
      [Category.combo]: "Combo",
      [Category.acidFracs]: "Acid Fracs",
      [Category.fracPumps]: "Frac Pumps",
      [Category.treatersTrucksAndTrailers]: "Treater Trucks & Trailers",
      [Category.floatTrailer]: "Float Trailer",
      [Category.misc]: "Misc",
      [Category.spareTractors]: "Spare Tractors",
    };
    return labels[category] || category;
  };

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

  const getAssetIcon = () => {
    switch (asset.assetType) {
      case AssetType.tractor:
        return <Truck className="h-5 w-5 text-muted-foreground" />;
      case AssetType.trailer:
        return <Container className="h-5 w-5 text-muted-foreground" />;
      case AssetType.pump:
        return <Droplet className="h-5 w-5 text-muted-foreground" />;
      case AssetType.pickup:
        return <Car className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Truck className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const labelText = getAssetLabelText(asset.assetLabel);

  return (
    <>
      <Card className="border-muted bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getAssetIcon()}
              <CardTitle className="text-lg text-muted-foreground">
                {asset.assetNumber}
              </CardTitle>
            </div>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Down
            </Badge>
          </div>
          {(labelText ||
            (asset.assetType === AssetType.pickup && asset.driverName)) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {labelText && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-muted text-muted-foreground border-muted-foreground/20"
                >
                  <Tag className="h-3 w-3" />
                  {labelText}
                </Badge>
              )}
              {asset.assetType === AssetType.pickup && asset.driverName && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-muted text-muted-foreground border-muted-foreground/20"
                >
                  <User className="h-3 w-3" />
                  {asset.driverName}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Badge variant="outline" className="capitalize">
              {asset.assetType}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>AVI: {aviDate.toLocaleDateString()}</span>
            </div>

            {asset.vilkDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  VILK:{" "}
                  {new Date(
                    Number(asset.vilkDate) / 1000000,
                  ).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Down: {downDate.toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-muted">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm flex-1">
                <span className="text-muted-foreground">Reason: </span>
                <span className="font-medium text-foreground">
                  {asset.downReason}
                </span>
                {lastUpdatedDate && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last updated on{" "}
                      {lastUpdatedDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUpdateReasonDialogOpen(true)}
                className="h-8 w-8 p-0 shrink-0"
                aria-label="Update Down Reason"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {asset.previousPairing && (
            <div className="pt-2 border-t border-muted">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  <span className="font-medium">Previous Pairing:</span>
                </div>
                <div className="text-sm pl-6 space-y-1">
                  <div>
                    <span className="text-muted-foreground">Tractor: </span>
                    <span className="font-medium text-foreground">
                      {asset.previousPairing.tractorId}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trailer: </span>
                    <span className="font-medium text-foreground">
                      {asset.previousPairing.trailerId}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-medium text-foreground">
                      {getCategoryLabel(asset.previousPairing.category)}
                    </span>
                  </div>
                  {asset.previousPairing.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes: </span>
                      <span className="font-medium text-foreground">
                        {asset.previousPairing.notes}
                      </span>
                    </div>
                  )}
                  {asset.previousPairing.driverName && (
                    <div>
                      <span className="text-muted-foreground">Driver: </span>
                      <span className="font-medium text-foreground">
                        {asset.previousPairing.driverName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => setReactivateDialogOpen(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reactivate Asset
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Asset</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to reactivate asset{" "}
                <strong>{asset.assetNumber}</strong>? This will move it back to
                the active assets list and make it available for operations and
                pairing.
              </p>
              {asset.previousPairing && (
                <p className="text-sm bg-muted p-3 rounded-md">
                  <strong>Note:</strong> This asset was previously paired with{" "}
                  <strong>
                    {asset.assetType === AssetType.tractor
                      ? asset.previousPairing.trailerId
                      : asset.previousPairing.tractorId}
                  </strong>{" "}
                  in the{" "}
                  <strong>
                    {getCategoryLabel(asset.previousPairing.category)}
                  </strong>{" "}
                  category. If the other asset is still active and unpaired, the
                  pairing will be automatically restored.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={reactivateAsset.isPending}
            >
              {reactivateAsset.isPending
                ? "Reactivating..."
                : "Reactivate Asset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpdateDownReasonDialog
        open={updateReasonDialogOpen}
        onOpenChange={setUpdateReasonDialogOpen}
        asset={asset}
      />
    </>
  );
}
