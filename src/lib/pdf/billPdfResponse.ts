/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { BillPdf } from "@/lib/pdf/BillPdf";

export async function createBillPdfResponse(id: string) {
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

  let logoBase64: string | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "BA-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = logoBuffer.toString("base64");
    }
  } catch {
    // PDF renders a placeholder when the logo cannot be loaded.
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
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
