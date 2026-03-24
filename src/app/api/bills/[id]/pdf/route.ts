import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { BillPdf } from "@/lib/pdf/BillPdf";
import { createElement } from "react";
import fs from "fs";
import path from "path";

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

    if (!bill) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Try to load logo from public folder
    let logoBase64: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "BA-logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = logoBuffer.toString("base64");
      }
    } catch {
      // No logo — will render placeholder
    }

    const element = createElement(BillPdf, {
      bill: bill as never,
      logoBase64,
    });

    const buffer = await renderToBuffer(element as any);

    const docLabel =
      bill.documentType === "ESTIMATE"
        ? "Estimate"
        : bill.documentType === "PROFORMA"
        ? "Proforma_Invoice"
        : "Tax_Invoice";

    const filename = `${docLabel}_${bill.vehicleNo}_${bill.id.slice(0, 8)}.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF", detail: String(e) },
      { status: 500 }
    );
  }
}
