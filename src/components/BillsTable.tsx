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
  ESTIMATE: "bg-yellow-100 text-yellow-800",
  PROFORMA: "bg-blue-100 text-blue-800",
  TAX_INVOICE: "bg-green-100 text-green-800",
};

export function BillsTable({ bills }: { bills: Bill[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? bills.filter((b) =>
        b.vehicleNo.toLowerCase().includes(query.toLowerCase()) ||
        b.vehicleName.toLowerCase().includes(query.toLowerCase()) ||
        b.customerName.toLowerCase().includes(query.toLowerCase()) ||
        (b.documentNumber || "").toLowerCase().includes(query.toLowerCase())
      )
    : bills;

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by vehicle number, customer, or invoice no..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs text-slate-500 mt-1 pl-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No bills found matching &quot;{query}&quot;
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Document</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Vehicle</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Date</th>
                <th className="text-right px-4 py-3 text-slate-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bill) => (
                <tr
                  key={bill.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {bill.documentNumber || "—"}
                    </div>
                    <div className="text-slate-400 text-xs">{bill.serviceType || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        TYPE_BADGE[bill.documentType] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {DOC_LABELS[bill.documentType as keyof typeof DOC_LABELS] || bill.documentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{bill.customerName}</td>
                  <td className="px-4 py-3">
                    <div
                      className="text-slate-700 font-medium cursor-pointer hover:text-blue-600"
                      onClick={() => setQuery(bill.vehicleNo)}
                      title="Click to filter by this vehicle number"
                    >
                      {bill.vehicleName}
                    </div>
                    <div
                      className="text-blue-500 text-xs cursor-pointer hover:underline"
                      onClick={() => setQuery(bill.vehicleNo)}
                      title="Click to filter by this vehicle number"
                    >
                      {bill.vehicleNo}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(bill.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/bills/${bill.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                    >
                      View
                    </Link>
                    <a
                      href={`/api/bills/${bill.id}/pdf`}
                      download
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      PDF ↓
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
