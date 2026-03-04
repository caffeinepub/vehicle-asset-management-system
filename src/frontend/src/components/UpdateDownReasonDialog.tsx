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
import { useEffect, useState } from "react";
import type { DownAssetWithPairing } from "../backend";
import { useUpdateDownReason } from "../hooks/useQueries";

interface UpdateDownReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: DownAssetWithPairing;
}

export default function UpdateDownReasonDialog({
  open,
  onOpenChange,
  asset,
}: UpdateDownReasonDialogProps) {
  const [reason, setReason] = useState(asset.downReason);
  const updateDownReason = useUpdateDownReason();

  useEffect(() => {
    if (open) {
      setReason(asset.downReason);
    }
  }, [open, asset.downReason]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateDownReason.mutate(
      { assetNumber: asset.assetNumber, newReason: reason.trim() },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason(asset.downReason);
    }
    onOpenChange(newOpen);
  };

  const isValid = reason.trim().length > 0;
  const hasChanged = reason.trim() !== asset.downReason;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Down Reason</DialogTitle>
          <DialogDescription>
            Update the down reason for asset{" "}
            <strong>{asset.assetNumber}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Down Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Engine failure, scheduled maintenance, accident damage..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for why this asset is down.
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
              disabled={!isValid || !hasChanged || updateDownReason.isPending}
            >
              {updateDownReason.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
