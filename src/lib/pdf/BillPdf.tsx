/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import path from "path";
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

const WINDOWS_FONTS_DIR = "C:\\Windows\\Fonts";

Font.register({
  family: "TimesNewRoman",
  fonts: [
    { src: path.join(WINDOWS_FONTS_DIR, "times.ttf"), fontWeight: 400 },
    { src: path.join(WINDOWS_FONTS_DIR, "timesbd.ttf"), fontWeight: 700 },
    {
      src: path.join(WINDOWS_FONTS_DIR, "timesi.ttf"),
      fontWeight: 400,
      fontStyle: "italic" as const,
    },
    {
      src: path.join(WINDOWS_FONTS_DIR, "timesbi.ttf"),
      fontWeight: 700,
      fontStyle: "italic" as const,
    },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

const C = {
  border: "#000000",
  headerBg: "#f3f3f3",
  subBg: "#f7f7f7",
  text: "#000000",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "TimesNewRoman",
    fontSize: 9.4,
    color: C.text,
    paddingTop: 14,
    paddingBottom: 18,
    paddingLeft: 16,
    paddingRight: 16,
    lineHeight: 1.35,
  },
  printHeader: {
    height: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  printHeaderLeft: { width: "33.33%", fontSize: 7.3 },
  printHeaderCenter: { width: "33.33%", fontSize: 7.3, textAlign: "center" },
  printHeaderRight: { width: "33.33%" },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    minHeight: 62,
  },
  logo: { width: 74, height: 60, objectFit: "contain" },
  logoPlaceholder: {
    width: 74,
    height: 60,
    backgroundColor: "#dddddd",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  h1: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 15.4,
    textAlign: "center",
    marginBottom: 6,
  },
  hAddress: { fontSize: 9.3, textAlign: "center", lineHeight: 1.6 },
  h2: { fontSize: 9.9, textAlign: "center", lineHeight: 1.4 },
  docTypeLabel: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 12.2,
    textAlign: "center",
    marginBottom: 8,
  },
  infoBlock: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  infoLeft: {
    width: "50%",
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  infoRight: { width: "50%" },
  garageInfoCell: {
    minHeight: 60,
    padding: "4 5",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  partyInfoCell: {
    minHeight: 68,
    padding: "4 5",
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 23,
  },
  infoMergedRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 46,
  },
  infoLeftStack: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  infoStackRow: {
    flex: 1,
    padding: "4 5",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoStackRowLast: {
    flex: 1,
    padding: "4 5",
    justifyContent: "center",
  },
  serviceTypeMergedCell: {
    flex: 1,
    padding: "4 5",
    justifyContent: "center",
  },
  vehicleNoText: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 11.2,
  },
  infoCell: {
    flex: 1,
    padding: "4 5",
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: "center",
  },
  infoCellLast: {
    flex: 1,
    padding: "4 5",
    justifyContent: "center",
  },
  bold: { fontFamily: "TimesNewRoman", fontWeight: 700 },
  tableWrap: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.border,
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
    minHeight: 16,
  },
  tCell: {
    padding: "2.5 3",
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: "center",
  },
  tCellLast: { padding: "2.5 3", justifyContent: "center" },
  tHdrText: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 7.9,
    textAlign: "center",
  },
  tValText: { fontSize: 7.9, textAlign: "right", lineHeight: 1.25 },
  tNameText: { fontSize: 7.9, lineHeight: 1.25 },
  subBox: {
    flexDirection: "row",
    minHeight: 46,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  subBlank: { flex: 1 },
  subPanel: {
    width: 205,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    paddingTop: 5,
    paddingLeft: 9,
    paddingRight: 7,
  },
  subRow: { flexDirection: "row", minHeight: 13, alignItems: "center" },
  subLabel: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 9,
    width: 92,
    textAlign: "left",
    paddingRight: 6,
  },
  subVal: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 9,
    width: 90,
    textAlign: "right",
  },
  subTotalRow: {
    marginTop: 2,
  },
  subTotalText: {
    fontSize: 9.8,
  },
  taxWrap: {
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  taxHdr: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 18,
  },
  taxRow: { flexDirection: "row", minHeight: 18, alignItems: "center" },
  taxCell: {
    padding: "2 3",
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  taxCellLast: {
    padding: "2 3",
    justifyContent: "center",
    alignItems: "center",
  },
  grandWrap: {
    flexDirection: "row",
    minHeight: 68,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 9,
  },
  grandBlank: { flex: 1 },
  grandPanel: {
    width: 235,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    padding: "6 7",
    justifyContent: "center",
  },
  grandRow: {
    flexDirection: "row",
    minHeight: 16,
    alignItems: "center",
    padding: "1.5 5",
    justifyContent: "space-between",
  },
  grandTotalRow: {
    flexDirection: "row",
    minHeight: 22,
    alignItems: "center",
    backgroundColor: "#e9f2ff",
    borderWidth: 1,
    borderColor: C.border,
    padding: "4 5",
    marginTop: 3,
    justifyContent: "space-between",
  },
  grandLabel: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 9.4,
    width: 112,
    textAlign: "left",
    paddingRight: 6,
  },
  grandVal: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 9.4,
    width: 108,
    textAlign: "right",
  },
  grandTotalText: {
    fontFamily: "TimesNewRoman",
    fontWeight: 700,
    fontSize: 10.8,
  },
  amountWords: {
    fontSize: 10.4,
    marginBottom: 6,
  },
  certText: {
    fontSize: 9.8,
    marginTop: 5,
    marginBottom: 1,
    lineHeight: 1.35,
  },
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  sigCell: { width: "33%", alignItems: "center" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    width: "68%",
    marginBottom: 1,
  },
  sigText: { fontSize: 8.2, textAlign: "center" },
  pageNo: {
    position: "absolute",
    bottom: 10,
    right: 16,
    fontSize: 10.8,
  },
});

