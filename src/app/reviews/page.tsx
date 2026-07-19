"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Review, ReviewStatus } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-orange text-sm" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-black/15">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["reviews"], queryFn: api.reviews });
  const [decisions, setDecisions] = useState<Record<string, ReviewStatus>>({});

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "published" | "removed" }) =>
      api.decideReview(id, decision),
    onSuccess: (_d, { id, decision }) => {
      setDecisions((prev) => ({ ...prev, [id]: decision }));
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const statusOf = (r: Review) => decisions[r.id] ?? r.status;

  return (
    <div>
      <PageHeader
        title="Review Moderation"
        subtitle="Ratings are two-way and admin-moderated. Watch for contact details — the platform must not leak them."
      />

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {data.map((review) => {
            const status = statusOf(review);
            return (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-64">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold">{review.author}</p>
                      <span className="text-foreground/40 text-sm">→ {review.subject}</span>
                      <Badge variant={review.direction === "patient→provider" ? "accent" : "orange"}>
                        {review.direction}
                      </Badge>
                      <Stars rating={review.rating} />
                    </div>
                    <p className="text-sm text-foreground/70 mt-2 leading-relaxed">“{review.text}”</p>
                    <p className="text-xs text-foreground/40 mt-2">Submitted {review.submittedAt}</p>
                  </div>
                  {status === "pending" ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => decide.mutate({ id: review.id, decision: "published" })}
                        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => decide.mutate({ id: review.id, decision: "removed" })}
                        className="rounded-full bg-red/10 px-5 py-2 text-sm font-semibold text-red hover:bg-red/20"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <Badge variant={status === "published" ? "green" : "red"}>{status}</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
