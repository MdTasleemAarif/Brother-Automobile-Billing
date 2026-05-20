import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillFormData } from "@/lib/types";
import { isDocumentNumberTaken, normalizeDocumentNumber } from "@/lib/documentNumbers";
import { normalizeGstin, validateGstin } from "@/utils/validateGstin";

function validateBillForm(body: BillFormData) {
  if (!body.customerName?.trim() || !body.vehicleNo?.trim() || !body.vehicleName?.trim()) {
    return "Customer Name, Vehicle No, and Vehicle Name are required.";
  }

  const gstinValidation = validateGstin(body.companyGstin);
  if (!gstinValidation.isValid) {
    return gstinValidation.message;
  }

  const invalidPhoneFields = [
    ["Garage Contact No", body.garageContact],
    ["Garage Alternate Contact No", body.garageAltContact],
    ["Customer Phone", body.customerPhone],
    ["Insurance Mobile No", body.companyMobile],
  ].filter(([, value]) => String(value || "").trim() && !/^\d{10}$/.test(String(value).trim()));

  if (invalidPhoneFields.length > 0) {
    return `${invalidPhoneFields[0][0]} must be exactly 10 digits.`;
  }

  if (body.gstRate < 0 || body.gstRate > 100) {
    return "GST rate must be between 0 and 100.";
  }

  const invalidPart = body.parts.some(
    (p) => p.quantity < 0 || p.unitPrice < 0 || p.payableAmount < 0 || p.gstRate < 0 || p.gstRate > 100
  );
  const invalidService = body.services.some(
    (s) => s.quantity < 0 || s.unitPrice < 0 || s.payableAmount < 0 || s.gstRate < 0 || s.gstRate > 100
  );

  if (invalidPart || invalidService) {
    return "Quantity, price, payable amount, and GST values must be valid non-negative numbers.";
  }

  return null;
}

const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        parts: { orderBy: { serialNo: "asc" } },
        services: { orderBy: { serialNo: "asc" } },
      },
    });
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(bill);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: BillFormData = await req.json();

    const existing = await prisma.bill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.documentType !== existing.documentType) {
      return NextResponse.json(
        { error: "Document type cannot be changed. Use conversion instead." },
        { status: 400 }
      );
    }

    const validationError = validateBillForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const nextDocumentNumber = body.documentNumber?.trim()
      ? normalizeDocumentNumber(body.documentNumber)
      : existing.documentNumber;
    if (
      nextDocumentNumber &&
      nextDocumentNumber !== existing.documentNumber &&
      (await isDocumentNumberTaken(prisma, nextDocumentNumber, id))
    ) {
      return NextResponse.json(
        { error: "Document number already exists. Use another number." },
        { status: 409 }
      );
    }

    const bill = await prisma.$transaction(async (tx) => {
      await tx.part.deleteMany({ where: { billId: id } });
      await tx.service.deleteMany({ where: { billId: id } });

      return tx.bill.update({
        where: { id },
        data: {
          documentType: existing.documentType,
          documentNumber: nextDocumentNumber,
          date: new Date(body.date),
          jobCardNo: body.jobCardNo || null,
          vehicleNo: body.vehicleNo,
          advisorName: body.advisorName || null,
          serviceType: body.serviceType || null,
          garageName: body.garageName,
          garageAddress: body.garageAddress,
          garageGstin: body.garageGstin,
          garageContact: body.garageContact,
          garageAltContact: body.garageAltContact || "8374042537",
          garageEmail: body.garageEmail,
          customerName: body.customerName,
          customerPhone: body.customerPhone || null,
          customerEmail: body.customerEmail || null,
          vehicleName: body.vehicleName,
          kilometer: body.kilometer ? parseInt(String(body.kilometer)) : null,
          color: body.color || null,
          fuel: body.fuel || null,
          companyName: body.companyName || null,
          companyMobile: body.companyMobile || null,
          companyAddress: body.companyAddress || null,
          companyLocation: body.companyLocation || null,
          companyCity: body.companyCity || null,
          companyState: body.companyState || null,
          companyPincode: body.companyPincode || null,
          companyGstin: normalizeGstin(body.companyGstin),
          gstRate: body.gstRate,
          parts: {
            create: body.parts.map((p, i) => ({
              serialNo: i + 1,
              name: p.name,
              description: p.description || "Part",
              hsnSac: p.hsnSac || "87081090",
              gstRate: p.gstRate,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              payableAmount:
                existing.documentType === "ESTIMATE" ? p.payableAmount : p.unitPrice,
            })),
          },
          services: {
            create: body.services.map((s, i) => ({
              serialNo: body.parts.length + i + 1,
              name: s.name,
              description: s.description || "",
              hsnSac: s.hsnSac || "998714",
              gstRate: s.gstRate,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
              payableAmount:
                existing.documentType === "ESTIMATE" ? s.payableAmount : s.unitPrice,
            })),
          },
        },
        include: {
          parts: true,
          services: true,
        },
      });
    }, TRANSACTION_OPTIONS);

    return NextResponse.json(bill);
  } catch (e: any) {
    console.error(e);
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Document number already exists. Use another number." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.bill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
