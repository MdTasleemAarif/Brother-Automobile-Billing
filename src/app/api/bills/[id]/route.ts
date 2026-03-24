import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillFormData } from "@/lib/types";

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

    // Delete existing parts and services, recreate
    await prisma.part.deleteMany({ where: { billId: id } });
    await prisma.service.deleteMany({ where: { billId: id } });

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        documentType: body.documentType,
        documentNumber: body.documentNumber || null,
        date: new Date(body.date),
        jobCardNo: body.jobCardNo || null,
        vehicleNo: body.vehicleNo,
        advisorName: body.advisorName || null,
        serviceType: body.serviceType || null,
        garageName: body.garageName,
        garageAddress: body.garageAddress,
        garageGstin: body.garageGstin,
        garageContact: body.garageContact,
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
        companyGstin: body.companyGstin || null,
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
              body.documentType === "ESTIMATE" ? p.payableAmount : p.unitPrice,
          })),
        },
        services: {
          create: body.services.map((s, i) => ({
            serialNo: body.parts.length + i + 1,
            name: s.name,
            description: s.description || "Labour",
            hsnSac: s.hsnSac || "998714",
            gstRate: s.gstRate,
            quantity: s.quantity,
            unitPrice: s.unitPrice,
            payableAmount:
              body.documentType === "ESTIMATE" ? s.payableAmount : s.unitPrice,
          })),
        },
      },
      include: {
        parts: true,
        services: true,
      },
    });

    return NextResponse.json(bill);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.bill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
