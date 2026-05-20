"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this bill? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to delete bill");
        setDeleting(false);
      }
    } catch {
      alert("Failed to delete bill");
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-[#f47d61]/50 bg-[#ffe1d8] px-4 py-2 text-sm font-extrabold text-[#9d351f] transition hover:bg-[#f47d61] hover:text-white disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
