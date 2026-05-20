import { BillForm } from "@/components/BillForm";

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f9fa6]">
          New Billing Chain
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#082342]">
          Create New Estimate
        </h1>
        <p className="mt-1 text-sm font-medium text-[#35526f]">
          Start with an Estimate. Convert it to Proforma and then Tax Invoice
          when the details are ready.
        </p>
      </div>
      <BillForm />
    </div>
  );
}
