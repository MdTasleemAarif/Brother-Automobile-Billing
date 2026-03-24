import { BillForm } from "@/components/BillForm";

export default function NewBillPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Create New Bill</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details to generate an Estimate, Proforma Invoice, or Tax
          Invoice.
        </p>
      </div>
      <BillForm />
    </div>
  );
}