type DocumentKind = "ESTIMATE" | "PROFORMA" | "TAX_INVOICE";

type Column = {
  key: string;
  label: string;
  w: number;
  align: "left" | "center" | "right";
};

const ESTIMATE_PART_COLS: Column[] = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Part Name", w: 102, align: "left" },
  { key: "description", label: "Description", w: 62, align: "center" },
  { key: "hsnSac", label: "HSN /\nSAC", w: 50, align: "center" },
  { key: "gstRate", label: "GST Rate\n(%)", w: 44, align: "center" },
  { key: "quantity", label: "Quantity", w: 42, align: "center" },
  { key: "unitPrice", label: "Unit Price\n(\u20B9)", w: 58, align: "right" },
  { key: "payableAmount", label: "Payable Amount\n(\u20B9)", w: 62, align: "right" },
  { key: "taxable", label: "Taxable\n(\u20B9)", w: 64, align: "right" },
  { key: "partsTotal", label: "Parts Total\n(MRP)", w: 80, align: "right" },
];

const STANDARD_PART_COLS: Column[] = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Part Name", w: 124, align: "left" },
  { key: "description", label: "Description", w: 78, align: "center" },
  { key: "hsnSac", label: "HSN /\nSAC", w: 54, align: "center" },
  { key: "gstRate", label: "GST Rate\n(%)", w: 52, align: "center" },
  { key: "quantity", label: "Quantity", w: 48, align: "center" },
  { key: "unitPrice", label: "Unit Price\n(\u20B9)", w: 68, align: "right" },
  { key: "taxable", label: "Taxable\n(\u20B9)", w: 68, align: "right" },
  { key: "partsTotal", label: "Parts Total\n(MRP)", w: 72, align: "right" },
];

