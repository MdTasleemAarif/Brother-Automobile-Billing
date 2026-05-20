"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOC_LABELS, DOC_NUM_LABELS, DocumentType } from "@/lib/types";

export function ConvertButton({
  billId,
  targetType,
  mode = "create",
  disabled = false,
}: {
  billId: string;
  targetType: DocumentType;
  mode?: "create" | "update";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      let documentNumber = "";
      let documentNumberAuto = true;

      if (mode === "create") {
        const numberRes = await fetch(`/api/document-number?type=${targetType}`);
        const numberData = await numberRes.json();
        if (!numberRes.ok) {
          throw new Error(numberData.error || "Failed to generate document number");
        }

        const promptedNumber = prompt(
          `${DOC_NUM_LABELS[targetType]} for ${DOC_LABELS[targetType]}`,
          numberData.documentNumber
        );

        if (promptedNumber === null) {
          setLoading(false);
          return;
        }

        if (!promptedNumber.trim()) {
          alert("Document number is required.");
          setLoading(false);
          return;
        }

        documentNumber = promptedNumber;
        documentNumberAuto = promptedNumber.trim() === numberData.documentNumber;
      } else if (
        !confirm(`Update existing ${DOC_LABELS[targetType]} from this document?`)
      ) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/bills/${billId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          documentNumber,
          documentNumberAuto,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to convert document");
      }

      router.push(`/bills/${data.id}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to convert document");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConvert}
      disabled={loading || disabled}
      title={disabled ? "No changes to update" : undefined}
      className="rounded-lg bg-[#f7c948] px-5 py-2 text-sm font-extrabold text-[#082342] transition hover:bg-[#f47d61] hover:text-white disabled:cursor-not-allowed disabled:bg-[#e9dec5] disabled:text-[#6d7f91]"
    >
      {loading
        ? mode === "create"
          ? "Creating..."
          : "Updating..."
        : `${mode === "create" ? "Create" : "Update"} ${DOC_LABELS[targetType]}`}
    </button>
  );
}
