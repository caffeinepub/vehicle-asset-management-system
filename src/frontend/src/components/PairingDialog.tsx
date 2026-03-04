import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Container, Droplet, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AssetLabel, AssetType, Category } from "../backend";
import type { Asset, AssetPairing } from "../backend";
import {
  useCreatePairing,
  useGetAssetsByType,
  useGetAvailablePumps,
  useGetAvailableTrailers,
  useUpdatePairing,
} from "../hooks/useQueries";

interface PairingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPairing?: AssetPairing | null;
}

const categoryOptions = [
  {
    value: "transports" as const,
    label: "Transports",
    enumValue: Category.transports,
  },
  {
    value: "killTrucks" as const,
    label: "Kill Trucks",
    enumValue: Category.killTrucks,
  },
  { value: "combo" as const, label: "Combo", enumValue: Category.combo },
  {
    value: "acidFracs" as const,
    label: "Acid Fracs",
    enumValue: Category.acidFracs,
  },
  {
    value: "fracPumps" as const,
    label: "Frac Pumps",
    enumValue: Category.fracPumps,
  },
  {
    value: "treatersTrucksAndTrailers" as const,
    label: "Treater Trucks & Trailers",
    enumValue: Category.treatersTrucksAndTrailers,
  },
  {
    value: "floatTrailer" as const,
    label: "Float Trailer",
    enumValue: Category.floatTrailer,
  },
  { value: "misc" as const, label: "Misc", enumValue: Category.misc },
  {
    value: "spareTractors" as const,
    label: "Spare Tractors",
    enumValue: Category.spareTractors,
  },
];

const formatAssetLabel = (label?: AssetLabel) => {
  if (!label) return "";
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
      return "";
  }
};

const formatDate = (timestamp: bigint | undefined) => {
  if (!timestamp) return "N/A";
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString();
};

