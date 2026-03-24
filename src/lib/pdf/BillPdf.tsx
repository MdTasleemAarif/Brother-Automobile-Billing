/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { BillWithItems } from "../types";
import {
  getPartTaxable,
  getServiceTaxable,
  calcPartsTotals,
  calcServicesTotals,
  calcGrandTotals,
  fmt,
} from "../calculations";
import { numberToWords } from "../numberToWords";

// Register Noto Sans (all subset - includes ₹ symbol) as secondary font
Font.register({
  family: "NotoSans",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.6/files/noto-sans-all-400-normal.woff", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.6/files/noto-sans-all-700-normal.woff", fontWeight: 700 },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.6/files/noto-sans-all-400-normal.woff", fontWeight: 400, fontStyle: "italic" as const },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.6/files/noto-sans-all-700-normal.woff", fontWeight: 700, fontStyle: "italic" as const },
  ],
});
Font.registerHyphenationCallback((word: string) => [word]);

// Helper: renders the ₹ symbol using NotoSans (Helvetica doesn't support it)
function Rupee() {
  return <Text style={{ fontFamily: "NotoSans" }}>{"\u20B9"}</Text>;
}

const C = {
  border: "#000000",
  headerBg: "#e8e8e8",
  subBg: "#f4f4f4",
  text: "#000000",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: C.text,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 28,
    paddingRight: 28,
    lineHeight: 1.3,
  },
  // ─── HEADER ──────────────────────────────────────────────────────────
  headerWrap: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  logo: { width: 46, height: 46 },
  logoPlaceholder: {
    width: 46,
    height: 46,
    backgroundColor: "#ddd",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 13, textAlign: "center", marginBottom: 6 },
  h2: { fontSize: 7.5, textAlign: "center", lineHeight: 1.5 },
  docTypeLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 5,
    marginTop: 1,
  },
  // ─── INFO BLOCK ───────────────────────────────────────────────────────
  infoBlock: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 5,
  },
  infoLeft: {
    width: "44%",
    borderRightWidth: 1,
    borderRightColor: C.border,
    padding: 4,
  },
  infoRight: { flex: 1 },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 14,
  },
  infoRowLast: { flexDirection: "row", minHeight: 14 },
  infoCell: {
    flex: 1,
    padding: "2 4",
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  infoCellLast: { flex: 1, padding: "2 4" },
  infoFullCell: {
    flex: 1,
    padding: "2 4",
    borderBottomWidth: 0,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  separatorLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    backgroundColor: C.headerBg,
    padding: "3 6",
    marginBottom: 0,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
  },
  // ─── TABLES ───────────────────────────────────────────────────────────
  tableWrap: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.border,
    marginBottom: 1,
  },
  tHdr: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 13,
  },
  tCell: {
    padding: "1.5 2.5",
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: "center",
  },
  tCellLast: { padding: "1.5 2.5", justifyContent: "center" },
  tHdrText: { fontFamily: "Helvetica-Bold", fontSize: 6.5, textAlign: "center" },
  tValText: { fontSize: 7, textAlign: "right" },
  tNameText: { fontSize: 7 },
  // ─── SUBTOTAL BOX ─────────────────────────────────────────────────────
  subBox: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  subRow: { flexDirection: "row", minHeight: 13, alignItems: "center" },
  subLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    width: 110,
    textAlign: "right",
    paddingRight: 6,
  },
  subVal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    width: 85,
    textAlign: "right",
  },
  // ─── TAX TABLE ────────────────────────────────────────────────────────
  taxWrap: {
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 4,
    marginTop: 2,
  },
  taxHdr: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 13,
  },
  taxRow: { flexDirection: "row", minHeight: 13, alignItems: "center" },
  taxCell: {
    padding: "1.5 3",
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  taxCellLast: { padding: "1.5 3", justifyContent: "center", alignItems: "center" },
  // ─── GRAND TOTAL ──────────────────────────────────────────────────────
  grandWrap: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  grandRow: { flexDirection: "row", minHeight: 14, alignItems: "center" },
  grandLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    width: 100,
    textAlign: "right",
    paddingRight: 6,
  },
  grandVal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    width: 90,
    textAlign: "right",
  },
  // ─── SIGNATURE ────────────────────────────────────────────────────────
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  sigCell: { width: "33%", alignItems: "center" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    width: "90%",
    marginBottom: 3,
  },
  sigText: { fontSize: 6.5, textAlign: "center" },
  // misc
  certText: {
    fontSize: 6.5,
    marginTop: 8,
    marginBottom: 4,
    fontStyle: "italic",
  },
  amountWords: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  pageNo: {
    position: "absolute",
    bottom: 8,
    right: 28,
    fontSize: 6.5,
  },
});

