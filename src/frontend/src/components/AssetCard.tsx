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
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  Container,
  Droplet,
  Edit,
  FolderOpen,
  Link2,
  MoreVertical,
  Tag,
  Trash2,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { AssetLabel, AssetType, Category } from "../backend";
import type { Asset, AssetPairing } from "../backend";
import { useDeleteAsset } from "../hooks/useQueries";
import MarkAssetDownDialog from "./MarkAssetDownDialog";

interface AssetCardProps {
  asset: Asset;
  pairings: AssetPairing[];
  onEdit: (asset: Asset) => void;
}

export default function AssetCard({ asset, pairings, onEdit }: AssetCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markDownDialogOpen, setMarkDownDialogOpen] = useState(false);
  const deleteAsset = useDeleteAsset();

  const pairing = pairings.find(
    (p) =>
      p.tractorId === asset.assetNumber ||
      p.secondAssetId === asset.assetNumber,
  );

  const aviDate = new Date(Number(asset.aviDate) / 1000000);
  const today = new Date();
  const aviDaysUntilExpiry = Math.ceil(
    (aviDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const getAviInspectionStatus = () => {
    if (aviDaysUntilExpiry < 0) {
      return {
        label: "AVI Expired",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    }
    if (aviDaysUntilExpiry <= 30) {
      return {
        label: "AVI Due Soon",
        variant: "default" as const,
        icon: AlertTriangle,
      };
    }
    return {
      label: "AVI Valid",
      variant: "secondary" as const,
      icon: CheckCircle2,
    };
  };

  const getVilkInspectionStatus = () => {
    if (!asset.vilkDate) return null;

    const vilkDate = new Date(Number(asset.vilkDate) / 1000000);
    const vilkDaysUntilExpiry = Math.ceil(
      (vilkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (vilkDaysUntilExpiry < 0) {
      return {
        label: "VILK Expired",
        variant: "destructive" as const,
        icon: AlertTriangle,
        daysLeft: vilkDaysUntilExpiry,
      };
    }
    if (vilkDaysUntilExpiry <= 30) {
      return {
        label: "VILK Due Soon",
        variant: "default" as const,
        icon: AlertTriangle,
        daysLeft: vilkDaysUntilExpiry,
      };
    }
    return {
      label: "VILK Valid",
      variant: "secondary" as const,
      icon: CheckCircle2,
      daysLeft: vilkDaysUntilExpiry,
    };
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

  const getCategoryText = (category?: Category) => {
    if (!category) return null;
    switch (category) {
      case Category.misc:
        return "MISC";
      case Category.spareTractors:
        return "Spare Tractors";
      default:
        return null;
    }
  };

  const getAssetIcon = () => {
    switch (asset.assetType) {
      case AssetType.tractor:
        return <Truck className="h-5 w-5 text-primary" />;
      case AssetType.trailer:
        return <Container className="h-5 w-5 text-primary" />;
      case AssetType.pump:
        return <Droplet className="h-5 w-5 text-primary" />;
      case AssetType.pickup:
        return <Car className="h-5 w-5 text-primary" />;
      default:
        return <Truck className="h-5 w-5 text-primary" />;
    }
  };

  const aviStatus = getAviInspectionStatus();
  const vilkStatus = getVilkInspectionStatus();
  const AviStatusIcon = aviStatus.icon;
  const labelText = getAssetLabelText(asset.assetLabel);
  const categoryText = getCategoryText(asset.standaloneCategory);

  const handleDelete = () => {
    deleteAsset.mutate(asset.assetNumber, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getAssetIcon()}
              <CardTitle className="text-lg">{asset.assetNumber}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(asset)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMarkDownDialogOpen(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Down
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {(labelText ||
            categoryText ||
            (asset.assetType === AssetType.pickup && asset.driverName)) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {labelText && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  <Tag className="h-3 w-3" />
                  {labelText}
                </Badge>
              )}
              {categoryText && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-accent/10 text-accent-foreground border-accent/20"
                >
                  <FolderOpen className="h-3 w-3" />
                  {categoryText}
                </Badge>
              )}
              {asset.assetType === AssetType.pickup && asset.driverName && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-primary/10 text-primary border-primary/20"
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
            <Badge variant={aviStatus.variant} className="gap-1">
              <AviStatusIcon className="h-3 w-3" />
              {aviStatus.label}
            </Badge>
            {vilkStatus && (
              <Badge variant={vilkStatus.variant} className="gap-1">
                <vilkStatus.icon className="h-3 w-3" />
                {vilkStatus.label}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>AVI: {aviDate.toLocaleDateString()}</span>
              </div>
              {aviDaysUntilExpiry >= 0 && (
                <div className="text-xs text-muted-foreground pl-6">
                  {aviDaysUntilExpiry} days remaining
                </div>
              )}
              {aviDaysUntilExpiry < 0 && (
                <div className="text-xs text-destructive pl-6 font-medium">
                  Expired {Math.abs(aviDaysUntilExpiry)} days ago
                </div>
              )}
            </div>

            {asset.vilkDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    VILK:{" "}
                    {new Date(
                      Number(asset.vilkDate) / 1000000,
                    ).toLocaleDateString()}
                  </span>
                </div>
                {vilkStatus && vilkStatus.daysLeft >= 0 && (
                  <div className="text-xs text-muted-foreground pl-6">
                    {vilkStatus.daysLeft} days remaining
                  </div>
                )}
                {vilkStatus && vilkStatus.daysLeft < 0 && (
                  <div className="text-xs text-destructive pl-6 font-medium">
                    Expired {Math.abs(vilkStatus.daysLeft)} days ago
                  </div>
                )}
              </div>
            )}
          </div>

          {pairing && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Paired with{" "}
                  <span className="font-medium text-foreground">
                    {asset.assetType === AssetType.tractor ||
                    asset.assetType === AssetType.pickup
                      ? pairing.secondAssetId
                      : pairing.tractorId}
                  </span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete asset{" "}
              <strong>{asset.assetNumber}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAsset.isPending}
            >
              {deleteAsset.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MarkAssetDownDialog
        open={markDownDialogOpen}
        onOpenChange={setMarkDownDialogOpen}
        asset={asset}
      />
    </>
  );
}
