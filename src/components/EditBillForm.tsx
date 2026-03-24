"use client";

import { useState, useCallback } from "react";
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
  getServiceTaxable,
} from "@/lib/calculations";
import { INSURANCE_COMPANIES } from "@/lib/insuranceCompanies";
import { SERVICE_TYPES } from "@/lib/serviceTypes";

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
    description: "R&R",
    hsnSac: "998714",
    gstRate,
    quantity: 1,
    unitPrice: 0,
    payableAmount: 0,
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide bg-slate-100 rounded px-3 py-1.5 mb-3">
      {children}
    </h2>
  );
}

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
  "w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const sel =
  "w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const numInp =
  "w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm text-right text-slate-800 bg-white focus:ring-2 focus:ring-blue-400";

function PartsTable({
  parts,
  docType,
  onChange,
  onAdd,
  onRemove,
}: {
  parts: PartRow[];
  docType: DocumentType;
  onChange: (idx: number, field: keyof PartRow, val: string | number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const isEstimate = docType === "ESTIMATE";
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-semibold">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-left min-w-[160px]">Part Name*</th>
              <th className="px-2 py-2 text-center min-w-[90px]">Description</th>
              <th className="px-2 py-2 text-center min-w-[90px]">HSN/SAC</th>
              <th className="px-2 py-2 text-center min-w-[70px]">GST %</th>
              <th className="px-2 py-2 text-center min-w-[60px]">Qty</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Unit Price</th>
              {isEstimate && (
                <th className="px-2 py-2 text-right min-w-[90px]">Payable Amt</th>
              )}
              <th className="px-2 py-2 text-right min-w-[90px]">Taxable</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Parts Total</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => {
              const taxable = getPartTaxable(p, docType);
              const rowTotal = taxable * (1 + p.gstRate / 100);
              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30">
                  <td className="px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input className={inp} value={p.name} onChange={(e) => onChange(i, "name", e.target.value)} placeholder="Part name" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={inp} value={p.description} onChange={(e) => onChange(i, "description", e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input className={inp} value={p.hsnSac} onChange={(e) => onChange(i, "hsnSac", e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={p.gstRate} onChange={(e) => onChange(i, "gstRate", parseFloat(e.target.value) || 0)} min={0} max={100} />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={p.quantity} onChange={(e) => onChange(i, "quantity", parseFloat(e.target.value) || 1)} min={0.01} step="0.01" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={p.unitPrice} onChange={(e) => { const v = parseFloat(e.target.value) || 0; onChange(i, "unitPrice", v); if (isEstimate) onChange(i, "payableAmount", v); }} min={0} step="0.01" />
                  </td>
                  {isEstimate && (
                    <td className="px-1 py-1">
                      <input className={numInp} type="number" value={p.payableAmount} onChange={(e) => onChange(i, "payableAmount", parseFloat(e.target.value) || 0)} min={0} step="0.01" />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right text-slate-600 font-medium">{fmt(taxable)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-800 font-semibold">{fmt(rowTotal)}</td>
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 text-base font-bold leading-none">×</button>
                  </td>
                </tr>
              );
            })}
            {parts.length === 0 && (
              <tr><td colSpan={isEstimate ? 11 : 10} className="py-4 text-center text-slate-400 italic">No parts added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
        <span className="text-lg leading-none">+</span> Add Part
      </button>
    </div>
  );
}

function ServicesTable({
  services,
  partsCount,
  docType,
  onChange,
  onAdd,
  onRemove,
}: {
  services: ServiceRow[];
  partsCount: number;
  docType: DocumentType;
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
            <tr className="bg-slate-100 text-slate-600 font-semibold">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-left min-w-[160px]">Service Name*</th>
              <th className="px-2 py-2 text-center min-w-[100px]">Description</th>
              <th className="px-2 py-2 text-center min-w-[80px]">HSN/SAC</th>
              <th className="px-2 py-2 text-center min-w-[70px]">GST %</th>
              <th className="px-2 py-2 text-center min-w-[60px]">Qty</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Unit Price</th>
              {isEstimate && (
                <th className="px-2 py-2 text-right min-w-[90px]">Payable Amt</th>
              )}
              <th className="px-2 py-2 text-right min-w-[90px]">Taxable</th>
              <th className="px-2 py-2 text-right min-w-[90px]">Labour Total</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((sv, i) => {
              const taxable = getServiceTaxable(sv, docType);
              const rowTotal = taxable * (1 + sv.gstRate / 100);
              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30">
                  <td className="px-2 py-1.5 text-center text-slate-500">{partsCount + i + 1}</td>
                  <td className="px-1 py-1">
                    <input className={inp} value={sv.name} onChange={(e) => onChange(i, "name", e.target.value)} placeholder="Service name" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={inp} value={sv.description} onChange={(e) => onChange(i, "description", e.target.value)} placeholder="R&R, Denting, Paint..." />
                  </td>
                  <td className="px-1 py-1">
                    <input className={inp} value={sv.hsnSac} onChange={(e) => onChange(i, "hsnSac", e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={sv.gstRate} onChange={(e) => onChange(i, "gstRate", parseFloat(e.target.value) || 0)} min={0} max={100} />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={sv.quantity} onChange={(e) => onChange(i, "quantity", parseFloat(e.target.value) || 1)} min={0.01} step="0.01" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={numInp} type="number" value={sv.unitPrice} onChange={(e) => { const v = parseFloat(e.target.value) || 0; onChange(i, "unitPrice", v); if (isEstimate) onChange(i, "payableAmount", v); }} min={0} step="0.01" />
                  </td>
                  {isEstimate && (
                    <td className="px-1 py-1">
                      <input className={numInp} type="number" value={sv.payableAmount} onChange={(e) => onChange(i, "payableAmount", parseFloat(e.target.value) || 0)} min={0} step="0.01" />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right text-slate-600 font-medium">{fmt(taxable)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-800 font-semibold">{fmt(rowTotal)}</td>
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 text-base font-bold leading-none">×</button>
                  </td>
                </tr>
              );
            })}
            {services.length === 0 && (
              <tr><td colSpan={isEstimate ? 11 : 10} className="py-4 text-center text-slate-400 italic">No services added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
        <span className="text-lg leading-none">+</span> Add Service
      </button>
    </div>
  );
}

function TotalsSummary({ form }: { form: BillFormData }) {
  const docType = form.documentType;
  const partsTotals = calcPartsTotals(form.parts, docType);
  const svcTotals = calcServicesTotals(form.services, docType);
  const grand = calcGrandTotals(form.parts, form.services, docType, form.gstRate);

  const rows = [
    { label: "Parts Taxable", val: fmt(partsTotals.taxable) },
    { label: "Labour Taxable", val: fmt(svcTotals.taxable) },
    { label: "Total Taxable", val: fmt(grand.totalTaxable), bold: true },
    { label: `CGST (${form.gstRate / 2}%)`, val: fmt(grand.cgst) },
    { label: `SGST (${form.gstRate / 2}%)`, val: fmt(grand.sgst) },
    { label: "Total GST", val: fmt(grand.totalGst), bold: true },
    { label: "Grand Total", val: `₹ ${fmt(grand.grandTotal)}`, bold: true, big: true },
    { label: "Round Off", val: `₹ ${fmt(grand.roundOff)}`, bold: true, big: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-bold text-slate-700 mb-3">Live Totals</h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className={`flex justify-between items-center ${r.big ? "text-base font-bold text-blue-700 border-t border-slate-200 pt-2 mt-2" : r.bold ? "text-sm font-semibold text-slate-800" : "text-xs text-slate-600"}`}>
            <span>{r.label}</span>
            <span>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditBillForm({
  billId,
  initialData,
}: {
  billId: string;
  initialData: BillFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BillFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof BillFormData, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  const addPart = useCallback(() =>
    setForm((f) => ({ ...f, parts: [...f.parts, newPart(f.parts.length + 1, f.gstRate)] })), []);

  const removePart = useCallback((idx: number) =>
    setForm((f) => ({ ...f, parts: f.parts.filter((_, i) => i !== idx).map((p, i) => ({ ...p, serialNo: i + 1 })) })), []);

  const updatePart = useCallback((idx: number, field: keyof PartRow, val: string | number) =>
    setForm((f) => ({ ...f, parts: f.parts.map((p, i) => i === idx ? { ...p, [field]: val } : p) })), []);

  const addService = useCallback(() =>
    setForm((f) => ({ ...f, services: [...f.services, newService(f.parts.length + f.services.length + 1, f.gstRate)] })), []);

  const removeService = useCallback((idx: number) =>
    setForm((f) => ({ ...f, services: f.services.filter((_, i) => i !== idx).map((s, i) => ({ ...s, serialNo: f.parts.length + i + 1 })) })), []);

  const updateService = useCallback((idx: number, field: keyof ServiceRow, val: string | number) =>
    setForm((f) => ({ ...f, services: f.services.map((s, i) => i === idx ? { ...s, [field]: val } : s) })), []);

  const setDocType = (dt: DocumentType) =>
    setForm((f) => ({ ...f, documentType: dt, parts: f.parts.map((p) => ({ ...p, payableAmount: p.unitPrice })), services: f.services.map((s) => ({ ...s, payableAmount: s.unitPrice })) }));

  const setGstRate = (rate: number) =>
    setForm((f) => ({ ...f, gstRate: rate, parts: f.parts.map((p) => ({ ...p, gstRate: rate })), services: f.services.map((s) => ({ ...s, gstRate: rate })) }));

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.vehicleNo.trim() || !form.vehicleName.trim()) {
      setError("Customer Name, Vehicle No, and Vehicle Name are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/bills/${billId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  const isEstimate = form.documentType === "ESTIMATE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Document Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <SectionTitle>Document Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Field label="Document Type" required className="col-span-2 md:col-span-1">
              <select className={sel} value={form.documentType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
                {Object.entries(DOC_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </Field>
            <Field label={DOC_NUM_LABELS[form.documentType]}>
              <input className={inp} value={form.documentNumber} onChange={(e) => set("documentNumber", e.target.value)} />
            </Field>
            <Field label="Date" required>
              <input className={inp} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="GST Rate (%)">
              <input className={numInp} type="number" value={form.gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)} min={0} max={100} step="0.5" />
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Vehicle No" required>
              <input className={inp} value={form.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value)} />
            </Field>
            <Field label="Advisor Name">
              <input className={inp} value={form.advisorName} onChange={(e) => set("advisorName", e.target.value)} />
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
                <input className={inp} value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} placeholder="Type service type" />
                <p className="text-xs text-amber-600 mt-1">📝 Note: Type your service type</p>
              </Field>
            )}
          </div>
        </div>

        {/* Garage Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <SectionTitle>Garage Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Garage Name" required>
              <input className={inp} value={form.garageName} onChange={(e) => set("garageName", e.target.value)} />
            </Field>
            <Field label="GSTIN" required>
              <input className={inp} value={form.garageGstin} onChange={(e) => set("garageGstin", e.target.value)} />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input className={inp} value={form.garageAddress} onChange={(e) => set("garageAddress", e.target.value)} />
            </Field>
            <Field label="Contact No">
              <input className={inp} value={form.garageContact} onChange={(e) => set("garageContact", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inp} type="email" value={form.garageEmail} onChange={(e) => set("garageEmail", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <SectionTitle>Customer & Vehicle Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Customer Name" required>
              <input className={inp} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </Field>
            <Field label="Customer Phone">
              <input className={inp} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
            </Field>
            <Field label="Customer Email">
              <input className={inp} value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
            </Field>
            <Field label="Vehicle Name" required>
              <input className={inp} value={form.vehicleName} onChange={(e) => set("vehicleName", e.target.value)} />
            </Field>
            <Field label="Kilometer">
              <input className={inp} type="number" value={form.kilometer} onChange={(e) => set("kilometer", e.target.value)} />
            </Field>
            <Field label="Color">
              <input className={inp} value={form.color} onChange={(e) => set("color", e.target.value)} />
            </Field>
            <Field label="Fuel">
              <select className={sel} value={form.fuel} onChange={(e) => set("fuel", e.target.value)}>
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">ELECTRIC</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Insurance Company */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
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
                <option value="">— Select Insurance Company —</option>
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
                <p className="text-xs text-amber-600 mt-1">📝 Note: Type the insurance company name manually</p>
              </Field>
            )}
            <Field label="Mobile No">
              <input className={inp} value={form.companyMobile} onChange={(e) => set("companyMobile", e.target.value)} />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input className={inp} value={form.companyAddress} onChange={(e) => set("companyAddress", e.target.value)} />
            </Field>
            <Field label="Location">
              <input className={inp} value={form.companyLocation} onChange={(e) => set("companyLocation", e.target.value)} />
            </Field>
            <Field label="City">
              <input className={inp} value={form.companyCity} onChange={(e) => set("companyCity", e.target.value)} />
            </Field>
            <Field label="State">
              <input className={inp} value={form.companyState} onChange={(e) => set("companyState", e.target.value)} />
            </Field>
            <Field label="Pincode">
              <input className={inp} value={form.companyPincode} onChange={(e) => set("companyPincode", e.target.value)} />
            </Field>
            <Field label="Company GSTIN">
              <input className={inp} value={form.companyGstin} onChange={(e) => set("companyGstin", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Parts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <SectionTitle>Parts / Spare Parts</SectionTitle>
          <PartsTable parts={form.parts} docType={form.documentType} onChange={updatePart} onAdd={addPart} onRemove={removePart} />
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <SectionTitle>Labour / Services</SectionTitle>
          <ServicesTable services={form.services} partsCount={form.parts.length} docType={form.documentType} onChange={updateService} onAdd={addService} onRemove={removeService} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-8 py-2.5 rounded-lg transition text-sm">
            {loading ? "Saving..." : "💾 Update Bill"}
          </button>
          <a href={`/api/bills/${billId}/pdf`} target="_blank" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
            ⬇ Download PDF
          </a>
          <button onClick={() => router.push(`/bills/${billId}`)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-lg transition text-sm">
            Cancel
          </button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <TotalsSummary form={form} />
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Change GST globally to update all rows</li>
              <li>For Estimates, set Payable Amount separately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
