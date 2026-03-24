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

  // Map DB model to BillFormData shape
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Bill</h1>
        <p className="text-slate-500 text-sm mt-1">
          Editing:{" "}
          <span className="font-medium">
            {bill.documentNumber || bill.id.slice(0, 8)}
          </span>{" "}
          · {bill.vehicleNo} · {bill.customerName}
        </p>
      </div>
      <EditBillForm billId={id} initialData={formData} />
    </div>
  );
}
