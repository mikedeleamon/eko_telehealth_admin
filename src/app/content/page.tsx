"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ContentBlock } from "@/lib/types";
import { Card, LoadingRows, PageHeader } from "@/components/ui";

const fieldClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function ContentPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["content"], queryFn: api.content });
  // Edits in progress, keyed by block — the fetched list is the source of
  // truth until a field is actually touched.
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);
  // One mutation instance serves every row, so pending/error state has to be
  // tracked per-key explicitly — otherwise a failed save on one block shows
  // its error on every block's card, and every Save button shows "Saving…"
  // while any single row's request is in flight.
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: ({ key, input }: { key: string; input: { title?: string; body?: string } }) => api.updateContent(key, input),
    onMutate: ({ key }) => {
      setPendingKey(key);
      setErrorKey(null);
    },
    onSuccess: (_d, { key }) => {
      qc.invalidateQueries({ queryKey: ["content"] });
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000);
    },
    onError: (_e, { key }) => setErrorKey(key),
    onSettled: () => setPendingKey(null),
  });

  const draftOf = (block: ContentBlock) => drafts[block.key] ?? { title: block.title, body: block.body };
  const setDraft = (key: string, patch: Partial<{ title: string; body: string }>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...draftOfKey(prev, key, data), ...patch } }));

  function draftOfKey(
    d: Record<string, { title: string; body: string }>,
    key: string,
    blocks: ContentBlock[] | undefined,
  ) {
    if (d[key]) return d[key];
    const block = blocks?.find((b) => b.key === key);
    return { title: block?.title ?? "", body: block?.body ?? "" };
  }

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Edit the prose the app shows on About Us, Terms of Service, and Privacy Policy — no developer needed for a text change."
      />

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {data.map((block) => {
            const draft = draftOf(block);
            const dirty = draft.title !== block.title || draft.body !== block.body;
            return (
              <Card key={block.key}>
                <p className="text-xs font-mono text-foreground/40 mb-3">{block.key}</p>
                <label className="block mb-3">
                  <span className="text-sm font-medium text-foreground/70">Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft(block.key, { title: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground/70">Body</span>
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft(block.key, { body: e.target.value })}
                    rows={4}
                    className={fieldClass}
                  />
                </label>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => update.mutate({ key: block.key, input: draft })}
                    disabled={!dirty || pendingKey === block.key}
                    className="rounded-full bg-accent text-white font-semibold px-5 py-2 text-sm shadow-lg shadow-accent/30 transition-opacity disabled:opacity-40"
                  >
                    {pendingKey === block.key ? "Saving…" : "Save"}
                  </button>
                  {savedKey === block.key && <span className="text-sm text-green font-medium">Saved</span>}
                  {errorKey === block.key && <span className="text-sm text-red font-medium">Could not save — try again.</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
