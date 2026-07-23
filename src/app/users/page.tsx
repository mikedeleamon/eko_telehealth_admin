"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const GOV_ID_VARIANT = { none: "gray", pending: "orange", verified: "green", rejected: "red" } as const;
const GOV_ID_LABEL = { none: "Not submitted", pending: "Pending", verified: "Verified", rejected: "Rejected" } as const;

export default function UsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["users"], queryFn: api.users });
  const [query, setQuery] = useState("");
  // Per-row pending/error state — one shared mutation across every row in
  // the list (same class of bug fixed repeatedly across the other admin
  // pages this session).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [pendingGovIdId, setPendingGovIdId] = useState<string | null>(null);
  const [errorGovIdId, setErrorGovIdId] = useState<string | null>(null);

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) => api.updateUserStatus(id, status),
    onMutate: ({ id }) => {
      setPendingId(id);
      setErrorId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (_e, { id }) => setErrorId(id),
    onSettled: () => setPendingId(null),
  });

  const decideGovId = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "verified" | "rejected" }) => api.updateUserGovId(id, status),
    onMutate: ({ id }) => {
      setPendingGovIdId(id);
      setErrorGovIdId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (_e, { id }) => setErrorGovIdId(id),
    onSettled: () => setPendingGovIdId(null),
  });

  const filtered = (data ?? []).filter(
    (u) =>
      !query ||
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Users" subtitle="Patients and providers registered on the platform." />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className="mb-6 w-full max-w-md rounded-full border border-black/10 bg-white px-5 py-3 text-sm outline-none focus:border-accent"
      />

      {!data ? (
        <LoadingRows />
      ) : (
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/45">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Account Type</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Gov ID</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="py-3 font-medium whitespace-nowrap">{u.name}</td>
                  <td className="py-3 text-foreground/60 whitespace-nowrap">{u.email}</td>
                  <td className="py-3">
                    <Badge variant={u.accountType !== "Patient" ? "accent" : "gray"}>{u.accountType}</Badge>
                  </td>
                  <td className="py-3 text-foreground/60 whitespace-nowrap">{u.joined}</td>
                  <td className="py-3">
                    <Badge variant={u.status === "active" ? "green" : "red"}>{u.status}</Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge variant={GOV_ID_VARIANT[u.govId.status]}>{GOV_ID_LABEL[u.govId.status]}</Badge>
                      {u.govId.status === "pending" && (
                        <div className="flex items-center gap-2">
                          {u.govId.url && (
                            <a
                              href={u.govId.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline"
                            >
                              {u.govId.fileName ?? "View"}
                            </a>
                          )}
                          <button
                            onClick={() => decideGovId.mutate({ id: u.id, status: "verified" })}
                            disabled={pendingGovIdId === u.id}
                            className="text-xs font-semibold text-green hover:underline disabled:opacity-60"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => decideGovId.mutate({ id: u.id, status: "rejected" })}
                            disabled={pendingGovIdId === u.id}
                            className="text-xs font-semibold text-red hover:underline disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {errorGovIdId === u.id && <p className="text-xs text-red">Could not save — try again.</p>}
                    </div>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() =>
                        toggleStatus.mutate({ id: u.id, status: u.status === "active" ? "suspended" : "active" })
                      }
                      disabled={pendingId === u.id}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                        u.status === "active"
                          ? "bg-red/10 text-red hover:bg-red/20"
                          : "bg-green/10 text-green hover:bg-green/20"
                      }`}
                    >
                      {pendingId === u.id ? "Saving…" : u.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                    {errorId === u.id && <p className="text-xs text-red mt-1">Could not save — try again.</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}
