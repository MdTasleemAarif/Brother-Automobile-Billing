"use client";

import { useState } from "react";
import Link from "next/link";
import { DOC_LABELS } from "@/lib/types";

type Bill = {
  id: string;
  documentNumber: string | null;
  documentType: string;
  customerName: string;
  vehicleName: string;
  vehicleNo: string;
  serviceType: string | null;
  date: string | Date;
};

const TYPE_BADGE: Record<string, string> = {
  ESTIMATE: "border-[#f7c948]/70 bg-[#fff2c4] text-[#7a4a00]",
  PROFORMA: "border-[#87d8d8] bg-[#d9f3f2] text-[#087d86]",
  TAX_INVOICE: "border-[#f47d61]/60 bg-[#ffe1d8] text-[#9d351f]",
};

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Estimate", value: "ESTIMATE" },
  { label: "Proforma", value: "PROFORMA" },
  { label: "Tax Invoice", value: "TAX_INVOICE" },
];

export function BillsTable({ bills }: { bills: Bill[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = bills.filter((bill) => {
    const matchesType = typeFilter === "ALL" || bill.documentType === typeFilter;
    const matchesQuery =
      !normalizedQuery ||
      bill.vehicleNo.toLowerCase().includes(normalizedQuery) ||
      bill.vehicleName.toLowerCase().includes(normalizedQuery) ||
      bill.customerName.toLowerCase().includes(normalizedQuery) ||
      (bill.documentNumber || "").toLowerCase().includes(normalizedQuery);

    return matchesType && matchesQuery;
  });

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = typeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                    active
                      ? "border-[#0f9fa6] bg-[#0f9fa6] text-white shadow-sm"
                      : "border-[#87d8d8] bg-white/80 text-[#082342] hover:bg-[#d9f3f2]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0 lg:w-[380px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#0f9fa6]">
              /
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicle, customer, invoice"
              className="w-full rounded-lg border border-[#87d8d8] bg-white py-2.5 pl-9 pr-10 text-sm font-medium text-[#082342] shadow-inner transition focus:border-[#0f9fa6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b7eceb]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-black text-[#6d7f91] hover:bg-[#fff0d2] hover:text-[#082342]"
              >
                X
              </button>
            )}
          </div>
        </div>
        {query && (
          <p className="mt-2 pl-1 text-xs font-semibold text-[#35526f]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-10 text-center text-sm font-semibold text-[#35526f] shadow-sm">
          No bills found for this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#87d8d8] bg-[#fffaf0] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#87d8d8] bg-[#d9f3f2]">
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-[#35526f]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b border-[#d7eeee] bg-white/70 transition hover:bg-[#fff2c4]/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-black text-[#082342]">
                        {bill.documentNumber || "-"}
                      </div>
                      <div className="text-xs font-semibold text-[#6d7f91]">
                        {bill.serviceType || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
                          TYPE_BADGE[bill.documentType] || "border-[#87d8d8] bg-[#d9f3f2] text-[#082342]"
                        }`}
                      >
                        {DOC_LABELS[bill.documentType as keyof typeof DOC_LABELS] ||
                          bill.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#35526f]">
                      {bill.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="block text-left font-bold text-[#082342] hover:text-[#0f9fa6]"
                        onClick={() => setQuery(bill.vehicleNo)}
                        title="Filter by this vehicle number"
                      >
                        {bill.vehicleName}
                      </button>
                      <button
                        className="block text-left text-xs font-black text-[#0f9fa6] hover:underline"
                        onClick={() => setQuery(bill.vehicleNo)}
                        title="Filter by this vehicle number"
                      >
                        {bill.vehicleNo}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#6d7f91]">
                      {new Date(bill.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="mr-3 font-black text-[#082342] hover:text-[#0f9fa6]"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/bills/${bill.id}/pdf`}
                        download
                        className="font-black text-[#0f9fa6] hover:text-[#087d86]"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
