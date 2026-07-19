"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

export default function UsersPage() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: api.users });
  const [query, setQuery] = useState("");

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
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/45">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Account Type</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-foreground/60">{u.email}</td>
                  <td className="py-3">
                    <Badge variant={u.accountType === "Doctor" ? "accent" : "gray"}>{u.accountType}</Badge>
                  </td>
                  <td className="py-3 text-foreground/60">{u.joined}</td>
                  <td className="py-3">
                    <Badge variant={u.status === "active" ? "green" : "red"}>{u.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
