import { NextRequest, NextResponse } from "next/server";
import { createBillPdfResponse } from "@/lib/pdf/billPdfResponse";
import { verifyBillPdfShareToken } from "@/lib/shareTokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("token");

    if (!verifyBillPdfShareToken(id, token)) {
      return NextResponse.json({ error: "Invalid or expired PDF link" }, { status: 403 });
    }

    return await createBillPdfResponse(id);
  } catch (e) {
    console.error("Shared PDF generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF", detail: String(e) },
      { status: 500 }
    );
  }
}
