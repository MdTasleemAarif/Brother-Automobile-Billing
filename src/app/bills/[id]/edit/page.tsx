import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditBillForm } from "@/components/EditBillForm";

export const dynamic = "force-dynamic";

export default async function EditBillPage({
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

  const formData = {
    documentType: bill.documentType as "ESTIMATE" | "PROFORMA" | "TAX_INVOICE",
    documentNumber: bill.documentNumber ?? "",
    date: bill.date.toISOString().split("T")[0],
    jobCardNo: bill.jobCardNo ?? "",
    vehicleNo: bill.vehicleNo,
    advisorName: bill.advisorName ?? "",
    serviceType: bill.serviceType ?? "",
    garageName: bill.garageName,
    garageAddress: bill.garageAddress,
    garageGstin: bill.garageGstin,
    garageContact: bill.garageContact,
    garageAltContact: bill.garageAltContact,
    garageEmail: bill.garageEmail,
    customerName: bill.customerName,
    customerPhone: bill.customerPhone ?? "",
    customerEmail: bill.customerEmail ?? "",
    vehicleName: bill.vehicleName,
    kilometer: bill.kilometer != null ? String(bill.kilometer) : "",
    color: bill.color ?? "",
    fuel: bill.fuel ?? "PETROL",
    companyName: bill.companyName ?? "",
    companyMobile: bill.companyMobile ?? "",
    companyAddress: bill.companyAddress ?? "",
    companyLocation: bill.companyLocation ?? "",
    companyCity: bill.companyCity ?? "",
    companyState: bill.companyState ?? "",
    companyPincode: bill.companyPincode ?? "",
    companyGstin: bill.companyGstin ?? "",
    gstRate: bill.gstRate,
    parts: bill.parts.map((p) => ({
      id: p.id,
      serialNo: p.serialNo,
      name: p.name,
      description: p.description,
      hsnSac: p.hsnSac,
      gstRate: p.gstRate,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      payableAmount: p.payableAmount,
    })),
    services: bill.services.map((s) => ({
      id: s.id,
      serialNo: s.serialNo,
      name: s.name,
      description: s.description,
      hsnSac: s.hsnSac,
      gstRate: s.gstRate,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      payableAmount: s.payableAmount,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f9fa6]">
          Document Editor
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#082342]">
          Edit Bill
        </h1>
        <p className="mt-1 text-sm font-medium text-[#35526f]">
          Editing:{" "}
          <span className="font-bold text-[#082342]">
            {bill.documentNumber || bill.id.slice(0, 8)}
          </span>{" "}
          | {bill.vehicleNo} | {bill.customerName}
        </p>
      </div>
      <EditBillForm billId={id} initialData={formData} />
    </div>
  );
}
