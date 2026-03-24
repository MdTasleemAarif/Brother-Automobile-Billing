import { PartRow, ServiceRow, DocumentType } from "./types";

/** For estimate: taxable = payableAmount × quantity; others: unitPrice × quantity */
export function getPartTaxable(
  part: PartRow,
  docType: DocumentType
): number {
  if (docType === "ESTIMATE") {
    return part.payableAmount * part.quantity;
  }
  return part.unitPrice * part.quantity;
}

export function getServiceTaxable(
  service: ServiceRow,
  docType: DocumentType
): number {
  if (docType === "ESTIMATE") {
    return service.payableAmount * service.quantity;
  }
  return service.unitPrice * service.quantity;
}

/** Row total including GST */
export function getRowTotal(taxable: number, gstRate: number): number {
  return taxable * (1 + gstRate / 100);
}

export interface SectionTotals {
  taxable: number;
  gst: number;
  total: number;
}

export function calcPartsTotals(
  parts: PartRow[],
  docType: DocumentType
): SectionTotals {
  const taxable = parts.reduce(
    (sum, p) => sum + getPartTaxable(p, docType),
    0
  );
  const gst = parts.reduce(
    (sum, p) => sum + getPartTaxable(p, docType) * (p.gstRate / 100),
    0
  );
  return { taxable, gst, total: taxable + gst };
}

export function calcServicesTotals(
  services: ServiceRow[],
  docType: DocumentType
): SectionTotals {
  const taxable = services.reduce(
    (sum, s) => sum + getServiceTaxable(s, docType),
    0
  );
  const gst = services.reduce(
    (sum, s) => sum + getServiceTaxable(s, docType) * (s.gstRate / 100),
    0
  );
  return { taxable, gst, total: taxable + gst };
}

export interface GrandTotals {
  partsTaxable: number;
  labourTaxable: number;
  totalTaxable: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  grandTotal: number;
  roundOff: number;
}

export function calcGrandTotals(
  parts: PartRow[],
  services: ServiceRow[],
  docType: DocumentType,
  gstRate: number
): GrandTotals {
  const partsTotals = calcPartsTotals(parts, docType);
  const servicesTotals = calcServicesTotals(services, docType);
  const totalTaxable = partsTotals.taxable + servicesTotals.taxable;
  const cgst = totalTaxable * (gstRate / 2 / 100);
  const sgst = cgst;
  const totalGst = cgst + sgst;
  const grandTotal = totalTaxable + totalGst;
  const roundOff = Math.round(grandTotal);
  return {
    partsTaxable: partsTotals.taxable,
    labourTaxable: servicesTotals.taxable,
    totalTaxable,
    cgst,
    sgst,
    totalGst,
    grandTotal,
    roundOff,
  };
}

export const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtRound = (n: number) =>
  Math.round(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
