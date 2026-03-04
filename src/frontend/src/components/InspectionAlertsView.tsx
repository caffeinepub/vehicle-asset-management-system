import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Container,
  Truck,
} from "lucide-react";
import type { Asset } from "../backend";
import { useGetAllAssets, useGetInspectionAlerts } from "../hooks/useQueries";

export default function InspectionAlertsView() {
  const { data: alerts, isLoading } = useGetInspectionAlerts();
  const { data: allAssets } = useGetAllAssets();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const expiredCount = alerts?.expired.length || 0;
  const upcomingCount = alerts?.upcoming.length || 0;
  const expiredVilkCount = alerts?.expiredVilk.length || 0;
  const upcomingVilkCount = alerts?.upcomingVilk.length || 0;
  const validCount = (allAssets?.length || 0) - expiredCount - upcomingCount;

  const renderAssetList = (
    assets: Asset[],
    title: string,
    variant: "destructive" | "default",
    inspectionType: "AVI" | "VILK",
  ) => {
    if (assets.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {assets.length} asset{assets.length !== 1 ? "s" : ""} requiring
            attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.map((asset) => {
              const inspectionDate =
                inspectionType === "AVI"
                  ? new Date(Number(asset.aviDate) / 1000000)
                  : asset.vilkDate
                    ? new Date(Number(asset.vilkDate) / 1000000)
                    : null;

              if (!inspectionDate) return null;

              const today = new Date();
              const daysUntilExpiry = Math.ceil(
                (inspectionDate.getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={`${asset.assetNumber}-${inspectionType}`}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {asset.assetType === "tractor" ? (
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Container className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{asset.assetNumber}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {inspectionType}:{" "}
                          {inspectionDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={variant}>
                      {daysUntilExpiry < 0
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                        : `${daysUntilExpiry} days left`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalExpired = expiredCount + expiredVilkCount;
  const totalUpcoming = upcomingCount + upcomingVilkCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {totalExpired}
            </div>
            {expiredVilkCount > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {expiredCount} AVI, {expiredVilkCount} VILK
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {totalUpcoming}
            </div>
            {upcomingVilkCount > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {upcomingCount} AVI, {upcomingVilkCount} VILK
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {validCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {totalExpired === 0 && totalUpcoming === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>All Clear!</AlertTitle>
          <AlertDescription>
            All assets have valid inspections. No immediate action required.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {totalExpired > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Urgent: Expired Inspections</AlertTitle>
              <AlertDescription>
                {totalExpired} inspection
                {totalExpired !== 1 ? "s have" : " has"} expired and require
                {totalExpired === 1 ? "s" : ""} immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {totalUpcoming > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Upcoming Inspections</AlertTitle>
              <AlertDescription>
                {totalUpcoming} inspection
                {totalUpcoming !== 1 ? "s are" : " is"} due within the next 30
                days.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {renderAssetList(
        alerts?.expired || [],
        "Expired AVI Inspections",
        "destructive",
        "AVI",
      )}
      {renderAssetList(
        alerts?.expiredVilk || [],
        "Expired VILK Inspections",
        "destructive",
        "VILK",
      )}
      {renderAssetList(
        alerts?.upcoming || [],
        "AVI Inspections Due Soon",
        "default",
        "AVI",
      )}
      {renderAssetList(
        alerts?.upcomingVilk || [],
        "VILK Inspections Due Soon",
        "default",
        "VILK",
      )}
    </div>
  );
}
