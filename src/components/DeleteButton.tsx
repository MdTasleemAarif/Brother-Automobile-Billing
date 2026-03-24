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
        alert("Failed to delete bill");
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
      className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg transition text-sm disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "🗑 Delete"}
    </button>
  );
}
