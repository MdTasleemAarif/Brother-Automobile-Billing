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
      isLocked: true,
      customerName: true,
      vehicleName: true,
      vehicleNo: true,
      serviceType: true,
      date: true,
    },
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f9fa6]">
              Billing Workspace
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#082342]">
              All Bills
            </h1>
            <p className="mt-1 text-sm font-medium text-[#35526f]">
              Filter and open Estimate, Proforma, and Tax Invoice documents from one register.
            </p>
          </div>

          <Link
            href="/bills/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#082342] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0f9fa6]"
          >
            + Create New Bill
          </Link>
        </div>
      </section>

      {bills.length === 0 ? (
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#d9f3f2] text-xl font-black text-[#0f9fa6]">
            BA
          </div>
          <h2 className="text-xl font-black text-[#082342]">No bills yet</h2>
          <p className="mt-2 text-sm font-medium text-[#35526f]">
            Start with an Estimate, then convert it to Proforma and Tax Invoice.
          </p>
          <Link
            href="/bills/new"
            className="mt-6 inline-flex rounded-lg bg-[#082342] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#0f9fa6]"
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
