import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentType } from "@/lib/types";
import {
  isDocumentNumberTaken,
  isDocumentType,
  normalizeDocumentNumber,
  reserveDocumentNumber,
} from "@/lib/documentNumbers";

const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
};

function nextAllowedType(sourceType: string): DocumentType | null {
  if (sourceType === "ESTIMATE") return "PROFORMA";
  if (sourceType === "PROFORMA") return "TAX_INVOICE";
  return null;
}

function copyBillFields(source: Awaited<ReturnType<typeof loadSourceBill>>) {
  if (!source) throw new Error("Source bill not found");

  return {
    date: source.date,
    jobCardNo: source.jobCardNo,
    vehicleNo: source.vehicleNo,
    advisorName: source.advisorName,
    serviceType: source.serviceType,
    garageName: source.garageName,
    garageAddress: source.garageAddress,
    garageGstin: source.garageGstin,
    garageContact: source.garageContact,
    garageAltContact: source.garageAltContact,
    garageEmail: source.garageEmail,
    customerName: source.customerName,
    customerPhone: source.customerPhone,
    customerEmail: source.customerEmail,
    vehicleName: source.vehicleName,
    kilometer: source.kilometer,
    color: source.color,
    fuel: source.fuel,
    companyName: source.companyName,
    companyMobile: source.companyMobile,
    companyAddress: source.companyAddress,
    companyLocation: source.companyLocation,
    companyCity: source.companyCity,
    companyState: source.companyState,
    companyPincode: source.companyPincode,
    companyGstin: source.companyGstin,
    gstRate: source.gstRate,
  };
}

function partCreateData(source: NonNullable<Awaited<ReturnType<typeof loadSourceBill>>>) {
  return source.parts.map((part, index) => {
    const unitPrice =
      source.documentType === "ESTIMATE" ? part.payableAmount : part.unitPrice;

    return {
      serialNo: index + 1,
      name: part.name,
      description: part.description || "Part",
      hsnSac: part.hsnSac || "87081090",
      gstRate: part.gstRate,
      quantity: part.quantity,
      unitPrice,
      payableAmount: unitPrice,
    };
  });
}

function serviceCreateData(source: NonNullable<Awaited<ReturnType<typeof loadSourceBill>>>) {
  return source.services.map((service, index) => {
    const unitPrice =
      source.documentType === "ESTIMATE" ? service.payableAmount : service.unitPrice;

    return {
      serialNo: source.parts.length + index + 1,
      name: service.name,
      description: service.description || "",
      hsnSac: service.hsnSac || "998714",
      gstRate: service.gstRate,
      quantity: service.quantity,
      unitPrice,
      payableAmount: unitPrice,
    };
  });
}

async function loadSourceBill(id: string) {
  return prisma.bill.findUnique({
    where: { id },
    include: {
      parts: { orderBy: { serialNo: "asc" } },
      services: { orderBy: { serialNo: "asc" } },
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const targetType = body.targetType;

    if (!isDocumentType(targetType)) {
      return NextResponse.json({ error: "Invalid target document type" }, { status: 400 });
    }

    const source = await loadSourceBill(id);
    if (!source) {
      return NextResponse.json({ error: "Source bill not found" }, { status: 404 });
    }

    const allowedType = nextAllowedType(source.documentType);
    if (targetType !== allowedType) {
      return NextResponse.json(
        { error: "Invalid document conversion sequence" },
        { status: 400 }
      );
    }

    const chainId = source.chainId || source.id;

    const result = await prisma.$transaction(async (tx) => {
      const existingTarget = await tx.bill.findFirst({
        where: {
          OR: [{ chainId }, { id: chainId }],
          documentType: targetType,
        },
        include: {
          parts: { orderBy: { serialNo: "asc" } },
          services: { orderBy: { serialNo: "asc" } },
        },
      });

      const providedNumber =
        typeof body.documentNumber === "string" && body.documentNumber.trim()
          ? normalizeDocumentNumber(body.documentNumber)
          : "";

      let documentNumber = existingTarget?.documentNumber || "";

      if (!existingTarget) {
        documentNumber =
          body.documentNumberAuto !== false || !providedNumber
            ? await reserveDocumentNumber(tx, targetType, source.date)
            : providedNumber;
      } else if (providedNumber) {
        documentNumber = providedNumber;
      }

      if (
        documentNumber &&
        (await isDocumentNumberTaken(tx, documentNumber, existingTarget?.id))
      ) {
        throw new Error("DOCUMENT_NUMBER_TAKEN");
      }

      if (existingTarget) {
        await tx.part.deleteMany({ where: { billId: existingTarget.id } });
        await tx.service.deleteMany({ where: { billId: existingTarget.id } });

        return tx.bill.update({
          where: { id: existingTarget.id },
          data: {
            ...copyBillFields(source),
            documentNumber,
            sourceBillId: source.id,
            syncedFromUpdatedAt: source.updatedAt,
            parts: { create: partCreateData(source) },
            services: { create: serviceCreateData(source) },
          },
          include: {
            parts: { orderBy: { serialNo: "asc" } },
            services: { orderBy: { serialNo: "asc" } },
          },
        });
      }

      return tx.bill.create({
        data: {
          ...copyBillFields(source),
          documentType: targetType,
          documentNumber,
          chainId,
          sourceBillId: source.id,
          syncedFromUpdatedAt: source.updatedAt,
          parts: { create: partCreateData(source) },
          services: { create: serviceCreateData(source) },
        },
        include: {
          parts: { orderBy: { serialNo: "asc" } },
          services: { orderBy: { serialNo: "asc" } },
        },
      });
    }, TRANSACTION_OPTIONS);

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof Error && e.message === "DOCUMENT_NUMBER_TAKEN") {
      return NextResponse.json(
        { error: "Document number already exists. Use another number." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to convert document" }, { status: 500 });
  }
}
