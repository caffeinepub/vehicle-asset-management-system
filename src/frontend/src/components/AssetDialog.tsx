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
import { useEffect, useState } from "react";
import { AssetLabel, AssetType, Category } from "../backend";
import type { Asset } from "../backend";
import { useCreateAsset, useUpdateAsset } from "../hooks/useQueries";

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAsset?: Asset | null;
}

export default function AssetDialog({
  open,
  onOpenChange,
  editingAsset,
}: AssetDialogProps) {
  const [assetNumber, setAssetNumber] = useState("");
  const [assetType, setAssetType] = useState<AssetType>(AssetType.tractor);
  const [aviDate, setAviDate] = useState("");
  const [vilkDate, setVilkDate] = useState("");
  const [assetLabel, setAssetLabel] = useState<AssetLabel | "none">("none");
  const [standaloneCategory, setStandaloneCategory] = useState<
    Category | "none"
  >("none");
  const [driverName, setDriverName] = useState("");

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  useEffect(() => {
    if (editingAsset) {
      setAssetNumber(editingAsset.assetNumber);
      setAssetType(editingAsset.assetType as AssetType);
      const date = new Date(Number(editingAsset.aviDate) / 1000000);
      setAviDate(date.toISOString().split("T")[0]);

      if (editingAsset.vilkDate) {
        const vDate = new Date(Number(editingAsset.vilkDate) / 1000000);
        setVilkDate(vDate.toISOString().split("T")[0]);
      } else {
        setVilkDate("");
      }

      if (editingAsset.assetLabel) {
        setAssetLabel(editingAsset.assetLabel as AssetLabel);
      } else {
        setAssetLabel("none");
      }

      if (editingAsset.standaloneCategory) {
        setStandaloneCategory(editingAsset.standaloneCategory as Category);
      } else {
        setStandaloneCategory("none");
      }

      if (editingAsset.driverName) {
        setDriverName(editingAsset.driverName);
      } else {
        setDriverName("");
      }
    } else {
      setAssetNumber("");
      setAssetType(AssetType.tractor);
      setAviDate("");
      setVilkDate("");
      setAssetLabel("none");
      setStandaloneCategory("none");
      setDriverName("");
    }
  }, [editingAsset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dateObj = new Date(aviDate);
    const aviDateNano = BigInt(dateObj.getTime()) * BigInt(1000000);

    let vilkDateNano: bigint | null = null;
    if (vilkDate && assetType === AssetType.trailer) {
      const vDateObj = new Date(vilkDate);
      vilkDateNano = BigInt(vDateObj.getTime()) * BigInt(1000000);
    }

    const labelValue =
      assetLabel === "none" ? null : (assetLabel as AssetLabel);
    const categoryValue =
      standaloneCategory === "none" ? null : (standaloneCategory as Category);
    const driverNameValue = driverName.trim() === "" ? null : driverName.trim();

    if (editingAsset) {
      updateAsset.mutate(
        {
          assetNumber: editingAsset.assetNumber,
          newAviDate: aviDateNano,
          newVilkDate: vilkDateNano,
          newAssetLabel: labelValue,
          newStandaloneCategory: categoryValue,
          newDriverName: driverNameValue,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createAsset.mutate(
        {
          assetNumber,
          assetType,
          aviDate: aviDateNano,
          vilkDate: vilkDateNano,
          assetLabel: labelValue,
          standaloneCategory: categoryValue,
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

  const isValid = assetNumber.trim() && aviDate;
  const showVilkField = assetType === AssetType.trailer;
  const showCategoryField =
    assetType === AssetType.pickup || assetType === AssetType.tractor;
  const showDriverNameField = assetType === AssetType.pickup;

  const getLabelOptions = () => {
    if (assetType === AssetType.tractor) {
      return [
        { value: "none", label: "No Label" },
        { value: AssetLabel.ptoTractor, label: "PTO Tractor" },
      ];
    }
    if (assetType === AssetType.trailer) {
      return [
        { value: "none", label: "No Label" },
        { value: AssetLabel.twoTank, label: "2 Tank" },
        { value: AssetLabel.threeTank, label: "3 Tank" },
      ];
    }
    if (assetType === AssetType.pickup) {
      return [
        { value: "none", label: "No Label" },
        { value: AssetLabel.f250, label: "F-250" },
        { value: AssetLabel.f350, label: "F-350" },
        { value: AssetLabel.dodgeRam, label: "Dodge Ram" },
        { value: AssetLabel.tundra, label: "Tundra" },
      ];
    }
    // Pump assets don't have predefined labels
    return [{ value: "none", label: "No Label" }];
  };

  const getCategoryOptions = () => {
    if (assetType === AssetType.pickup) {
      return [
        { value: "none", label: "No Category" },
        { value: Category.misc, label: "MISC" },
      ];
    }
    if (assetType === AssetType.tractor) {
      return [
        { value: "none", label: "No Category" },
        { value: Category.spareTractors, label: "Spare Tractors" },
      ];
    }
    return [];
  };

  const getCategoryHelperText = () => {
    if (assetType === AssetType.pickup) {
      return "Assign unpaired pickups to MISC category for organization.";
    }
    if (assetType === AssetType.tractor) {
      return "Assign unpaired tractors to Spare Tractors category for organization.";
    }
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingAsset ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
          <DialogDescription>
            {editingAsset
              ? "Update the Inspection Dates, label, category, and Driver Name for this asset."
              : "Enter the details for the new asset."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assetNumber">Asset Number</Label>
            <Input
              id="assetNumber"
              value={assetNumber}
              onChange={(e) => setAssetNumber(e.target.value)}
              placeholder="e.g., T-001"
              disabled={!!editingAsset}
              required
            />
          </div>

          {!editingAsset && (
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select
                value={assetType}
                onValueChange={(value) => {
                  setAssetType(value as AssetType);
                  setAssetLabel("none");
                  setStandaloneCategory("none");
                  setDriverName("");
                }}
              >
                <SelectTrigger id="assetType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AssetType.tractor}>Tractor</SelectItem>
                  <SelectItem value={AssetType.trailer}>Trailer</SelectItem>
                  <SelectItem value={AssetType.pump}>Pump</SelectItem>
                  <SelectItem value={AssetType.pickup}>Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assetLabel">Label (Optional)</Label>
            <Select
              value={assetLabel}
              onValueChange={(value) =>
                setAssetLabel(value as AssetLabel | "none")
              }
            >
              <SelectTrigger id="assetLabel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getLabelOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCategoryField && (
            <div className="space-y-2">
              <Label htmlFor="standaloneCategory">Category (Optional)</Label>
              <Select
                value={standaloneCategory}
                onValueChange={(value) =>
                  setStandaloneCategory(value as Category | "none")
                }
              >
                <SelectTrigger id="standaloneCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getCategoryHelperText()}
              </p>
            </div>
          )}

          {showDriverNameField && (
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name (Optional)</Label>
              <Input
                id="driverName"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g., John Smith"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Assign a custom Driver Name to this pickup asset.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="aviDate">AVI Inspection Date</Label>
            <Input
              id="aviDate"
              type="date"
              value={aviDate}
              onChange={(e) => setAviDate(e.target.value)}
              required
            />
          </div>

          {showVilkField && (
            <div className="space-y-2">
              <Label htmlFor="vilkDate">VILK Inspection Date (Optional)</Label>
              <Input
                id="vilkDate"
                type="date"
                value={vilkDate}
                onChange={(e) => setVilkDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                VILK Inspection Date for trailer assets.
              </p>
            </div>
          )}

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
                !isValid || createAsset.isPending || updateAsset.isPending
              }
            >
              {createAsset.isPending || updateAsset.isPending
                ? "Saving..."
                : editingAsset
                  ? "Save Changes"
                  : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
