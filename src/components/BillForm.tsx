"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BillFormData,
  DocumentType,
  PartRow,
  ServiceRow,
  DOC_LABELS,
  DOC_NUM_LABELS,
} from "@/lib/types";
import {
  calcGrandTotals,
  calcPartsTotals,
  calcServicesTotals,
  fmt,
  getPartTaxable,
  getTaxableUnitFromMrp,
  getServiceTaxable,
} from "@/lib/calculations";
import { INSURANCE_COMPANIES } from "@/lib/insuranceCompanies";
import { SERVICE_TYPES } from "@/lib/serviceTypes";
import { normalizeGstin, validateGstin } from "@/utils/validateGstin";

const DEFAULT_GARAGE = {
  garageName: "BROTHERS AUTOMOBILES",
  garageAddress:
    "Plot 92/A1, , Autonagar, Beside Wallmart,, Srinagar Jn, VISAKHAPATNAM, Andhra Pradesh (AP) - 530012.",
  garageGstin: "37BPKPS3819B1ZR",
  garageContact: "8688401177",
  garageAltContact: "8374042537",
  garageEmail: "brothersautomobilesvsp@gmail.com",
};

const DEFAULT_FORM: BillFormData = {
  documentType: "ESTIMATE",
  documentNumber: "",
  date: new Date().toISOString().split("T")[0],
  jobCardNo: "",
  vehicleNo: "",
  advisorName: "",
  serviceType: "Body Shop",
  ...DEFAULT_GARAGE,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleName: "",
  kilometer: "",
  color: "",
  fuel: "PETROL",
  companyName: "",
  companyMobile: "",
  companyAddress: "",
  companyLocation: "",
  companyCity: "",
  companyState: "Andhra Pradesh",
  companyPincode: "",
  companyGstin: "",
  gstRate: 18,
  parts: [],
  services: [],
};

function newPart(serialNo: number, gstRate: number): PartRow {
  return {
    serialNo,
    name: "",
    description: "Part",
    hsnSac: "87081090",
    gstRate,
    quantity: 1,
    unitPrice: 0,
    payableAmount: 0,
  };
}