const ESTIMATE_SVC_COLS: Column[] = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Service", w: 102, align: "left" },
  { key: "description", label: "Description", w: 62, align: "center" },
  { key: "hsnSac", label: "HSN /\nSAC", w: 50, align: "center" },
  { key: "gstRate", label: "GST Rate\n(%)", w: 44, align: "center" },
  { key: "quantity", label: "Quantity", w: 42, align: "center" },
  { key: "unitPrice", label: "Unit Price\n(\u20B9)", w: 58, align: "right" },
  { key: "payableAmount", label: "Payable Amount\n(\u20B9)", w: 62, align: "right" },
  { key: "taxable", label: "Taxable\n(\u20B9)", w: 64, align: "right" },
  { key: "labourTotal", label: "Labour Total\n(\u20B9)", w: 80, align: "right" },
];

const STANDARD_SVC_COLS: Column[] = [
  { key: "#", label: "#", w: 16, align: "center" },
  { key: "name", label: "Service", w: 124, align: "left" },
  { key: "description", label: "Description", w: 78, align: "center" },
  { key: "hsnSac", label: "HSN /\nSAC", w: 54, align: "center" },
  { key: "gstRate", label: "GST Rate\n(%)", w: 52, align: "center" },
  { key: "quantity", label: "Quantity", w: 48, align: "center" },
  { key: "unitPrice", label: "Unit Price\n(\u20B9)", w: 68, align: "right" },
  { key: "taxable", label: "Taxable\n(\u20B9)", w: 68, align: "right" },
  { key: "labourTotal", label: "Labour Total\n(\u20B9)", w: 72, align: "right" },
];

function Rupee() {
  return <Text style={{ fontFamily: "TimesNewRoman" }}>{"\u20B9"}</Text>;
}

function MoneyText({
  value,
  style,
}: {
  value: number;
  style?: any;
}) {
  return (
    <Text style={style}>
      <Rupee /> {fmt(value)}
    </Text>
  );
}

