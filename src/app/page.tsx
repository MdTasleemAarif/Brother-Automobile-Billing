import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BillsTable } from "@/components/BillsTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      documentNumber: true,
      documentType: true,
      customerName: true,
      vehicleName: true,
      vehicleNo: true,
      serviceType: true,
      date: true,
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
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No bills yet</h2>
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
        <BillsTable bills={bills.map((b) => ({ ...b, date: b.date.toISOString() }))} />
      )}
    </div>
  );
}