// ─── COLUMN CONFIGS ────────────────────────────────────────────────────────────

const ESTIMATE_PART_COLS = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Part Name", w: 82, align: "left" },
  { key: "description", label: "Description", w: 42, align: "center" },
  { key: "hsnSac", label: "HSN / SAC", w: 40, align: "center" },
  { key: "gstRate", label: "GST Rate (%)", w: 28, align: "center" },
  { key: "quantity", label: "Quantity", w: 28, align: "center" },
  { key: "unitPrice", label: "Unit Price (₹)", w: 50, align: "right" },
  { key: "payableAmount", label: "Payable Amount (₹)", w: 56, align: "right" },
  { key: "taxable", label: "Taxable (₹)", w: 50, align: "right" },
  { key: "partsTotal", label: "Parts Total (₹)", w: 55, align: "right" },
];

const STANDARD_PART_COLS = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Part Name", w: 100, align: "left" },
  { key: "description", label: "Description", w: 45, align: "center" },
  { key: "hsnSac", label: "HSN / SAC", w: 45, align: "center" },
  { key: "gstRate", label: "GST Rate (%)", w: 32, align: "center" },
  { key: "quantity", label: "Quantity", w: 30, align: "center" },
  { key: "unitPrice", label: "Unit Price (₹)", w: 62, align: "right" },
  { key: "taxable", label: "Taxable (₹)", w: 64, align: "right" },
  { key: "partsTotal", label: "Parts Total (₹)", w: 68, align: "right" },
];

const ESTIMATE_SVC_COLS = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Service", w: 82, align: "left" },
  { key: "description", label: "Description", w: 42, align: "center" },
  { key: "hsnSac", label: "HSN / SAC", w: 40, align: "center" },
  { key: "gstRate", label: "GST Rate (%)", w: 28, align: "center" },
  { key: "quantity", label: "Quantity", w: 28, align: "center" },
  { key: "unitPrice", label: "Unit Price (₹)", w: 50, align: "right" },
  { key: "payableAmount", label: "Payable Amount (₹)", w: 56, align: "right" },
  { key: "taxable", label: "Taxable (₹)", w: 50, align: "right" },
  { key: "labourTotal", label: "Labour Total (₹)", w: 55, align: "right" },
];

