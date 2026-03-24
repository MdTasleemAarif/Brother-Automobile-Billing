import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DOC_LABELS, DOC_NUM_LABELS } from "@/lib/types";
import { DeleteButton } from "@/components/DeleteButton";
import {
  calcGrandTotals,
  calcPartsTotals,
  calcServicesTotals,
  fmt,
  getPartTaxable,
  getServiceTaxable,
} from "@/lib/calculations";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      parts: { orderBy: { serialNo: "asc" } },
      services: { orderBy: { serialNo: "asc" } },
    },
  });

  if (!bill) return notFound();

  const docType = bill.documentType as "ESTIMATE" | "PROFORMA" | "TAX_INVOICE";
  const isEstimate = docType === "ESTIMATE";

  const partTotals = calcPartsTotals(bill.parts as never, docType);
  const svcTotals = calcServicesTotals(bill.services as never, docType);
  const grand = calcGrandTotals(
    bill.parts as never,
    bill.services as never,
    docType,
    bill.gstRate
  );

  const dateStr = new Date(bill.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Link href="/" className="hover:text-blue-600">
              ← All Bills
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {DOC_LABELS[docType]} — {bill.documentNumber || "No Number"}
          </h1>
          <p className="text-slate-500 text-sm">
            {dateStr} · {bill.vehicleNo} · {bill.customerName}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/bills/${bill.id}/pdf`}
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition text-sm flex items-center gap-2"
          >
            ⬇ Download PDF
          </a>
          <Link
            href={`/bills/${bill.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition text-sm"
          >
            ✏ Edit
          </Link>
          <DeleteButton billId={bill.id} />
        </div>
      </div>

      {/* Bill preview card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Document Type</span>
            <p className="font-semibold text-slate-800">{DOC_LABELS[docType]}</p>
          </div>
          <div>
            <span className="text-slate-500">{DOC_NUM_LABELS[docType]}</span>
            <p className="font-semibold">{bill.documentNumber || "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Date</span>
            <p className="font-semibold">{dateStr}</p>
          </div>
          <div>
            <span className="text-slate-500">Service Type</span>
            <p className="font-semibold">{bill.serviceType || "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Vehicle No</span>
            <p className="font-semibold">{bill.vehicleNo}</p>
          </div>
          <div>
            <span className="text-slate-500">Advisor</span>
            <p className="font-semibold">{bill.advisorName || "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Customer</span>
            <p className="font-semibold">{bill.customerName}</p>
          </div>
          <div>
            <span className="text-slate-500">Vehicle</span>
            <p className="font-semibold">{bill.vehicleName}</p>
          </div>
          <div>
            <span className="text-slate-500">GST Rate</span>
            <p className="font-semibold">{bill.gstRate}%</p>
          </div>
        </div>

        {/* Parts */}
        {bill.parts.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              Parts ({bill.parts.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold">
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-3 py-2 text-left">Part Name</th>
                    <th className="px-3 py-2 text-center">Description</th>
                    <th className="px-3 py-2 text-center">HSN/SAC</th>
                    <th className="px-3 py-2 text-center">GST%</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    {isEstimate && (
                      <th className="px-3 py-2 text-right">Payable Amt</th>
                    )}
                    <th className="px-3 py-2 text-right">Taxable</th>
                    <th className="px-3 py-2 text-right">Parts Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.parts.map((p, i) => {
                    const taxable = getPartTaxable(p as never, docType);
                    const rowTotal = taxable * (1 + p.gstRate / 100);
                    return (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-center text-slate-500">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {p.description}
                        </td>
                        <td className="px-3 py-2 text-center">{p.hsnSac}</td>
                        <td className="px-3 py-2 text-center">{p.gstRate}</td>
                        <td className="px-3 py-2 text-center">{p.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {fmt(p.unitPrice)}
                        </td>
                        {isEstimate && (
                          <td className="px-3 py-2 text-right">
                            {fmt(p.payableAmount)}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right text-slate-600">
                          {fmt(taxable)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {fmt(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                    <td
                      colSpan={isEstimate ? 8 : 7}
                      className="px-3 py-2 text-right"
                    >
                      Parts Taxable: ₹{fmt(partTotals.taxable)} | GST: ₹
                      {fmt(partTotals.gst)}
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-right text-blue-700">
                      Total: ₹{fmt(partTotals.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services */}
        {bill.services.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              Labour / Services ({bill.services.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold">
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-3 py-2 text-left">Service</th>
                    <th className="px-3 py-2 text-center">Description</th>
                    <th className="px-3 py-2 text-center">HSN/SAC</th>
                    <th className="px-3 py-2 text-center">GST%</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    {isEstimate && (
                      <th className="px-3 py-2 text-right">Payable Amt</th>
                    )}
                    <th className="px-3 py-2 text-right">Taxable</th>
                    <th className="px-3 py-2 text-right">Labour Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.services.map((sv, i) => {
                    const taxable = getServiceTaxable(sv as never, docType);
                    const rowTotal = taxable * (1 + sv.gstRate / 100);
                    return (
                      <tr key={sv.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-center text-slate-500">
                          {bill.parts.length + i + 1}
                        </td>
                        <td className="px-3 py-2 font-medium">{sv.name}</td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {sv.description}
                        </td>
                        <td className="px-3 py-2 text-center">{sv.hsnSac}</td>
                        <td className="px-3 py-2 text-center">{sv.gstRate}</td>
                        <td className="px-3 py-2 text-center">{sv.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {fmt(sv.unitPrice)}
                        </td>
                        {isEstimate && (
                          <td className="px-3 py-2 text-right">
                            {fmt(sv.payableAmount)}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right text-slate-600">
                          {fmt(taxable)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {fmt(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                    <td
                      colSpan={isEstimate ? 8 : 7}
                      className="px-3 py-2 text-right"
                    >
                      Labour Taxable: ₹{fmt(svcTotals.taxable)} | GST: ₹
                      {fmt(svcTotals.gst)}
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-right text-blue-700">
                      Total: ₹{fmt(svcTotals.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Parts Total (Taxable)</span>
                <span className="font-medium">₹ {fmt(grand.partsTaxable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Labour Total (Taxable)</span>
                <span className="font-medium">₹ {fmt(grand.labourTaxable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  CGST ({bill.gstRate / 2}%)
                </span>
                <span className="font-medium">₹ {fmt(grand.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  SGST ({bill.gstRate / 2}%)
                </span>
                <span className="font-medium">₹ {fmt(grand.sgst)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-600 font-semibold">GST Total</span>
                <span className="font-semibold">₹ {fmt(grand.totalGst)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-blue-700">
                <span>Grand Total</span>
                <span>₹ {fmt(grand.grandTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700">
                <span>Round Off</span>
                <span>₹ {fmt(grand.roundOff)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

