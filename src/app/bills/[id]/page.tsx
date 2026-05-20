import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DOC_LABELS, DOC_NUM_LABELS } from "@/lib/types";
import { DeleteButton } from "@/components/DeleteButton";
import { ConvertButton } from "@/components/ConvertButton";
import {
  calcGrandTotals,
  calcPartsTotals,
  calcServicesTotals,
  fmt,
  getPartTaxable,
  getServiceTaxable,
} from "@/lib/calculations";

export const dynamic = "force-dynamic";

function InfoItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-lg border border-[#87d8d8] bg-white/75 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-[#6d7f91]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#082342]">
        {value || "-"}
      </p>
    </div>
  );
}

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
  const chainId = bill.chainId || bill.id;
  const chainDocs = await prisma.bill.findMany({
    where: {
      OR: [{ chainId }, { id: chainId }],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      syncedFromUpdatedAt: true,
      updatedAt: true,
    },
  });

  const proformaDoc = chainDocs.find((doc) => doc.documentType === "PROFORMA");
  const taxInvoiceDoc = chainDocs.find((doc) => doc.documentType === "TAX_INVOICE");
  const hasProforma = Boolean(proformaDoc);
  const hasTaxInvoice = Boolean(taxInvoiceDoc);
  const proformaNeedsSync =
    !proformaDoc?.syncedFromUpdatedAt ||
    proformaDoc.syncedFromUpdatedAt.getTime() < bill.updatedAt.getTime();
  const taxInvoiceNeedsSync =
    !taxInvoiceDoc?.syncedFromUpdatedAt ||
    taxInvoiceDoc.syncedFromUpdatedAt.getTime() < bill.updatedAt.getTime();
  const canSyncProforma = docType === "ESTIMATE";
  const canSyncTaxInvoice = docType === "PROFORMA";

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
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-[#35526f] hover:text-[#0f9fa6]"
            >
              Back to all bills
            </Link>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-[#0f9fa6]">
              {DOC_LABELS[docType]}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#082342]">
              {bill.documentNumber || "No Number"}
            </h1>
            <p className="mt-1 text-sm font-medium text-[#35526f]">
              {dateStr} | {bill.vehicleNo} | {bill.customerName}
            </p>
          </div>

          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            {canSyncProforma && (
              <ConvertButton
                billId={bill.id}
                targetType="PROFORMA"
                mode={hasProforma ? "update" : "create"}
                disabled={hasProforma && !proformaNeedsSync}
              />
            )}
            {canSyncTaxInvoice && (
              <ConvertButton
                billId={bill.id}
                targetType="TAX_INVOICE"
                mode={hasTaxInvoice ? "update" : "create"}
                disabled={hasTaxInvoice && !taxInvoiceNeedsSync}
              />
            )}
            <a
              href={`/api/bills/${bill.id}/pdf`}
              download
              className="rounded-lg bg-[#0f9fa6] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#087d86]"
            >
              Download PDF
            </a>
            <Link
              href={`/bills/${bill.id}/edit`}
              className="rounded-lg bg-[#082342] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#0f9fa6]"
            >
              Edit
            </Link>
            <DeleteButton billId={bill.id} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#082342]">Document Chain</h2>
            <p className="text-xs font-semibold text-[#35526f]">
              Estimate, Proforma, and Tax Invoice for the same billing chain.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {chainDocs.map((doc) => {
            const label =
              DOC_LABELS[doc.documentType as keyof typeof DOC_LABELS] ||
              doc.documentType;
            const isCurrent = doc.id === bill.id;
            const className = `rounded-lg border px-3 py-2 text-sm font-black transition ${
              isCurrent
                ? "border-[#87d8d8] bg-[#d9f3f2] text-[#087d86]"
                : "border-[#87d8d8] bg-white/80 text-[#082342] hover:bg-[#fff2c4]"
            }`;

            if (isCurrent) {
              return (
                <span key={doc.id} className={className} aria-current="page">
                  {label}: {doc.documentNumber || "No Number"}
                </span>
              );
            }

            return (
              <Link key={doc.id} href={`/bills/${doc.id}`} className={className}>
                {label}: {doc.documentNumber || "No Number"}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <h2 className="mb-4 text-base font-black text-[#082342]">Bill Details</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <InfoItem label="Document Type" value={DOC_LABELS[docType]} />
          <InfoItem label={DOC_NUM_LABELS[docType]} value={bill.documentNumber} />
          <InfoItem label="Date" value={dateStr} />
          <InfoItem label="Service Type" value={bill.serviceType} />
          <InfoItem label="Vehicle No" value={bill.vehicleNo} />
          <InfoItem label="Advisor" value={bill.advisorName} />
          <InfoItem label="Customer" value={bill.customerName} />
          <InfoItem label="Vehicle" value={bill.vehicleName} />
          <InfoItem label="GST Rate" value={`${bill.gstRate}%`} />
        </div>
      </section>

      {bill.parts.length > 0 && (
        <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-black text-[#082342]">
            Parts / Spare Parts ({bill.parts.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[#87d8d8]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#87d8d8] bg-[#d9f3f2] text-[#35526f]">
                  <th className="px-3 py-2 text-center font-black">#</th>
                  <th className="px-3 py-2 text-left font-black">Part Name</th>
                  <th className="px-3 py-2 text-center font-black">Description</th>
                  <th className="px-3 py-2 text-center font-black">HSN/SAC</th>
                  <th className="px-3 py-2 text-center font-black">GST%</th>
                  <th className="px-3 py-2 text-center font-black">Qty</th>
                  <th className="px-3 py-2 text-right font-black">Unit Price</th>
                  {isEstimate && (
                    <th className="px-3 py-2 text-right font-black">Payable Amt</th>
                  )}
                  <th className="px-3 py-2 text-right font-black">Taxable</th>
                  <th className="px-3 py-2 text-right font-black">Parts Total (MRP)</th>
                </tr>
              </thead>
              <tbody>
                {bill.parts.map((p, i) => {
                  const taxable = getPartTaxable(p as never, docType);
                  const rowTotal = taxable * (1 + p.gstRate / 100);
                  return (
                    <tr key={p.id} className="border-b border-[#d7eeee] bg-white/70 hover:bg-[#fff2c4]/60">
                      <td className="px-3 py-2 text-center text-slate-500">{i + 1}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{p.name}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{p.description}</td>
                      <td className="px-3 py-2 text-center">{p.hsnSac}</td>
                      <td className="px-3 py-2 text-center">{p.gstRate}</td>
                      <td className="px-3 py-2 text-center">{p.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmt(p.unitPrice)}</td>
                      {isEstimate && (
                        <td className="px-3 py-2 text-right">{fmt(p.payableAmount)}</td>
                      )}
                      <td className="px-3 py-2 text-right text-slate-600">{fmt(taxable)}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-950">
                        {fmt(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-black">
                  <td colSpan={isEstimate ? 8 : 7} className="px-3 py-2 text-right">
                    Parts Taxable: Rs. {fmt(partTotals.taxable)} | GST: Rs. {fmt(partTotals.gst)}
                  </td>
                  <td colSpan={2} className="px-3 py-2 text-right text-[#0f9fa6]">
                    Total: Rs. {fmt(partTotals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {bill.services.length > 0 && (
        <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-black text-[#082342]">
            Labour / Services ({bill.services.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[#87d8d8]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#87d8d8] bg-[#d9f3f2] text-[#35526f]">
                  <th className="px-3 py-2 text-center font-black">#</th>
                  <th className="px-3 py-2 text-left font-black">Service</th>
                  <th className="px-3 py-2 text-center font-black">Description</th>
                  <th className="px-3 py-2 text-center font-black">HSN/SAC</th>
                  <th className="px-3 py-2 text-center font-black">GST%</th>
                  <th className="px-3 py-2 text-center font-black">Qty</th>
                  <th className="px-3 py-2 text-right font-black">Unit Price</th>
                  {isEstimate && (
                    <th className="px-3 py-2 text-right font-black">Payable Amt</th>
                  )}
                  <th className="px-3 py-2 text-right font-black">Taxable</th>
                  <th className="px-3 py-2 text-right font-black">Labour Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.services.map((sv, i) => {
                  const taxable = getServiceTaxable(sv as never, docType);
                  const rowTotal = taxable * (1 + sv.gstRate / 100);
                  return (
                    <tr key={sv.id} className="border-b border-[#d7eeee] bg-white/70 hover:bg-[#fff2c4]/60">
                      <td className="px-3 py-2 text-center text-slate-500">
                        {bill.parts.length + i + 1}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">{sv.name}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{sv.description}</td>
                      <td className="px-3 py-2 text-center">{sv.hsnSac}</td>
                      <td className="px-3 py-2 text-center">{sv.gstRate}</td>
                      <td className="px-3 py-2 text-center">{sv.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmt(sv.unitPrice)}</td>
                      {isEstimate && (
                        <td className="px-3 py-2 text-right">{fmt(sv.payableAmount)}</td>
                      )}
                      <td className="px-3 py-2 text-right text-slate-600">{fmt(taxable)}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-950">
                        {fmt(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-black">
                  <td colSpan={isEstimate ? 8 : 7} className="px-3 py-2 text-right">
                    Labour Taxable: Rs. {fmt(svcTotals.taxable)} | GST: Rs. {fmt(svcTotals.gst)}
                  </td>
                  <td colSpan={2} className="px-3 py-2 text-right text-[#0f9fa6]">
                    Total: Rs. {fmt(svcTotals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            {[
              ["Parts Total (Taxable)", grand.partsTaxable],
              ["Labour Total (Taxable)", grand.labourTaxable],
              [`CGST (${bill.gstRate / 2}%)`, grand.cgst],
              [`SGST (${bill.gstRate / 2}%)`, grand.sgst],
              ["GST Total", grand.totalGst],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">{label}</span>
                <span className="font-black text-slate-800">Rs. {fmt(Number(value))}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between gap-4 rounded-lg bg-[#082342] px-4 py-3 text-base font-black text-white">
              <span>Grand Total</span>
              <span>Rs. {fmt(grand.grandTotal)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
