import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { Asset } from "../backend";
import { useMarkAssetAsDown } from "../hooks/useQueries";

interface MarkAssetDownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
}

export default function MarkAssetDownDialog({
  open,
  onOpenChange,
  asset,
}: MarkAssetDownDialogProps) {
  const [reason, setReason] = useState("");
  const markAssetAsDown = useMarkAssetAsDown();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    markAssetAsDown.mutate(
      { assetNumber: asset.assetNumber, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason("");
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
    }
    onOpenChange(newOpen);
  };

  const isValid = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Asset as Down</DialogTitle>
          <DialogDescription>
            Mark <strong>{asset.assetNumber}</strong> as down and provide a
            reason. This asset will be removed from active operations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Engine failure, scheduled maintenance, accident damage..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for marking this asset as down.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || markAssetAsDown.isPending}
            >
              {markAssetAsDown.isPending ? "Marking Down..." : "Mark as Down"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
