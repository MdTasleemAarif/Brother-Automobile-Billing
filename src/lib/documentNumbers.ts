import { Prisma, PrismaClient } from "@prisma/client";
import { DocumentType } from "./types";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const PREFIX: Record<DocumentType, string> = {
  ESTIMATE: "EST",
  PROFORMA: "PI",
  TAX_INVOICE: "INV",
};

export function isDocumentType(value: unknown): value is DocumentType {
  return value === "ESTIMATE" || value === "PROFORMA" || value === "TAX_INVOICE";
}

export function normalizeDocumentNumber(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function getDocumentYear(date = new Date()) {
  return date.getFullYear();
}

function formatDocumentNumber(documentType: DocumentType, year: number, number: number) {
  return `${PREFIX[documentType]}-${year}-${String(number).padStart(4, "0")}`;
}

export async function peekNextDocumentNumber(
  db: PrismaExecutor,
  documentType: DocumentType,
  date = new Date()
) {
  const year = getDocumentYear(date);
  const sequence = await db.documentSequence.findUnique({
    where: { documentType_year: { documentType, year } },
  });

  return formatDocumentNumber(documentType, year, (sequence?.lastNumber || 0) + 1);
}

export async function reserveDocumentNumber(
  db: PrismaExecutor,
  documentType: DocumentType,
  date = new Date()
) {
  const year = getDocumentYear(date);
  const sequence = await db.documentSequence.upsert({
    where: { documentType_year: { documentType, year } },
    update: { lastNumber: { increment: 1 } },
    create: { documentType, year, lastNumber: 1 },
  });

  return formatDocumentNumber(documentType, year, sequence.lastNumber);
}

export async function isDocumentNumberTaken(
  db: PrismaExecutor,
  documentNumber: string,
  excludeBillId?: string
) {
  const normalized = normalizeDocumentNumber(documentNumber);
  const existing = await db.bill.findFirst({
    where: {
      documentNumber: normalized,
      ...(excludeBillId ? { NOT: { id: excludeBillId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
}
