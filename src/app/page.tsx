import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DOC_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_BADGE: Record<string, string> = {
  ESTIMATE: "bg-yellow-100 text-yellow-800",
  PROFORMA: "bg-blue-100 text-blue-800",
  TAX_INVOICE: "bg-green-100 text-green-800",
};

export default async function HomePage() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      parts: true,
      services: true,
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Bills</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {bills.length} document{bills.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/bills/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
        >
          + Create New Bill
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            No bills yet
          </h2>
          <p className="text-slate-500 mb-6">
            Create your first Estimate, Proforma Invoice, or Tax Invoice.
          </p>
          <Link
            href="/bills/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Create First Bill
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Document
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-slate-600 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {bill.documentNumber || "—"}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {bill.serviceType || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        TYPE_BADGE[bill.documentType] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {DOC_LABELS[bill.documentType as keyof typeof DOC_LABELS] ||
                        bill.documentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {bill.customerName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{bill.vehicleName}</div>
                    <div className="text-slate-400 text-xs">
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
                      target="_blank"
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
    </div>
  );
}
