"use client";

import { useMemo } from "react";

function normalizeIndianWhatsAppNumber(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;

  return "";
}

export function WhatsAppShareButton({
  billId,
  customerPhone,
  customerName,
  documentLabel,
  documentNumber,
  vehicleNo,
  shareToken,
}: {
  billId: string;
  customerPhone: string | null;
  customerName: string;
  documentLabel: string;
  documentNumber: string | null;
  vehicleNo: string;
  shareToken: string;
}) {
  const whatsappNumber = useMemo(
    () => normalizeIndianWhatsAppNumber(customerPhone),
    [customerPhone]
  );
  const disabled = !whatsappNumber || !shareToken;

  const shareOnWhatsApp = () => {
    if (disabled) {
      alert(
        !customerPhone
          ? "Customer phone number is not available."
          : "Customer phone number must be a valid Indian WhatsApp number."
      );
      return;
    }

    const pdfUrl = `${window.location.origin}/api/share/bills/${billId}/pdf?token=${encodeURIComponent(
      shareToken
    )}`;
    const message = [
      `Hello ${customerName},`,
      `Please download your ${documentLabel}${
        documentNumber ? ` (${documentNumber})` : ""
      } for vehicle ${vehicleNo}.`,
      pdfUrl,
    ].join("\n\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={shareOnWhatsApp}
      disabled={disabled}
      aria-label={
        disabled
          ? "Add a valid customer phone number before sharing"
          : `Send ${documentLabel} link to customer WhatsApp`
      }
      title={
        disabled
          ? "Add a valid customer phone number before sharing"
          : `Send ${documentLabel} link to customer`
      }
      className="group inline-grid h-10 w-10 place-items-center rounded-lg bg-[#25d366] text-white shadow-sm ring-1 ring-[#1fb857]/30 transition hover:-translate-y-0.5 hover:bg-[#1fb857] hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#d9eadf] disabled:text-[#6d7f91] disabled:shadow-none"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-5 w-5 transition group-hover:scale-110"
        fill="currentColor"
      >
        <path d="M16.01 3.2c-7.05 0-12.78 5.62-12.78 12.54 0 2.21.59 4.37 1.7 6.27L3.13 28.8l6.99-1.79a13.05 13.05 0 0 0 5.89 1.42c7.05 0 12.78-5.62 12.78-12.54S23.06 3.2 16.01 3.2Zm0 22.99c-1.88 0-3.72-.5-5.33-1.45l-.38-.22-4.15 1.06 1.1-4.01-.25-.41a10.18 10.18 0 0 1-1.53-5.42c0-5.68 4.73-10.3 10.54-10.3s10.54 4.62 10.54 10.3-4.73 10.45-10.54 10.45Zm5.77-7.72c-.32-.16-1.88-.91-2.17-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1.01 1.22-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.54-.94-.83-1.58-1.86-1.77-2.17-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.18.21-.31.32-.52.11-.21.05-.4-.03-.56-.08-.16-.71-1.68-.98-2.3-.26-.6-.52-.52-.71-.53h-.61c-.21 0-.56.08-.85.4-.29.31-1.12 1.07-1.12 2.62s1.15 3.04 1.31 3.25c.16.21 2.26 3.39 5.47 4.75.76.32 1.36.51 1.83.66.77.24 1.47.21 2.02.13.62-.09 1.88-.75 2.15-1.48.26-.73.26-1.36.18-1.48-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </button>
  );
}