const STANDARD_SVC_COLS = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Service", w: 100, align: "left" },
  { key: "description", label: "Description", w: 45, align: "center" },
  { key: "hsnSac", label: "HSN / SAC", w: 45, align: "center" },
  { key: "gstRate", label: "GST Rate (%)", w: 32, align: "center" },
  { key: "quantity", label: "Quantity", w: 30, align: "center" },
  { key: "unitPrice", label: "Unit Price (₹)", w: 62, align: "right" },
  { key: "taxable", label: "Taxable (₹)", w: 64, align: "right" },
  { key: "labourTotal", label: "Labour Total (₹)", w: 68, align: "right" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function Cell({
  col,
  isLast,
  isHeader,
  children,
}: {
  col: (typeof ESTIMATE_PART_COLS)[0];
  isLast: boolean;
  isHeader?: boolean;
  children: React.ReactNode;
}) {
  const base = isLast ? s.tCellLast : s.tCell;
  const textStyle = isHeader
    ? s.tHdrText
    : col.align === "right"
    ? s.tValText
    : col.align === "left"
    ? s.tNameText
    : { ...s.tValText, textAlign: "center" as const };
  return (
    <View style={[base, { width: col.w, minWidth: col.w }]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

function SubtotalBlock({
  label,
  taxable,
  gst,
  sectionTotal,
}: {
  label: string;
  taxable: number;
  gst: number;
  sectionTotal: number;
}) {
  return (
    <View style={s.subBox}>
      <View style={s.subRow}>
        <Text style={s.subLabel}>Taxable Value</Text>
        <Text style={s.subVal}>₹ {fmt(taxable)}</Text>
      </View>
      <View style={s.subRow}>
        <Text style={s.subLabel}>GST Total</Text>
        <Text style={s.subVal}>₹ {fmt(gst)}</Text>
      </View>
      <View style={s.subRow}>
        <Text style={s.subLabel}>Discount Total</Text>
        <Text style={s.subVal}>₹ 0.00</Text>
      </View>
      <View style={s.subRow}>
        <Text style={s.subLabel}>{label}</Text>
        <Text style={s.subVal}>₹ {fmt(sectionTotal)}</Text>
      </View>
    </View>
  );
}

// ─── PARTS TABLE ──────────────────────────────────────────────────────────────

function PartsTable({
  parts,
  docType,
  startSerial,
}: {
  parts: BillWithItems["parts"];
  docType: string;
  startSerial: number;
}) {
  const isEstimate = docType === "ESTIMATE";
  const cols = isEstimate ? ESTIMATE_PART_COLS : STANDARD_PART_COLS;

  return (
    <View style={s.tableWrap}>
      {/* Header */}
      <View style={s.tHdr}>
        {cols.map((col, i) => (
          <Cell key={col.key} col={col} isLast={i === cols.length - 1} isHeader>
            {col.label}
          </Cell>
        ))}
      </View>
      {/* Rows */}
      {parts.map((p, idx) => {
        const taxable = getPartTaxable(
          p as any,
          docType as "ESTIMATE" | "PROFORMA" | "TAX_INVOICE"
        );
        const rowTotal = taxable * (1 + p.gstRate / 100);
        return (
          <View key={p.id || idx} style={s.tRow} wrap={false}>
            {cols.map((col, ci) => {
              let val: string;
              switch (col.key) {
                case "#":
                  val = String(startSerial + idx);
                  break;
                case "name":
                  val = p.name;
                  break;
                case "description":
                  val = p.description;
                  break;
                case "hsnSac":
                  val = p.hsnSac;
                  break;
                case "gstRate":
                  val = String(p.gstRate);
                  break;
                case "quantity":
                  val = fmt(p.quantity);
                  break;
                case "unitPrice":
                  val = fmt(p.unitPrice);
                  break;
                case "payableAmount":
                  val = fmt(p.payableAmount);
                  break;
                case "taxable":
                  val = fmt(taxable);
                  break;
                case "partsTotal":
                  val = fmt(rowTotal);
                  break;
                default:
                  val = "";
              }
              return (
                <Cell
                  key={col.key}
                  col={col}
                  isLast={ci === cols.length - 1}
                >
                  {val}
                </Cell>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ─── SERVICES TABLE ───────────────────────────────────────────────────────────

function ServicesTable({
  services,
  docType,
  startSerial,
}: {
  services: BillWithItems["services"];
  docType: string;
  startSerial: number;
}) {
  const isEstimate = docType === "ESTIMATE";
  const cols = isEstimate ? ESTIMATE_SVC_COLS : STANDARD_SVC_COLS;

  return (
    <View style={s.tableWrap}>
      <View style={s.tHdr}>
        {cols.map((col, i) => (
          <Cell key={col.key} col={col} isLast={i === cols.length - 1} isHeader>
            {col.label}
          </Cell>
        ))}
      </View>
      {services.map((sv, idx) => {
        const taxable = getServiceTaxable(
          sv as any,
          docType as "ESTIMATE" | "PROFORMA" | "TAX_INVOICE"
        );
        const rowTotal = taxable * (1 + sv.gstRate / 100);
        return (
          <View key={sv.id || idx} style={s.tRow} wrap={false}>
            {cols.map((col, ci) => {
              let val: string;
              switch (col.key) {
                case "#":
                  val = String(startSerial + idx);
                  break;
                case "name":
                  val = sv.name;
                  break;
                case "description":
                  val = sv.description;
                  break;
                case "hsnSac":
                  val = sv.hsnSac;
                  break;
                case "gstRate":
                  val = String(sv.gstRate);
                  break;
                case "quantity":
                  val = fmt(sv.quantity);
                  break;
                case "unitPrice":
                  val = fmt(sv.unitPrice);
                  break;
                case "payableAmount":
                  val = fmt(sv.payableAmount);
                  break;
                case "taxable":
                  val = fmt(taxable);
                  break;
                case "labourTotal":
                  val = fmt(rowTotal);
                  break;
                default:
                  val = "";
              }
              return (
                <Cell
                  key={col.key}
                  col={col}
                  isLast={ci === cols.length - 1}
                >
                  {val}
                </Cell>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ─── INFO HEADER (left + right grid) ─────────────────────────────────────────

function InfoBlock({
  bill,
  docLabel,
  docNumLabel,
}: {
  bill: BillWithItems;
  docLabel: string;
  docNumLabel: string;
}) {
  const isEstimate = bill.documentType === "ESTIMATE";
  const isProforma = bill.documentType === "PROFORMA";
  const isTax = bill.documentType === "TAX_INVOICE";

  const dateStr = new Date(bill.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={s.infoBlock}>
      {/* LEFT */}
      <View style={s.infoLeft}>
        <Text style={[s.bold, { fontSize: 7.5, marginBottom: 1 }]}>
          {bill.garageName}
        </Text>
        <Text style={{ marginBottom: 1 }}>{bill.garageAddress}</Text>
        <Text>GSTIN: {bill.garageGstin}</Text>
        <Text>Contact: {bill.garageContact}</Text>
        <Text>Email: {bill.garageEmail}</Text>

        {/* Separator line between garage info and insurance company */}
        <View style={s.separatorLine} />

        {/* Insurance */}
        {bill.companyName && (
          <>
            <Text>
              <Text style={s.bold}>Company Name: </Text>
              {bill.companyName}
            </Text>
            {isEstimate && (
              <>
                {bill.companyState && (
                  <Text>
                    <Text style={s.bold}>State: </Text>
                    {bill.companyState}
                  </Text>
                )}
              </>
            )}
            {!isEstimate && (
              <>
                {bill.companyMobile && (
                  <Text>
                    <Text style={s.bold}>Mobile No: </Text>
                    {bill.companyMobile}
                  </Text>
                )}
                {bill.companyAddress && (
                  <Text>
                    <Text style={s.bold}>Address: </Text>
                    {bill.companyAddress}
                    {bill.companyLocation ? `, ${bill.companyLocation}` : ""}
                    {bill.companyCity ? `, ${bill.companyCity}` : ""}
                    {bill.companyState ? `, ${bill.companyState}` : ""}
                    {bill.companyPincode ? ` - ${bill.companyPincode}.` : ""}
                  </Text>
                )}
                {!bill.companyAddress && (
                  <>
                    {bill.companyLocation && (
                      <Text>
                        <Text style={s.bold}>Location: </Text>
                        {bill.companyLocation}
                      </Text>
                    )}
                    {bill.companyCity && (
                      <Text>
                        <Text style={s.bold}>city: </Text>
                        {bill.companyCity}
                      </Text>
                    )}
                    {bill.companyState && (
                      <Text>
                        <Text style={s.bold}>State: </Text>
                        {bill.companyState}
                      </Text>
                    )}
                    {bill.companyPincode && (
                      <Text>
                        <Text style={s.bold}>Pincode: </Text>
                        {bill.companyPincode}
                      </Text>
                    )}
                  </>
                )}
                {bill.companyGstin && (
                  <Text>
                    <Text style={s.bold}>GSTIN: </Text>
                    {bill.companyGstin}
                  </Text>
                )}
              </>
            )}
          </>
        )}
      </View>

      {/* RIGHT */}
      <View style={s.infoRight}>
        {/* Row 1: Doc number | Date */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text>
              <Text style={s.bold}>{docNumLabel}: </Text>
              {bill.documentNumber || ""}
            </Text>
          </View>
          <View style={s.infoCellLast}>
            <Text>
              <Text style={s.bold}>Date: </Text>
              {dateStr}
            </Text>
          </View>
        </View>
        {/* Row 2: Service Type | Vehicle No */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text>
              <Text style={s.bold}>Service Type: </Text>
              {bill.serviceType || ""}
            </Text>
          </View>
          <View style={s.infoCellLast}>
            <Text>
              <Text style={s.bold}>Vehicle No: </Text>
              {bill.vehicleNo}
            </Text>
          </View>
        </View>
        {/* Row 3: Advisor */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text>
              <Text style={s.bold}>Advisor Name: </Text>
              {bill.advisorName || ""}
            </Text>
          </View>
          <View style={s.infoCellLast}>
          </View>
        </View>
        {/* Customer block */}
        <View style={[s.infoRowLast, { flex: 1, padding: "3 4" }]}>
          <View>
            <Text>
              <Text style={s.bold}>Customer: </Text>
              {bill.customerName}
            </Text>
            <Text>
              <Text style={s.bold}>Vehicle: </Text>
              {bill.vehicleName}
            </Text>
            {bill.kilometer != null && (
              <Text>
                <Text style={s.bold}>Kilometer: </Text>
                {bill.kilometer}
              </Text>
            )}
            {bill.color && (
              <Text>
                <Text style={s.bold}>Color: </Text>
                {bill.color}
              </Text>
            )}
            {bill.fuel && (
              <Text>
                <Text style={s.bold}>Fuel: </Text>
                {bill.fuel}
              </Text>
            )}
            {bill.customerPhone && (
              <Text>
                <Text style={s.bold}>PH: </Text>
                {bill.customerPhone}
              </Text>
            )}
            <Text>
              <Text style={s.bold}>Email: </Text>
              {bill.customerEmail || ""}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── TAX SUMMARY TABLE ────────────────────────────────────────────────────────

function TaxSummaryTable({
  totalTaxable,
  cgst,
  sgst,
  gstRate,
}: {
  totalTaxable: number;
  cgst: number;
  sgst: number;
  gstRate: number;
}) {
  const halfRate = gstRate / 2;
  const cellW = { w1: 140, w2: 40, w3: 80, w4: 40, w5: 80 };
  return (
    <View style={s.taxWrap} wrap={false}>
      <View style={s.taxHdr}>
        <View style={[s.taxCell, { width: cellW.w1 }]}>
          <Text style={s.tHdrText}>Taxable Value (₹)</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w2 }]}>
          <Text style={s.tHdrText}>CGST</Text>
          <Text style={s.tHdrText}>%</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w3 }]}>
          <Text style={s.tHdrText}>Amt (₹)</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w4 }]}>
          <Text style={s.tHdrText}>SGST</Text>
          <Text style={s.tHdrText}>%</Text>
        </View>
        <View style={[s.taxCellLast, { width: cellW.w5 }]}>
          <Text style={s.tHdrText}>Amt (₹)</Text>
        </View>
      </View>
      <View style={s.taxRow}>
        <View style={[s.taxCell, { width: cellW.w1 }]}>
          <Text style={[s.tValText, { textAlign: "right" }]}>
            {fmt(totalTaxable)}
          </Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w2 }]}>
          <Text style={[s.tValText, { textAlign: "center" }]}>{halfRate}</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w3 }]}>
          <Text style={[s.tValText, { textAlign: "right" }]}>{fmt(cgst)}</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w4 }]}>
          <Text style={[s.tValText, { textAlign: "center" }]}>{halfRate}</Text>
        </View>
        <View style={[s.taxCellLast, { width: cellW.w5 }]}>
          <Text style={[s.tValText, { textAlign: "right" }]}>{fmt(sgst)}</Text>
        </View>
      </View>
      {/* Total row */}
      <View
        style={[
          s.taxRow,
          {
            borderTopWidth: 1,
            borderTopColor: C.border,
            backgroundColor: C.subBg,
          },
        ]}
      >
        <View style={[s.taxCell, { width: cellW.w1 }]}>
          <Text style={[s.tHdrText, { textAlign: "right" }]}>
            {fmt(totalTaxable)}
          </Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w2 }]}>
          <Text style={s.tHdrText}></Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w3 }]}>
          <Text style={[s.tHdrText, { textAlign: "right" }]}>{fmt(cgst)}</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w4 }]}>
          <Text style={s.tHdrText}></Text>
        </View>
        <View style={[s.taxCellLast, { width: cellW.w5 }]}>
          <Text style={[s.tHdrText, { textAlign: "right" }]}>{fmt(sgst)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── GRAND TOTAL BLOCK ────────────────────────────────────────────────────────

function GrandTotalBlock({
  partsTaxable,
  labourTaxable,
  totalGst,
  grandTotal,
  roundOff,
}: {
  partsTaxable: number;
  labourTaxable: number;
  totalGst: number;
  grandTotal: number;
  roundOff: number;
}) {
  const rows = [
    { label: "Parts Total", val: fmt(partsTaxable) },
    { label: "Labour Total", val: fmt(labourTaxable) },
    { label: "GST Total", val: fmt(totalGst) },
    { label: "Grand Total", val: fmt(grandTotal) },
    { label: "Round off", val: fmt(roundOff) },
    { label: "Balance", val: fmt(roundOff) },
  ];
  return (
    <View style={s.grandWrap} wrap={false}>
      {rows.map((r) => (
        <View key={r.label} style={s.grandRow}>
          <Text style={s.grandLabel}>{r.label}</Text>
          <Text style={s.grandVal}>Rs. {r.val}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── MAIN DOCUMENT ────────────────────────────────────────────────────────────

export function BillPdf({
  bill,
  logoBase64,
}: {
  bill: BillWithItems;
  logoBase64?: string | null;
}) {
  const docType = bill.documentType as "ESTIMATE" | "PROFORMA" | "TAX_INVOICE";
  const docLabels = {
    ESTIMATE: { label: "Estimate", numLabel: "RFE No" },
    PROFORMA: { label: "Proforma Invoice", numLabel: "Proforma Invoice No" },
    TAX_INVOICE: { label: "Tax Invoice", numLabel: "Invoice No" },
  };
  const { label, numLabel } = docLabels[docType];

  const parts = [...bill.parts].sort((a, b) => a.serialNo - b.serialNo);
  const services = [...bill.services].sort((a, b) => a.serialNo - b.serialNo);

  const partTotals = calcPartsTotals(parts as any, docType);
  const svcTotals = calcServicesTotals(services as any, docType);
  const grand = calcGrandTotals(
    parts as any,
    services as any,
    docType,
    bill.gstRate
  );

  const wordsStr = numberToWords(grand.roundOff);

  const svcStartSerial = parts.length + 1;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── HEADER ── */}
        <View style={s.headerWrap}>
          {logoBase64 ? (
            <Image
              style={s.logo}
              src={`data:image/png;base64,${logoBase64}`}
            />
          ) : (
            <View style={s.logoPlaceholder}>
              <Text style={{ fontSize: 5, color: "#888" }}>LOGO</Text>
            </View>
          )}
          <View style={s.headerCenter}>
            <Text style={s.h1}>{bill.garageName}</Text>
            <Text style={s.h2}>{bill.garageAddress}</Text>
            <Text style={s.h2}>GSTIN: {bill.garageGstin}</Text>
          </View>
          <View style={{ width: 46 }} />
        </View>

        <Text style={s.docTypeLabel}>{label}</Text>

        {/* ── INFO BLOCK ── */}
        <InfoBlock bill={bill} docLabel={label} docNumLabel={numLabel} />

        {/* ── PARTS TABLE ── */}
        {parts.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Parts / Spare Parts</Text>
            <PartsTable parts={parts} docType={docType} startSerial={1} />
            <SubtotalBlock
              label="Round off"
              taxable={partTotals.taxable}
              gst={partTotals.gst}
              sectionTotal={Math.round(partTotals.total)}
            />
          </>
        )}

        {/* ── SERVICES TABLE ── */}
        {services.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Labour / Services</Text>
            <ServicesTable
              services={services}
              docType={docType}
              startSerial={svcStartSerial}
            />
            <SubtotalBlock
              label="Round off"
              taxable={svcTotals.taxable}
              gst={svcTotals.gst}
              sectionTotal={Math.round(svcTotals.total)}
            />
          </>
        )}

        {/* ── TAX SUMMARY ── */}
        <TaxSummaryTable
          totalTaxable={grand.totalTaxable}
          cgst={grand.cgst}
          sgst={grand.sgst}
          gstRate={bill.gstRate}
        />

        {/* ── AMOUNT IN WORDS ── */}
        <Text style={s.amountWords}>
          Amount ( in Words ): {wordsStr}
        </Text>

        {/* ── GRAND TOTAL ── */}
        <GrandTotalBlock
          partsTaxable={grand.partsTaxable}
          labourTaxable={grand.labourTaxable}
          totalGst={grand.totalGst}
          grandTotal={grand.grandTotal}
          roundOff={grand.roundOff}
        />

        {/* ── CERTIFICATION ── */}
        <Text style={s.certText}>
          I certify that the work has been done to my satisfaction and that I
          have taken delivery of the vehicle in good condition, with all items
          /valuables and parts intact
        </Text>

        {/* ── SIGNATURE ROW ── */}
        <View style={s.sigRow}>
          {[
            "Customer / Authorized Signatory",
            "Service Advisor Signature",
            "Cashier / Authorized Signature",
          ].map((lbl) => (
            <View key={lbl} style={s.sigCell}>
              <View style={s.sigLine} />
              <Text style={s.sigText}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* Page number */}
        <Text
          style={s.pageNo}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