function formatBillDate(date: Date) {
  return new Date(date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
}

function formatPrintDateTime(date: Date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month}/${day}/${year}, ${hours}:${minutes} ${period}`;
}

function formatInsuranceAddress(bill: BillWithItems) {
  const mainParts = [
    bill.companyAddress,
    bill.companyLocation,
    bill.companyCity,
  ]
    .map((part) => part?.trim().replace(/[.,\s]+$/, ""))
    .filter(Boolean);
  const state = bill.companyState?.trim().replace(/[.,\s]+$/, "");
  const pincode = bill.companyPincode?.trim().replace(/[.,\s]+$/, "");
  const stateLine = [state, pincode ? `- ${pincode}` : ""]
    .filter(Boolean)
    .join(" ");
  const address = [...mainParts, stateLine].filter(Boolean).join(", ");

  return address ? `${address}.` : "";
}

function Cell({
  col,
  isLast,
  isHeader,
  children,
}: {
  col: Column;
  isLast: boolean;
  isHeader?: boolean;
  children: React.ReactNode;
}) {
  const textStyle = isHeader
    ? s.tHdrText
    : col.align === "right"
    ? s.tValText
    : col.align === "left"
    ? s.tNameText
    : { ...s.tValText, textAlign: "center" as const };

  return (
    <View style={[isLast ? s.tCellLast : s.tCell, { width: col.w }]}>
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
  const rows = [
    { lbl: "Taxable Value", val: taxable },
    { lbl: "GST Total", val: gst },
    { lbl: label, val: sectionTotal },
  ];

  return (
    <View style={s.subBox} wrap={false}>
      <View style={s.subBlank} />
      <View style={s.subPanel}>
        {rows.map((row) => {
          const isTotal = row.lbl === label;
          return (
            <View
              key={row.lbl}
              style={isTotal ? [s.subRow, s.subTotalRow] : s.subRow}
            >
              <Text style={isTotal ? [s.subLabel, s.subTotalText] : s.subLabel}>
                {row.lbl}
              </Text>
              <MoneyText
                value={row.val}
                style={isTotal ? [s.subVal, s.subTotalText] : s.subVal}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function InfoBlock({
  bill,
  docNumLabel,
}: {
  bill: BillWithItems;
  docNumLabel: string;
}) {
  const insuranceAddress = formatInsuranceAddress(bill);
  const dateStr = formatBillDate(bill.date);

  return (
    <View style={s.infoBlock}>
      <View style={s.infoLeft}>
        <View style={s.garageInfoCell}>
          <Text style={[s.bold, { fontSize: 9, marginBottom: 2 }]}>
            {bill.garageName}
          </Text>
          <Text>{bill.garageAddress}</Text>
          <Text>GSTIN: {bill.garageGstin}</Text>
          <Text>
            Contact: {bill.garageContact}
            {bill.garageAltContact ? ` / ${bill.garageAltContact}` : ""}
          </Text>
          <Text>Email: {bill.garageEmail}</Text>
        </View>

        <View style={s.partyInfoCell}>
          {bill.companyName && (
            <Text>
              <Text style={s.bold}>Company Name: </Text>
              {bill.companyName}
            </Text>
          )}
          {bill.companyMobile && (
            <Text>
              <Text style={s.bold}>Mobile No: </Text>
              {bill.companyMobile}
            </Text>
          )}
          {insuranceAddress && (
            <Text>
              <Text style={s.bold}>Address: </Text>
              {insuranceAddress}
            </Text>
          )}
          {bill.companyGstin && (
            <Text>
              <Text style={s.bold}>GSTIN: </Text>
              {bill.companyGstin.trim()}
            </Text>
          )}
        </View>
      </View>

      <View style={s.infoRight}>
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
        <View style={s.infoMergedRow}>
          <View style={s.infoLeftStack}>
            <View style={s.infoStackRow}>
              <Text>
                <Text style={s.bold}>Vehicle No: </Text>
                <Text style={s.vehicleNoText}>{bill.vehicleNo}</Text>
              </Text>
            </View>
            <View style={s.infoStackRowLast}>
              <Text>
                <Text style={s.bold}>Advisor Name: </Text>
                {bill.advisorName || ""}
              </Text>
            </View>
          </View>
          <View style={s.serviceTypeMergedCell}>
            <Text>
              <Text style={s.bold}>Service Type: </Text>
              {bill.serviceType || ""}
            </Text>
          </View>
        </View>

        <View style={s.partyInfoCell}>
          <Text>
            <Text style={s.bold}>Customer : </Text>
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
              <Text style={s.bold}>Color : </Text>
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
  );
}

function PartsTable({
  parts,
  docType,
  startSerial,
}: {
  parts: BillWithItems["parts"];
  docType: DocumentKind;
  startSerial: number;
}) {
  const cols = docType === "ESTIMATE" ? ESTIMATE_PART_COLS : STANDARD_PART_COLS;

  return (
    <View style={s.tableWrap}>
      <View style={s.tHdr}>
        {cols.map((col, i) => (
          <Cell key={col.key} col={col} isLast={i === cols.length - 1} isHeader>
            {col.label}
          </Cell>
        ))}
      </View>
      {parts.map((part, idx) => {
        const taxable = getPartTaxable(part as any, docType);
        const rowTotal = taxable * (1 + part.gstRate / 100);

        return (
          <View key={part.id || idx} style={s.tRow} wrap={false}>
            {cols.map((col, ci) => {
              let val = "";
              switch (col.key) {
                case "#":
                  val = String(startSerial + idx);
                  break;
                case "name":
                  val = part.name;
                  break;
                case "description":
                  val = part.description;
                  break;
                case "hsnSac":
                  val = part.hsnSac;
                  break;
                case "gstRate":
                  val = String(part.gstRate);
                  break;
                case "quantity":
                  val = fmt(part.quantity);
                  break;
                case "unitPrice":
                  val = fmt(part.unitPrice);
                  break;
                case "payableAmount":
                  val = fmt(part.payableAmount);
                  break;
                case "taxable":
                  val = fmt(taxable);
                  break;
                case "partsTotal":
                  val = fmt(rowTotal);
                  break;
              }

              return (
                <Cell key={col.key} col={col} isLast={ci === cols.length - 1}>
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

function ServicesTable({
  services,
  docType,
  startSerial,
}: {
  services: BillWithItems["services"];
  docType: DocumentKind;
  startSerial: number;
}) {
  const cols = docType === "ESTIMATE" ? ESTIMATE_SVC_COLS : STANDARD_SVC_COLS;

  return (
    <View style={s.tableWrap}>
      <View style={s.tHdr}>
        {cols.map((col, i) => (
          <Cell key={col.key} col={col} isLast={i === cols.length - 1} isHeader>
            {col.label}
          </Cell>
        ))}
      </View>
      {services.map((service, idx) => {
        const taxable = getServiceTaxable(service as any, docType);
        const rowTotal = taxable * (1 + service.gstRate / 100);

        return (
          <View key={service.id || idx} style={s.tRow} wrap={false}>
            {cols.map((col, ci) => {
              let val = "";
              switch (col.key) {
                case "#":
                  val = String(startSerial + idx);
                  break;
                case "name":
                  val = service.name;
                  break;
                case "description":
                  val = service.description;
                  break;
                case "hsnSac":
                  val = service.hsnSac;
                  break;
                case "gstRate":
                  val = String(service.gstRate);
                  break;
                case "quantity":
                  val = fmt(service.quantity);
                  break;
                case "unitPrice":
                  val = fmt(service.unitPrice);
                  break;
                case "payableAmount":
                  val = fmt(service.payableAmount);
                  break;
                case "taxable":
                  val = fmt(taxable);
                  break;
                case "labourTotal":
                  val = fmt(rowTotal);
                  break;
              }

              return (
                <Cell key={col.key} col={col} isLast={ci === cols.length - 1}>
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

function FinalSummaryBlock({
  partsTotal,
  labourTotal,
  gstTotal,
  grandTotal,
}: {
  partsTotal: number;
  labourTotal: number;
  gstTotal: number;
  grandTotal: number;
}) {
  const rows = [
    { label: "Parts Total", value: partsTotal },
    { label: "Labour Total", value: labourTotal },
    { label: "GST Total", value: gstTotal },
  ];

  return (
    <View style={s.grandWrap} wrap={false}>
      <View style={s.grandBlank} />
      <View style={s.grandPanel}>
        {rows.map((row) => (
          <View key={row.label} style={s.grandRow}>
            <Text style={s.grandLabel}>{row.label}</Text>
            <MoneyText value={row.value} style={s.grandVal} />
          </View>
        ))}
        <View style={s.grandTotalRow}>
          <Text style={[s.grandLabel, s.grandTotalText]}>Grand Total</Text>
          <MoneyText value={grandTotal} style={[s.grandVal, s.grandTotalText]} />
        </View>
      </View>
    </View>
  );
}

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
  const cellW = { w1: 205, w2: 52, w3: 136, w4: 52, w5: 135 };

  return (
    <View style={s.taxWrap} wrap={false}>
      <View style={s.taxHdr}>
        <View style={[s.taxCell, { width: cellW.w1 }]}>
          <Text style={s.tHdrText}>Taxable Value ({"\u20B9"})</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w2 }]}>
          <Text style={s.tHdrText}>CGST</Text>
          <Text style={s.tHdrText}>%</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w3 }]}>
          <Text style={s.tHdrText}>Amt ({"\u20B9"})</Text>
        </View>
        <View style={[s.taxCell, { width: cellW.w4 }]}>
          <Text style={s.tHdrText}>SGST</Text>
          <Text style={s.tHdrText}>%</Text>
        </View>
        <View style={[s.taxCellLast, { width: cellW.w5 }]}>
          <Text style={s.tHdrText}>Amt ({"\u20B9"})</Text>
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

export function BillPdf({
  bill,
  logoBase64,
}: {
  bill: BillWithItems;
  logoBase64?: string | null;
}) {
  const docType = bill.documentType as DocumentKind;
  const docLabels = {
    ESTIMATE: { label: "Estimate", numLabel: "RFE No" },
    PROFORMA: { label: "Proforma Invoice", numLabel: "Proforma Invoice No" },
    TAX_INVOICE: { label: "Tax Invoice", numLabel: "Invoice No" },
  };
  const { label, numLabel } = docLabels[docType];
  const printTitle =
    docType === "ESTIMATE"
      ? "Estimation"
      : docType === "PROFORMA"
      ? "Proforma Invoice"
      : "Tax Invoice";

  const parts = [...bill.parts].sort((a, b) => a.serialNo - b.serialNo);
  const services = [...bill.services].sort((a, b) => a.serialNo - b.serialNo);

  const partTotals = calcPartsTotals(parts as any, docType);
  const serviceTotals = calcServicesTotals(services as any, docType);
  const grand = calcGrandTotals(
    parts as any,
    services as any,
    docType,
    bill.gstRate
  );

  const wordsStr = numberToWords(grand.grandTotal);
  const serviceStartSerial = parts.length + 1;
  const printDateTime = formatPrintDateTime(new Date());

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.printHeader} fixed>
          <Text style={s.printHeaderLeft}>{printDateTime}</Text>
          <Text style={s.printHeaderCenter}>
            {printTitle} - Arixa Technologies
          </Text>
          <View style={s.printHeaderRight} />
        </View>

        <Text
          style={s.pageNo}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />

        <View style={s.headerWrap}>
          {logoBase64 ? (
            <Image style={s.logo} src={`data:image/png;base64,${logoBase64}`} />
          ) : (
            <View style={s.logoPlaceholder}>
              <Text style={{ fontSize: 7, color: "#888888" }}>LOGO</Text>
            </View>
          )}
          <View style={s.headerCenter}>
            <Text style={s.h1}>{bill.garageName}</Text>
            <Text style={s.hAddress}>{bill.garageAddress}</Text>
            <Text style={s.h2}>GSTIN: {bill.garageGstin}</Text>
          </View>
          <View style={{ width: 78 }} />
        </View>

        <Text style={s.docTypeLabel}>{label}</Text>

        <InfoBlock bill={bill} docNumLabel={numLabel} />

        {parts.length > 0 && (
          <>
            <PartsTable parts={parts} docType={docType} startSerial={1} />
            <SubtotalBlock
              label="Parts Total"
              taxable={partTotals.taxable}
              gst={partTotals.gst}
              sectionTotal={partTotals.total}
            />
          </>
        )}

        {services.length > 0 && (
          <>
            <ServicesTable
              services={services}
              docType={docType}
              startSerial={serviceStartSerial}
            />
            <SubtotalBlock
              label="Labour Total"
              taxable={serviceTotals.taxable}
              gst={serviceTotals.gst}
              sectionTotal={serviceTotals.total}
            />
          </>
        )}

        <View>
          <FinalSummaryBlock
            partsTotal={grand.partsTaxable}
            labourTotal={grand.labourTaxable}
            gstTotal={grand.totalGst}
            grandTotal={grand.grandTotal}
          />

          <TaxSummaryTable
            totalTaxable={grand.totalTaxable}
            cgst={grand.cgst}
            sgst={grand.sgst}
            gstRate={bill.gstRate}
          />

          <Text style={s.amountWords}>Amount ( in Words ): {wordsStr}</Text>

          <Text style={s.certText}>
            I certify that the work has been done to my satisfaction and that I
            have taken delivery of the vehicle in good condition, with all items
            /valuables and parts intact
          </Text>

          <View style={s.sigRow}>
            {[
              "Customer / Authorized Signatory",
              "Service Advisor Signature",
              "Cashier / Authorized Signature",
            ].map((labelText) => (
              <View key={labelText} style={s.sigCell}>
                <View style={s.sigLine} />
                <Text style={s.sigText}>{labelText}</Text>
              </View>
            ))}
          </View>
        </View>

      </Page>
    </Document>
  );
}
