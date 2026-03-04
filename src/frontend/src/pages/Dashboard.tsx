import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Link2,
  Printer,
  Share2,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AssetsView from "../components/AssetsView";
import DownAssetsView from "../components/DownAssetsView";
import InspectionAlertsView from "../components/InspectionAlertsView";
import PairingsView from "../components/PairingsView";
import PrintReport from "../components/PrintReport";
import {
  useGetAllDownAssets,
  useGetAllPairings,
  useGetInspectionAlerts,
} from "../hooks/useQueries";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("assets");
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [printMode, setPrintMode] = useState<"full" | "down-assets">("full");
  const [isSharing, setIsSharing] = useState(false);
  const [isSharingDownAssets, setIsSharingDownAssets] = useState(false);
  const { data: alerts } = useGetInspectionAlerts();
  const { data: downAssets } = useGetAllDownAssets();
  const { data: pairings } = useGetAllPairings();

  const alertCount =
    (alerts?.upcoming.length || 0) + (alerts?.expired.length || 0);
  const downAssetsCount = downAssets?.length || 0;

  const handlePrint = () => {
    setPrintMode("full");
    setShowPrintReport(true);
    // Small delay to ensure the component renders before printing
    setTimeout(() => {
      window.print();
      setShowPrintReport(false);
    }, 100);
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      // Generate shareable content
      const shareTitle = "Fleet Management Pairings Report";
      const shareText = `Fleet Management Report - ${pairings?.length || 0} active pairings\nGenerated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
      const shareUrl = window.location.href;

      // Check if native share is supported
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Report shared successfully");
      } else {
        // Fallback: Copy to clipboard
        const textToCopy = `${shareTitle}\n\n${shareText}\n\nView online: ${shareUrl}`;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          toast.success("Report link copied to clipboard");
        } else {
          // Fallback for older browsers
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
      // User cancelled share or error occurred
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share report. Please try again.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareDownAssets = async () => {
    setIsSharingDownAssets(true);

    try {
      // Generate shareable content for down assets
      const shareTitle = "Fleet Management Down Assets Report";
      const shareText = `Down Assets Report - ${downAssetsCount} assets currently down\nGenerated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
      const shareUrl = window.location.href;

      // Check if native share is supported
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Down Assets report shared successfully");
      } else {
        // Fallback: Copy to clipboard
        const textToCopy = `${shareTitle}\n\n${shareText}\n\nView online: ${shareUrl}`;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          toast.success("Down Assets report copied to clipboard");
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
            toast.success("Down Assets report copied to clipboard");
          } catch (_err) {
            toast.error("Unable to share. Please copy the URL manually.");
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share Down Assets report. Please try again.");
      }
    } finally {
      setIsSharingDownAssets(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 no-print">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Fleet Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your vehicle assets and track AVI inspection dates
            </p>
          </div>
          <div className="flex flex-row flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="enhanced-action-button-sm group"
              aria-label="Print detailed pairings report"
            >
              <Printer className="h-3.5 w-3.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="enhanced-action-button-sm group"
              disabled={isSharing}
              aria-label="Share detailed pairings report"
            >
              <Share2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <span>{isSharing ? "Sharing..." : "Share Report"}</span>
            </button>
            <button
              type="button"
              onClick={handleShareDownAssets}
              className="enhanced-action-button-sm group"
              disabled={isSharingDownAssets}
              aria-label="Share down assets report"
            >
              <Share2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <span>
                {isSharingDownAssets ? "Sharing..." : "Share Down Assets"}
              </span>
            </button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="assets" className="gap-2">
              <Truck className="h-4 w-4" />
              <span>Assets</span>
            </TabsTrigger>
            <TabsTrigger value="pairings" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span>Pairings</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 relative">
              <AlertTriangle className="h-4 w-4" />
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {alertCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="down" className="gap-2 relative">
              <XCircle className="h-4 w-4" />
              <span>Down</span>
              {downAssetsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {downAssetsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <AssetsView />
          </TabsContent>

          <TabsContent value="pairings" className="space-y-4">
            <PairingsView />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <InspectionAlertsView />
          </TabsContent>

          <TabsContent value="down" className="space-y-4">
            <DownAssetsView />
          </TabsContent>
        </Tabs>
      </div>

      {showPrintReport && <PrintReport mode={printMode} />}
    </>
  );
}
