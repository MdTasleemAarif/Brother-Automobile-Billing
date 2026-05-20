import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDocumentType, peekNextDocumentNumber } from "@/lib/documentNumbers";

export async function GET(req: NextRequest) {
  const documentType = req.nextUrl.searchParams.get("type");

  if (!isDocumentType(documentType)) {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }

  const documentNumber = await peekNextDocumentNumber(prisma, documentType);
  return NextResponse.json({ documentNumber });
}