function newService(serialNo: number, gstRate: number): ServiceRow {
  return {
    serialNo,
    name: "",
    description: "",
    hsnSac: "998714",
    gstRate,
    quantity: 1,
    unitPrice: 0,
    payableAmount: 0,
  };
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 rounded-lg bg-[#d9f3f2] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#082342] ring-1 ring-[#87d8d8]">
      {children}
    </h2>
  );
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-[#87d8d8] bg-white px-2.5 py-2 text-sm font-medium text-[#082342] transition focus:border-[#0f9fa6] focus:ring-2 focus:ring-[#b7eceb]";
const sel =
  "w-full rounded-lg border border-[#87d8d8] bg-white px-2.5 py-2 text-sm font-medium text-[#082342] transition focus:border-[#0f9fa6] focus:ring-2 focus:ring-[#b7eceb]";
const numInp =
  "w-full rounded-lg border border-[#87d8d8] bg-white px-2 py-2 text-right text-sm font-medium text-[#082342] transition focus:border-[#0f9fa6] focus:ring-2 focus:ring-[#b7eceb]";

const phoneDigits = (value: string) => value.replace(/\D/g, "").slice(0, 10);

function serviceDescriptionValue(value: string) {
  const trimmed = value.trim();
  const shortcut = trimmed.toLowerCase();

  if (shortcut === "r") return "R&R";
  if (shortcut === "d") return "Denting";
  if (shortcut === "p") return "Painting";
  if (shortcut === "o") return "Others";

  return value;
}

// ─── PARTS TABLE ──────────────────────────────────────────────────────────────
function PartsTable({
  parts,
  docType,
  gstRate,
  onChange,
  onMrpChange,
  onAdd,
  onRemove,
}: {
  parts: PartRow[];
  docType: DocumentType;
  gstRate: number;
  onChange: (idx: number, field: keyof PartRow, val: string | number) => void;
  onMrpChange: (idx: number, mrpTotal: number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const isEstimate = docType === "ESTIMATE";

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-black">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-left min-w-[160px]">Part Name*</th>
              <th className="px-2 py-2 text-center min-w-[90px]">Description</th>
              <th className="px-2 py-2 text-center min-w-[90px]">HSN/SAC</th>
              <th className="px-2 py-2 text-center min-w-[70px]">GST %</th>
              <th className="px-2 py-2 text-center min-w-[60px]">Qty</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Unit Price</th>
              {isEstimate && (
                <th className="px-2 py-2 text-right min-w-[90px]">
                  Payable Amt
                </th>
              )}
              <th className="px-2 py-2 text-right min-w-[90px]">Taxable</th>
              <th className="px-2 py-2 text-right min-w-[90px]">
                Parts Total (MRP)
              </th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => {
              const taxable = getPartTaxable(p, docType);
              const rowTotal = taxable * (1 + p.gstRate / 100);
              return (
                <tr
                  key={i}
                  className="border-t border-[#d7eeee] hover:bg-[#fff2c4]/60"
                >
                  <td className="px-2 py-1.5 text-center text-slate-500">
                    {i + 1}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={p.name}
                      onChange={(e) => onChange(i, "name", e.target.value)}
                      placeholder="Part name"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={p.description}
                      onChange={(e) =>
                        onChange(i, "description", e.target.value)
                      }
                      placeholder="Part"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={p.hsnSac}
                      onChange={(e) => onChange(i, "hsnSac", e.target.value)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={p.gstRate}
                      onChange={(e) =>
                        onChange(i, "gstRate", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      max={100}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={p.quantity}
                      onChange={(e) =>
                        onChange(i, "quantity", parseFloat(e.target.value) || 1)
                      }
                      min={0.01}
                      step="0.01"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={p.unitPrice}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        onChange(i, "unitPrice", v);
                        if (isEstimate) onChange(i, "payableAmount", v);
                      }}
                      min={0}
                      step="0.01"
                    />
                  </td>
                  {isEstimate && (
                    <td className="px-1 py-1">
                      <input
                        className={numInp}
                        type="number"
                        value={p.payableAmount}
                        onChange={(e) =>
                          onChange(
                            i,
                            "payableAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step="0.01"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right text-slate-600 font-medium">
                    {fmt(taxable)}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={`${numInp} font-semibold`}
                      type="number"
                      value={Number(rowTotal.toFixed(2))}
                      onChange={(e) =>
                        onMrpChange(i, parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step="0.01"
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      onClick={() => onRemove(i)}
                      className="rounded-md px-2 text-base font-black leading-none text-[#f47d61] hover:bg-[#ffe1d8] hover:text-[#9d351f]"
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
            {parts.length === 0 && (
              <tr>
                <td
                  colSpan={isEstimate ? 11 : 10}
                  className="py-4 text-center text-slate-400 italic"
                >
                  No parts added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1 text-sm font-black text-[#0f9fa6] hover:text-[#087d86]"
      >
        <span className="text-lg leading-none">+</span> Add Part
      </button>
    </div>
  );
}

// ─── SERVICES TABLE ───────────────────────────────────────────────────────────
function ServicesTable({
  services,
  partsCount,
  docType,
  gstRate,
  onChange,
  onAdd,
  onRemove,
}: {
  services: ServiceRow[];
  partsCount: number;
  docType: DocumentType;
  gstRate: number;
  onChange: (idx: number, field: keyof ServiceRow, val: string | number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const isEstimate = docType === "ESTIMATE";

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-black">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-left min-w-[160px]">Service Name*</th>
              <th className="px-2 py-2 text-center min-w-[100px]">Description</th>
              <th className="px-2 py-2 text-center min-w-[80px]">HSN/SAC</th>
              <th className="px-2 py-2 text-center min-w-[70px]">GST %</th>
              <th className="px-2 py-2 text-center min-w-[60px]">Qty</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Unit Price</th>
              {isEstimate && (
                <th className="px-2 py-2 text-right min-w-[90px]">
                  Payable Amt
                </th>
              )}
              <th className="px-2 py-2 text-right min-w-[90px]">Taxable</th>
              <th className="px-2 py-2 text-right min-w-[90px]">
                Labour Total
              </th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((sv, i) => {
              const taxable = getServiceTaxable(sv, docType);
              const rowTotal = taxable * (1 + sv.gstRate / 100);
              return (
                <tr
                  key={i}
                  className="border-t border-[#d7eeee] hover:bg-[#fff2c4]/60"
                >
                  <td className="px-2 py-1.5 text-center text-slate-500">
                    {partsCount + i + 1}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={sv.name}
                      onChange={(e) => onChange(i, "name", e.target.value)}
                      placeholder="Service name"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={sv.description}
                      onChange={(e) =>
                        onChange(i, "description", serviceDescriptionValue(e.target.value))
                      }
                      placeholder="R/R, D/Denting, P/Painting, O/Others"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={inp}
                      value={sv.hsnSac}
                      onChange={(e) => onChange(i, "hsnSac", e.target.value)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={sv.gstRate}
                      onChange={(e) =>
                        onChange(i, "gstRate", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      max={100}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={sv.quantity}
                      onChange={(e) =>
                        onChange(
                          i,
                          "quantity",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      min={0.01}
                      step="0.01"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      className={numInp}
                      type="number"
                      value={sv.unitPrice}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        onChange(i, "unitPrice", v);
                        if (isEstimate) onChange(i, "payableAmount", v);
                      }}
                      min={0}
                      step="0.01"
                    />
                  </td>
                  {isEstimate && (
                    <td className="px-1 py-1">
                      <input
                        className={numInp}
                        type="number"
                        value={sv.payableAmount}
                        onChange={(e) =>
                          onChange(
                            i,
                            "payableAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step="0.01"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right text-slate-600 font-medium">
                    {fmt(taxable)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-800 font-semibold">
                    {fmt(rowTotal)}
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      onClick={() => onRemove(i)}
                      className="rounded-md px-2 text-base font-black leading-none text-[#f47d61] hover:bg-[#ffe1d8] hover:text-[#9d351f]"
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
            {services.length === 0 && (
              <tr>
                <td
                  colSpan={isEstimate ? 11 : 10}
                  className="py-4 text-center text-slate-400 italic"
                >
                  No services added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1 text-sm font-black text-[#0f9fa6] hover:text-[#087d86]"
      >
        <span className="text-lg leading-none">+</span> Add Service
      </button>
    </div>
  );
}

// ─── TOTALS SUMMARY ───────────────────────────────────────────────────────────
function TotalsSummary({
  form,
}: {
  form: BillFormData;
}) {
  const docType = form.documentType;
  const partsTotals = calcPartsTotals(form.parts, docType);
  const svcTotals = calcServicesTotals(form.services, docType);
  const grand = calcGrandTotals(
    form.parts,
    form.services,
    docType,
    form.gstRate
  );

  const rows = [
    { label: "Parts Taxable", val: fmt(partsTotals.taxable) },
    { label: "Parts GST", val: fmt(partsTotals.gst) },
    { label: "Labour Taxable", val: fmt(svcTotals.taxable) },
    { label: "Labour GST", val: fmt(svcTotals.gst) },
    { label: "Total Taxable", val: fmt(grand.totalTaxable), bold: true },
    {
      label: `CGST (${form.gstRate / 2}%)`,
      val: fmt(grand.cgst),
    },
    {
      label: `SGST (${form.gstRate / 2}%)`,
      val: fmt(grand.sgst),
    },
    { label: "Total GST", val: fmt(grand.totalGst), bold: true },
    { label: "Grand Total", val: `Rs. ${fmt(grand.grandTotal)}`, bold: true, big: true },
  ];

  return (
    <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-[#082342]">Live Totals</h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex justify-between items-center ${
              r.big
                ? "text-base font-black text-[#0f9fa6] border-t border-[#87d8d8] pt-2 mt-2"
                : r.bold
                ? "text-sm font-semibold text-[#082342]"
                : "text-xs text-[#35526f]"
            }`}
          >
            <span>{r.label}</span>
            <span>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export function BillForm({ initialData }: { initialData?: Partial<BillFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<BillFormData>({
    ...DEFAULT_FORM,
    ...initialData,
    documentType: "ESTIMATE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documentNumberAuto, setDocumentNumberAuto] = useState(
    !initialData?.documentNumber
  );

  const set = (field: keyof BillFormData, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  const loadNextDocumentNumber = useCallback(async () => {
    try {
      const res = await fetch("/api/document-number?type=ESTIMATE");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load number");
      setForm((f) => ({ ...f, documentNumber: data.documentNumber }));
      setDocumentNumberAuto(true);
    } catch {
      setDocumentNumberAuto(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData?.documentNumber) {
      loadNextDocumentNumber();
    }
  }, [initialData?.documentNumber, loadNextDocumentNumber]);

  // Parts handlers
  const addPart = useCallback(
    () =>
      setForm((f) => ({
        ...f,
        parts: [
          ...f.parts,
          newPart(f.parts.length + 1, f.gstRate),
        ],
      })),
    []
  );

  const removePart = useCallback(
    (idx: number) =>
      setForm((f) => ({
        ...f,
        parts: f.parts
          .filter((_, i) => i !== idx)
          .map((p, i) => ({ ...p, serialNo: i + 1 })),
      })),
    []
  );

  const updatePart = useCallback(
    (idx: number, field: keyof PartRow, val: string | number) =>
      setForm((f) => ({
        ...f,
        parts: f.parts.map((p, i) =>
          i === idx ? { ...p, [field]: val } : p
        ),
      })),
    []
  );

  const updatePartMrp = useCallback(
    (idx: number, mrpTotal: number) =>
      setForm((f) => ({
        ...f,
        parts: f.parts.map((p, i) => {
          if (i !== idx) return p;
          const taxableUnit = getTaxableUnitFromMrp(
            mrpTotal,
            Number(p.quantity),
            Number(p.gstRate)
          );
          return {
            ...p,
            unitPrice: taxableUnit,
            payableAmount: taxableUnit,
          };
        }),
      })),
    []
  );

  // Services handlers
  const addService = useCallback(
    () =>
      setForm((f) => ({
        ...f,
        services: [
          ...f.services,
          newService(f.parts.length + f.services.length + 1, f.gstRate),
        ],
      })),
    []
  );

  const removeService = useCallback(
    (idx: number) =>
      setForm((f) => ({
        ...f,
        services: f.services
          .filter((_, i) => i !== idx)
          .map((s, i) => ({
            ...s,
            serialNo: f.parts.length + i + 1,
          })),
      })),
    []
  );

  const updateService = useCallback(
    (idx: number, field: keyof ServiceRow, val: string | number) =>
      setForm((f) => ({
        ...f,
        services: f.services.map((s, i) =>
          i === idx ? { ...s, [field]: val } : s
        ),
      })),
    []
  );

  // When docType changes, sync payableAmount = unitPrice for non-estimate
  const setDocType = (dt: DocumentType) => {
    setForm((f) => ({
      ...f,
      documentType: dt,
      parts: f.parts.map((p) => ({
        ...p,
        payableAmount: p.unitPrice,
      })),
      services: f.services.map((s) => ({
        ...s,
        payableAmount: s.unitPrice,
      })),
    }));
  };

  // When GST changes, update all rows
  const setGstRate = (rate: number) => {
    setForm((f) => ({
      ...f,
      gstRate: rate,
      parts: f.parts.map((p) => ({ ...p, gstRate: rate })),
      services: f.services.map((s) => ({ ...s, gstRate: rate })),
    }));
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.vehicleNo.trim() || !form.vehicleName.trim()) {
      setError("Customer Name, Vehicle No, and Vehicle Name are required.");
      return;
    }
    const gstinValidation = validateGstin(form.companyGstin);
    if (!gstinValidation.isValid) {
      setError(gstinValidation.message);
      set("companyGstin", gstinValidation.normalized);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documentNumberAuto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/bills/${data.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  const isEstimate = form.documentType === "ESTIMATE";
  const isTax = form.documentType === "TAX_INVOICE";
  const companyGstinValidation = validateGstin(form.companyGstin);
  const companyGstinTouched = form.companyGstin.trim().length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* ── MAIN FORM AREA ── */}
      <div className="lg:col-span-3 space-y-6">

        {/* ── DOCUMENT TYPE & BASIC INFO ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Document Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Field label="Document Type" required className="col-span-2 md:col-span-1">
              <div className={`${inp} bg-slate-100`}>{DOC_LABELS.ESTIMATE}</div>
              <p className="text-xs text-slate-500 mt-1">
                New billing chains start with an Estimate.
              </p>
            </Field>
            <Field label={DOC_NUM_LABELS[form.documentType]}>
              <div className="flex gap-2">
                <input
                  className={inp}
                  value={form.documentNumber}
                  onChange={(e) => {
                    setDocumentNumberAuto(false);
                    set("documentNumber", e.target.value);
                  }}
                  placeholder="Auto or enter manually"
                />
                <button
                  type="button"
                  onClick={loadNextDocumentNumber}
                  className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-md transition text-xs"
                >
                  Auto
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Auto-generated, but editable before saving.
              </p>
            </Field>
            <Field label="Date" required>
              <input
                className={inp}
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field label="GST Rate (%)">
              <input
                className={numInp}
                type="number"
                value={form.gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step="0.5"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Vehicle No" required>
              <input
                className={inp}
                value={form.vehicleNo}
                onChange={(e) => set("vehicleNo", e.target.value)}
                placeholder="AP39HC4986"
              />
            </Field>
            <Field label="Advisor Name">
              <input
                className={inp}
                value={form.advisorName}
                onChange={(e) => set("advisorName", e.target.value)}
                placeholder="Name or phone"
              />
            </Field>
            <Field label="Service Type">
              <select
                className={sel}
                value={SERVICE_TYPES.includes(form.serviceType as any) ? form.serviceType : form.serviceType ? "__OTHER__" : "Body Shop"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__OTHER__") {
                    set("serviceType", "");
                  } else {
                    set("serviceType", v);
                  }
                }}
              >
                {SERVICE_TYPES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
                <option value="__OTHER__">Other</option>
              </select>
            </Field>
            {!SERVICE_TYPES.includes(form.serviceType as any) && (
              <Field label="Service Type (Other)">
                <input
                  className={inp}
                  value={form.serviceType}
                  onChange={(e) => set("serviceType", e.target.value)}
                  placeholder="Type service type"
                />
                <p className="mt-1 text-xs font-semibold text-amber-700">Note: Type your service type</p>
              </Field>
            )}
          </div>
        </div>

        {/* ── GARAGE INFO ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Garage Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Garage Name" required>
              <input
                className={inp}
                value={form.garageName}
                onChange={(e) => set("garageName", e.target.value)}
              />
            </Field>
            <Field label="GSTIN" required>
              <input
                className={inp}
                value={form.garageGstin}
                onChange={(e) => set("garageGstin", e.target.value)}
              />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input
                className={inp}
                value={form.garageAddress}
                onChange={(e) => set("garageAddress", e.target.value)}
              />
            </Field>
            <Field label="Contact No">
              <input
                className={inp}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                value={form.garageContact}
                onChange={(e) => set("garageContact", phoneDigits(e.target.value))}
              />
            </Field>
            <Field label="Email">
              <input
                className={inp}
                type="email"
                value={form.garageEmail}
                onChange={(e) => set("garageEmail", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── CUSTOMER & VEHICLE ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Customer & Vehicle Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Customer Name" required className="md:col-span-1">
              <input
                className={inp}
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="V SRINIVASA RAO"
              />
            </Field>
            <Field label="Customer Phone">
              <input
                className={inp}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", phoneDigits(e.target.value))}
                placeholder="7396812000"
              />
            </Field>
            <Field label="Customer Email">
              <input
                className={inp}
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
              />
            </Field>
            <Field label="Vehicle Name" required className="md:col-span-1">
              <input
                className={inp}
                value={form.vehicleName}
                onChange={(e) => set("vehicleName", e.target.value)}
                placeholder="HYUNDAI CREATA 2020"
              />
            </Field>
            <Field label="Kilometer">
              <input
                className={inp}
                type="number"
                value={form.kilometer}
                onChange={(e) => set("kilometer", e.target.value)}
                placeholder="108703"
              />
            </Field>
            <Field label="Color">
              <input
                className={inp}
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="Other Color"
              />
            </Field>
            <Field label="Fuel">
              <select
                className={sel}
                value={form.fuel}
                onChange={(e) => set("fuel", e.target.value)}
              >
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">ELECTRIC</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── INSURANCE COMPANY ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Insurance Company Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Company Name" className="md:col-span-2">
              <select
                className={sel}
                value={INSURANCE_COMPANIES.includes(form.companyName as any) ? form.companyName : form.companyName ? "__OTHER__" : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__OTHER__") {
                    set("companyName", "");
                  } else {
                    set("companyName", v);
                  }
                }}
              >
                <option value="">- Select Insurance Company -</option>
                {INSURANCE_COMPANIES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__OTHER__">Other</option>
              </select>
              {!INSURANCE_COMPANIES.includes(form.companyName as any) && form.companyName !== "" && (
                <p className="text-xs text-slate-500 mt-1">Custom: {form.companyName}</p>
              )}
            </Field>

            {!INSURANCE_COMPANIES.includes(form.companyName as any) && (
              <Field label="Insurance Company Name (Other)">
                <input
                  className={inp}
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="Type insurance company name"
                />
                <p className="mt-1 text-xs font-semibold text-amber-700">Note: Type the insurance company name manually</p>
              </Field>
            )}
            <Field label="Mobile No">
              <input
                className={inp}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                value={form.companyMobile}
                onChange={(e) => set("companyMobile", phoneDigits(e.target.value))}
              />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input
                className={inp}
                value={form.companyAddress}
                onChange={(e) => set("companyAddress", e.target.value)}
                placeholder="NO.302, ESWAR PLAZA, LLND FLOOR,"
              />
            </Field>
            <Field label="Location">
              <input
                className={inp}
                value={form.companyLocation}
                onChange={(e) => set("companyLocation", e.target.value)}
                placeholder="DWARAKA NAGAR VISAKHAPATNAM"
              />
            </Field>
            <Field label="City">
              <input
                className={inp}
                value={form.companyCity}
                onChange={(e) => set("companyCity", e.target.value)}
                placeholder="Vishakhapatnam"
              />
            </Field>
            <Field label="State">
              <input
                className={inp}
                value={form.companyState}
                onChange={(e) => set("companyState", e.target.value)}
                placeholder="Andhra Pradesh"
              />
            </Field>
            <Field label="Pincode">
              <input
                className={inp}
                value={form.companyPincode}
                onChange={(e) => set("companyPincode", e.target.value)}
                placeholder="500003"
              />
            </Field>
            <Field label="Company GSTIN" required>
              <input
                className={`${inp} ${
                  companyGstinValidation.isValid
                    ? "border-green-500 focus:ring-green-400"
                    : companyGstinTouched
                    ? "border-red-500 focus:ring-red-400"
                    : ""
                }`}
                type="text"
                maxLength={15}
                aria-invalid={!companyGstinValidation.isValid}
                value={form.companyGstin}
                onChange={(e) => set("companyGstin", normalizeGstin(e.target.value))}
                placeholder="22AAAAA0000A1Z5"
              />
            </Field>
          </div>
        </div>

        {/* ── PARTS TABLE ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Parts / Spare Parts</SectionTitle>
          <PartsTable
            parts={form.parts}
            docType={form.documentType}
            gstRate={form.gstRate}
            onChange={updatePart}
            onMrpChange={updatePartMrp}
            onAdd={addPart}
            onRemove={removePart}
          />
        </div>

        {/* ── SERVICES TABLE ── */}
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
          <SectionTitle>Labour / Services</SectionTitle>
          <ServicesTable
            services={form.services}
            partsCount={form.parts.length}
            docType={form.documentType}
            gstRate={form.gstRate}
            onChange={updateService}
            onAdd={addService}
            onRemove={removeService}
          />
        </div>

        {/* ── SUBMIT ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[#082342] px-8 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#0f9fa6] disabled:bg-[#e9dec5]"
          >
            {loading ? "Saving..." : "Save Estimate"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── SIDEBAR: LIVE TOTALS ── */}
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <TotalsSummary form={form} />

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            <p className="mb-1 font-black">Tips</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>GST defaults to 18% - change per row or globally</li>
              <li>For Estimates, set Payable Amount separately</li>
              <li>Convert Estimate to Proforma only after details are ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
