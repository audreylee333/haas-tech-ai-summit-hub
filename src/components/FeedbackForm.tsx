import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { StarRating } from "@/components/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function FeedbackForm({
  initialRating,
  initialComment,
  placeholder,
  commentLabel,
  onSubmit,
  isNew,
}: {
  initialRating?: number | undefined;
  initialComment?: string | null | undefined;
  placeholder: string;
  commentLabel?: string | undefined;
  isNew: boolean;
  onSubmit: (rating: number, comment: string | null) => Promise<void>;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [busy, setBusy] = useState(false);
  const commentId = useId();

  useEffect(() => {
    setRating(initialRating ?? 0);
    setComment(initialComment ?? "");
  }, [initialRating, initialComment]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) { toast.error("Pick a rating first"); return; }
        setBusy(true);
        try {
          await onSubmit(rating, comment.trim() ? comment.trim().slice(0, 2000) : null);
          toast.success(isNew ? "+1 raffle ticket 🎟" : "Feedback updated");
        } catch {
          toast.error("Couldn't save. Try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <StarRating value={rating} onChange={setRating} />
      <div className="space-y-2">
      {commentLabel && <label htmlFor={commentId} className="block text-sm font-medium">{commentLabel} <span className="text-muted-foreground">(optional)</span></label>}
      <Textarea
        id={commentId}
        aria-label={commentLabel ?? placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        placeholder={placeholder}
        className="min-h-24 bg-card"
      />
      </div>
      <Button type="submit" variant={isNew ? "signal" : "default"} disabled={busy} className="h-11 w-full">
        {isNew ? "Submit & earn an entry" : "Update feedback"}
      </Button>
    </form>
  );
}
