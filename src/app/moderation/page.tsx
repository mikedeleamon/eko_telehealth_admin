"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { RedactedMessage } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

/**
 * Messages the anti-disintermediation filter masked in chat.
 *
 * The original is deliberately behind a click rather than rendered inline: it
 * contains the phone number or email we just took out of a private conversation,
 * so it should be a decision to look at it, not something that scrolls past.
 */
export default function ModerationPage() {
  const { data } = useQuery({ queryKey: ["redacted-messages"], queryFn: api.redactedMessages });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const formatSent = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div>
      <PageHeader
        title="Message Moderation"
        subtitle="Chat messages where contact details were automatically masked before delivery. Participants only ever see the masked text — the original is visible here so a complaint about an off-platform approach can be investigated."
      />

      {!data ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <Card>
          <p className="text-sm text-foreground/55">No messages have been redacted.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((message: RedactedMessage) => (
            <Card key={message.id}>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-semibold">{message.senderName}</p>
                <Badge variant={message.senderAccountType !== "Patient" ? "orange" : "gray"}>
                  {message.senderAccountType}
                </Badge>
                {message.counterpartyName && (
                  <span className="text-sm text-foreground/55">with {message.counterpartyName}</span>
                )}
              </div>
              <p className="text-sm text-foreground/55 mt-1">Sent {formatSent(message.sentAt)}</p>

              <div className="mt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">Delivered</p>
                <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{message.maskedText}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-black/5">
                {revealed[message.id] ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">Original</p>
                    <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{message.originalText}</p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((prev) => ({ ...prev, [message.id]: true }))}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground underline underline-offset-4"
                  >
                    Reveal original message
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
