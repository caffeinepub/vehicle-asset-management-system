import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Plus,
  Printer,
  Share2,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AssetLabel, AssetType, Category } from "../backend";
import type { Asset, AssetPairing } from "../backend";
import { useGetAllPairings, useGetAssetsByType } from "../hooks/useQueries";
import PairingCard from "./PairingCard";
import PairingDialog from "./PairingDialog";
import PrintReport from "./PrintReport";

const CATEGORY_ORDER = [
  Category.transports,
  Category.killTrucks,
  Category.combo,
  Category.acidFracs,
  Category.fracPumps,
  Category.treatersTrucksAndTrailers,
  Category.floatTrailer,
  Category.misc,
  Category.spareTractors,
] as const;

const categoryLabels: Record<Category, string> = {
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

const categoryColors: Record<Category, string> = {
  [Category.transports]: "category-transports",
  [Category.killTrucks]: "category-kill-trucks",
  [Category.combo]: "category-combo",
  [Category.acidFracs]: "category-acid-fracs",
  [Category.fracPumps]: "category-frac-pumps",
  [Category.treatersTrucksAndTrailers]: "category-treater",
  [Category.floatTrailer]: "category-float-trailer",
  [Category.misc]: "category-misc",
  [Category.spareTractors]: "category-spare",
};

export default function PairingsView() {
  const { data: pairings, isLoading } = useGetAllPairings();
  const { data: tractors } = useGetAssetsByType(AssetType.tractor);
  const { data: pickups } = useGetAssetsByType(AssetType.pickup);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPairing, setEditingPairing] = useState<AssetPairing | null>(
    null,
  );
  const [openCategories, setOpenCategories] = useState<Set<Category>>(
    new Set(CATEGORY_ORDER),
  );
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleEdit = (pairing: AssetPairing) => {
    setEditingPairing(pairing);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPairing(null);
  };

  const toggleCategory = (category: Category) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handlePrint = () => {
    setShowPrintReport(true);
    setTimeout(() => {
      window.print();
      setShowPrintReport(false);
    }, 100);
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const shareTitle = "Fleet Management Pairings Report";
      const shareText = `Fleet Management Report - ${pairings?.length || 0} active pairings\nGenerated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
      const shareUrl = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Report shared successfully");
      } else {
        const textToCopy = `${shareTitle}\n\n${shareText}\n\nView online: ${shareUrl}`;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          toast.success("Report link copied to clipboard");
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
            toast.success("Report link copied to clipboard");
          } catch (_err) {
            toast.error("Unable to share. Please copy the URL manually.");
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share report. Please try again.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const pairedTractorIds = new Set(pairings?.map((p) => p.tractorId) || []);
  const availableTractors =
    tractors?.filter((t) => !pairedTractorIds.has(t.assetNumber)) || [];
  const availablePickups =
    pickups?.filter((p) => !pairedTractorIds.has(p.assetNumber)) || [];
  const availableFirstAssets =
    availableTractors.length + availablePickups.length;

  const standaloneMiscPickups =
    pickups?.filter(
      (p) =>
        !pairedTractorIds.has(p.assetNumber) &&
        p.standaloneCategory === Category.misc,
    ) || [];

  const standaloneSpareTractors =
    tractors?.filter(
      (t) =>
        !pairedTractorIds.has(t.assetNumber) &&
        t.standaloneCategory === Category.spareTractors,
    ) || [];

  const pairingsByCategory = CATEGORY_ORDER.map((category) => {
    const categoryPairings =
      pairings?.filter((p) => p.category === category) || [];
    let standaloneAssets: Asset[] = [];

    if (category === Category.misc) {
      standaloneAssets = standaloneMiscPickups;
    } else if (category === Category.spareTractors) {
      standaloneAssets = standaloneSpareTractors;
    }

    return {
      category,
      label: categoryLabels[category],
      color: categoryColors[category],
      pairings: categoryPairings,
      standaloneAssets,
      totalCount: categoryPairings.length + standaloneAssets.length,
    };
  });

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
    return categoryLabels[category] || null;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalStandaloneAssets =
    standaloneMiscPickups.length + standaloneSpareTractors.length;

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Active Pairings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pairings?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Available for Pairing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableFirstAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {availableTractors.length} tractors, {availablePickups.length}{" "}
                pickups
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Asset Pairings & Categorized Assets</CardTitle>
                <CardDescription>
                  Manage tractor-trailer, tractor-pump, and pickup-trailer
                  combinations by category.
                </CardDescription>
              </div>
              <div className="flex flex-row flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="enhanced-action-button-sm group"
                  aria-label="Print pairings report"
                  data-ocid="pairings.print.button"
                >
                  <Printer className="h-3.5 w-3.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="enhanced-action-button-sm group"
                  disabled={isSharing}
                  aria-label="Share Detailed Pairings Report"
                  data-ocid="pairings.share.button"
                >
                  <Share2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span>{isSharing ? "Sharing..." : "Share Report"}</span>
                </button>
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="sm"
                  disabled={availableFirstAssets === 0}
                  data-ocid="pairings.create.primary_button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Pairing
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pairings?.length === 0 && totalStandaloneAssets === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                data-ocid="pairings.empty_state"
              >
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Pairings Yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first pairing to track asset combinations.
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="sm"
                  disabled={availableFirstAssets === 0}
                  data-ocid="pairings.empty.primary_button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Pairing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pairingsByCategory.map(
                  ({
                    category,
                    label,
                    color,
                    pairings: categoryPairings,
                    standaloneAssets,
                    totalCount,
                  }) => {
                    if (totalCount === 0) return null;

                    const isOpen = openCategories.has(category);

                    return (
                      <Collapsible
                        key={category}
                        open={isOpen}
                        onOpenChange={() => toggleCategory(category)}
                        className="border rounded-lg overflow-hidden"
                      >
                        <CollapsibleTrigger className="w-full">
                          <div
                            className={`flex items-center justify-between p-3 ${color} hover:opacity-90 transition-opacity`}
                          >
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-white">
                                {label}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                                {totalCount}
                              </span>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-white" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-2 bg-card">
                            <div className="space-y-1.5">
                              {/* Paired Assets */}
                              {categoryPairings.map((pairing) => (
                                <div
                                  key={pairing.tractorId}
                                  className="border rounded-md p-2 bg-background"
                                >
                                  <PairingCard
                                    pairing={pairing}
                                    onEdit={handleEdit}
                                    categoryColor={color}
                                  />
                                </div>
                              ))}

                              {/* Standalone Categorized Assets */}
                              {standaloneAssets.map((asset: Asset) => {
                                const labelText = getAssetLabelText(
                                  asset.assetLabel,
                                );
                                const categoryText = getCategoryText(
                                  asset.standaloneCategory,
                                );
                                const AssetIcon =
                                  asset.assetType === AssetType.pickup
                                    ? Car
                                    : Truck;
                                const assetTypeLabel =
                                  asset.assetType === AssetType.pickup
                                    ? "Pickup"
                                    : "Tractor";

                                return (
                                  <div
                                    key={asset.assetNumber}
                                    className="border rounded-md p-2 bg-background"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                                        <AssetIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                        <span className="text-[10px] text-muted-foreground">
                                          {assetTypeLabel}
                                        </span>
                                        <span className="text-sm font-bold">
                                          {asset.assetNumber}
                                        </span>
                                        {labelText && (
                                          <Badge
                                            variant="outline"
                                            className="gap-0.5 text-[10px] bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4"
                                          >
                                            <Tag className="h-1.5 w-1.5" />
                                            {labelText}
                                          </Badge>
                                        )}
                                        {categoryText && (
                                          <Badge
                                            variant="outline"
                                            className="gap-0.5 text-[10px] bg-accent/10 text-accent-foreground border-accent/20 px-1 py-0 h-4"
                                          >
                                            <FolderOpen className="h-1.5 w-1.5" />
                                            {categoryText}
                                          </Badge>
                                        )}
                                        {asset.assetType === AssetType.pickup &&
                                          asset.driverName && (
                                            <Badge
                                              variant="outline"
                                              className="gap-0.5 text-[10px] bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4"
                                            >
                                              <User className="h-1.5 w-1.5" />
                                              {asset.driverName}
                                            </Badge>
                                          )}
                                        <span className="text-[10px] text-muted-foreground">
                                          AVI: {formatDate(asset.aviDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <PairingDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          editingPairing={editingPairing}
        />
      </div>

      {showPrintReport && <PrintReport />}
    </>
  );
}
