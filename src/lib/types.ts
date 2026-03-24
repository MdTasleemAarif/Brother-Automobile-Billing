export type DocumentType = "ESTIMATE" | "PROFORMA" | "TAX_INVOICE";

export interface PartRow {
  id?: string;
  serialNo: number;
  name: string;
  description: string;
  hsnSac: string;
  gstRate: number;
  quantity: number;
  unitPrice: number;
  payableAmount: number;
}

export interface ServiceRow {
  id?: string;
  serialNo: number;
  name: string;
  description: string;
  hsnSac: string;
  gstRate: number;
  quantity: number;
  unitPrice: number;
  payableAmount: number;
}

export interface BillFormData {
  documentType: DocumentType;
  documentNumber: string;
  date: string;
  jobCardNo: string;
  vehicleNo: string;
  advisorName: string;
  serviceType: string;

  // Garage
  garageName: string;
  garageAddress: string;
  garageGstin: string;
  garageContact: string;
  garageEmail: string;

  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Vehicle
  vehicleName: string;
  kilometer: string;
  color: string;
  fuel: string;

  // Insurance
  companyName: string;
  companyMobile: string;
  companyAddress: string;
  companyLocation: string;
  companyCity: string;
  companyState: string;
  companyPincode: string;
  companyGstin: string;

  // GST
  gstRate: number;

  parts: PartRow[];
  services: ServiceRow[];
}

export interface BillWithItems {
  id: string;
  documentType: string;
  documentNumber: string | null;
  date: Date;
  jobCardNo: string | null;
  vehicleNo: string;
  advisorName: string | null;
  serviceType: string | null;
  garageName: string;
  garageAddress: string;
  garageGstin: string;
  garageContact: string;
  garageEmail: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  vehicleName: string;
  kilometer: number | null;
  color: string | null;
  fuel: string | null;
  companyName: string | null;
  companyMobile: string | null;
  companyAddress: string | null;
  companyLocation: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyPincode: string | null;
  companyGstin: string | null;
  gstRate: number;
  parts: PartRow[];
  services: ServiceRow[];
  createdAt: Date;
  updatedAt: Date;
}

export const DOC_LABELS: Record<DocumentType, string> = {
  ESTIMATE: "Estimate",
  PROFORMA: "Proforma Invoice",
  TAX_INVOICE: "Tax Invoice",
};

export const DOC_NUM_LABELS: Record<DocumentType, string> = {
  ESTIMATE: "RFE No",
  PROFORMA: "Proforma Invoice No",
  TAX_INVOICE: "Invoice No",
};