export default function PairingDialog({
  open,
  onOpenChange,
  editingPairing,
}: PairingDialogProps) {
  const [firstAssetId, setFirstAssetId] = useState("");
  const [secondAssetId, setSecondAssetId] = useState("");
  const [category, setCategory] = useState<string>("transports");
  const [notes, setNotes] = useState("");
  const [driverName, setDriverName] = useState("");

  const { data: tractors } = useGetAssetsByType(AssetType.tractor);
  const { data: pickups } = useGetAssetsByType(AssetType.pickup);
  const { data: availableTrailers } = useGetAvailableTrailers();
  const { data: availablePumps } = useGetAvailablePumps();
  const createPairing = useCreatePairing();
  const updatePairing = useUpdatePairing();

  // Combine tractors and pickups for first asset selection
  const availableFirstAssets: Array<Asset & { displayType: string }> = [
    ...(tractors || []).map((asset) => ({ ...asset, displayType: "Tractor" })),
    ...(pickups || []).map((asset) => ({ ...asset, displayType: "Pickup" })),
  ];

  // Determine available second assets based on first asset type
  const firstAsset = availableFirstAssets.find(
    (a) => a.assetNumber === firstAssetId,
  );
  const firstAssetType = firstAsset?.assetType;

  // Pickups can only pair with trailers; tractors can pair with trailers or pumps
  const availableSecondAssets: Array<Asset & { displayType: string }> =
    firstAssetType === AssetType.pickup
      ? (availableTrailers || []).map((asset) => ({
          ...asset,
          displayType: "Trailer",
        }))
      : [
          ...(availableTrailers || []).map((asset) => ({
            ...asset,
            displayType: "Trailer",
          })),
          ...(availablePumps || []).map((asset) => ({
            ...asset,
            displayType: "Pump",
          })),
        ];

  // Helper to convert Category enum to string key
  const categoryToString = useCallback((cat: Category): string => {
    const option = categoryOptions.find((opt) => opt.enumValue === cat);
    return option?.value || "transports";
  }, []);

  // Check if driver name field should be shown
  const showDriverNameField = category === "treatersTrucksAndTrailers";

  useEffect(() => {
    if (editingPairing) {
      setFirstAssetId(editingPairing.tractorId);
      setSecondAssetId(editingPairing.secondAssetId);
      setCategory(categoryToString(editingPairing.category));
      setNotes(editingPairing.notes);
      setDriverName(editingPairing.driverName || "");
    } else {
      setFirstAssetId("");
      setSecondAssetId("");
      setCategory("transports");
      setNotes("");
      setDriverName("");
    }
  }, [editingPairing, categoryToString]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get the enum value from the selected string
    const selectedOption = categoryOptions.find(
      (opt) => opt.value === category,
    );
    const categoryEnum = selectedOption?.enumValue || Category.transports;

    // Only include driver name if category is Treater Trucks & Trailers
    const driverNameValue =
      categoryEnum === Category.treatersTrucksAndTrailers && driverName.trim()
        ? driverName.trim()
        : null;

    if (editingPairing) {
      updatePairing.mutate(
        {
          tractorId: editingPairing.tractorId,
          category: categoryEnum,
          notes,
          driverName: driverNameValue,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      // Find the selected asset to determine its type
      const selectedAsset = availableSecondAssets.find(
        (a) => a.assetNumber === secondAssetId,
      );
      const assetType = selectedAsset?.assetType || AssetType.trailer;

      createPairing.mutate(
        {
          tractorId: firstAssetId,
          secondAssetId,
          assetType,
          category: categoryEnum,
          notes,
          driverName: driverNameValue,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    }
  };

  const isValid = editingPairing ? true : firstAssetId && secondAssetId;

  const getAssetIcon = (assetType: AssetType) => {
    switch (assetType) {
      case AssetType.tractor:
        return <Truck className="h-3 w-3 text-muted-foreground" />;
      case AssetType.trailer:
        return <Container className="h-3 w-3 text-muted-foreground" />;
      case AssetType.pump:
        return <Droplet className="h-3 w-3 text-muted-foreground" />;
      case AssetType.pickup:
        return <Car className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPairing ? "Edit Pairing" : "Create New Pairing"}
          </DialogTitle>
          <DialogDescription>
            {editingPairing
              ? "Update the category, notes, and Driver Name for this pairing."
              : "Pair a tractor or pickup with a trailer or pump and assign a category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingPairing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstAssetId">Tractor or Pickup</Label>
                <Select
                  value={firstAssetId}
                  onValueChange={(value) => {
                    setFirstAssetId(value);
                    setSecondAssetId(""); // Reset second asset when first asset changes
                  }}
                >
                  <SelectTrigger id="firstAssetId">
                    <SelectValue placeholder="Select a tractor or pickup" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFirstAssets.map((asset) => (
                      <SelectItem
                        key={asset.assetNumber}
                        value={asset.assetNumber}
                      >
                        <div className="flex items-center gap-2">
                          {getAssetIcon(asset.assetType)}
                          <span className="font-medium">
                            {asset.displayType}:
                          </span>
                          <span>{asset.assetNumber}</span>
                          {asset.assetLabel && (
                            <span className="text-xs text-muted-foreground">
                              ({formatAssetLabel(asset.assetLabel)})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondAssetId">
                  {firstAssetType === AssetType.pickup
                    ? "Trailer"
                    : "Trailer or Pump"}
                </Label>
                <Select
                  value={secondAssetId}
                  onValueChange={setSecondAssetId}
                  disabled={!firstAssetId}
                >
                  <SelectTrigger id="secondAssetId">
                    <SelectValue
                      placeholder={
                        !firstAssetId
                          ? "Select first asset first"
                          : firstAssetType === AssetType.pickup
                            ? "Select a trailer"
                            : "Select a trailer or pump"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSecondAssets.map((asset) => (
                      <SelectItem
                        key={asset.assetNumber}
                        value={asset.assetNumber}
                      >
                        <div className="flex items-center gap-2">
                          {getAssetIcon(asset.assetType)}
                          <span className="font-medium">
                            {asset.displayType}:
                          </span>
                          <span>{asset.assetNumber}</span>
                          {asset.assetLabel && (
                            <span className="text-xs text-muted-foreground">
                              ({formatAssetLabel(asset.assetLabel)})
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            | AVI: {formatDate(asset.aviDate)}
                          </span>
                          {asset.vilkDate && (
                            <span className="text-xs text-muted-foreground">
                              | VILK: {formatDate(asset.vilkDate)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showDriverNameField && (
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name (Optional)</Label>
              <Input
                id="driverName"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !isValid || createPairing.isPending || updatePairing.isPending
              }
            >
              {createPairing.isPending || updatePairing.isPending
                ? "Saving..."
                : editingPairing
                  ? "Save Changes"
                  : "Create Pairing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
