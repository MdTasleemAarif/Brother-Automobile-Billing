import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcGrandTotals } from "@/lib/calculations";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type RangeMode = "day" | "week" | "month" | "year" | "custom" | "all";

const INDIA_OFFSET = "+05:30";
const validModes: RangeMode[] = ["day", "week", "month", "year", "custom", "all"];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toIndiaYmd(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value || "2026";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

function isYmd(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isMonth(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function isYear(value: string | undefined) {
  return Boolean(value && /^\d{4}$/.test(value));
}

function dateAtIndiaStart(ymd: string) {
  return new Date(`${ymd}T00:00:00.000${INDIA_OFFSET}`);
}

function dateAtIndiaNoon(ymd: string) {
  return new Date(`${ymd}T12:00:00.000${INDIA_OFFSET}`);
}

function addDays(ymd: string, days: number) {
  const date = dateAtIndiaNoon(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return toIndiaYmd(date);
}

function addMonths(month: string, count: number) {
  const [yearPart, monthPart] = month.split("-").map(Number);
  const date = new Date(Date.UTC(yearPart, monthPart - 1 + count, 1, 6));
  const year = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${nextMonth}`;
}

function formatDateLabel(ymd: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateAtIndiaNoon(ymd));
}

function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(dateAtIndiaNoon(`${month}-01`));
}

function formatChartLabel(key: string, groupMode: "day" | "month" | "year") {
  if (groupMode === "year") return key;
  if (groupMode === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    }).format(dateAtIndiaNoon(`${key}-01`));
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(dateAtIndiaNoon(key));
}

function buildRange(params: Record<string, string | string[] | undefined>) {
  const today = toIndiaYmd(new Date());
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);
  const requestedMode = param(params.range) as RangeMode | undefined;
  const mode = validModes.includes(requestedMode as RangeMode)
    ? (requestedMode as RangeMode)
    : "month";

  if (mode === "all") {
    return {
      mode,
      today,
      currentMonth,
      currentYear,
      label: "All Tax Invoice earnings",
      start: null,
      end: null,
      date: today,
      month: currentMonth,
      year: currentYear,
      from: today,
      to: today,
    };
  }

  if (mode === "day") {
    const date = isYmd(param(params.date)) ? param(params.date)! : today;
    return {
      mode,
      today,
      currentMonth,
      currentYear,
      label: formatDateLabel(date),
      start: dateAtIndiaStart(date),
      end: dateAtIndiaStart(addDays(date, 1)),
      date,
      month: currentMonth,
      year: currentYear,
      from: date,
      to: date,
    };
  }

  if (mode === "week") {
    const date = isYmd(param(params.date)) ? param(params.date)! : today;
    const dayOfWeek = dateAtIndiaNoon(date).getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const startYmd = addDays(date, -daysFromMonday);
    const endYmd = addDays(startYmd, 7);
    return {
      mode,
      today,
      currentMonth,
      currentYear,
      label: `${formatDateLabel(startYmd)} to ${formatDateLabel(addDays(endYmd, -1))}`,
      start: dateAtIndiaStart(startYmd),
      end: dateAtIndiaStart(endYmd),
      date,
      month: currentMonth,
      year: currentYear,
      from: startYmd,
      to: addDays(endYmd, -1),
    };
  }

  if (mode === "year") {
    const year = isYear(param(params.year)) ? param(params.year)! : currentYear;
    return {
      mode,
      today,
      currentMonth,
      currentYear,
      label: year,
      start: dateAtIndiaStart(`${year}-01-01`),
      end: dateAtIndiaStart(`${Number(year) + 1}-01-01`),
      date: today,
      month: `${year}-01`,
      year,
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    };
  }

  if (mode === "custom") {
    let from = isYmd(param(params.from)) ? param(params.from)! : today;
    let to = isYmd(param(params.to)) ? param(params.to)! : today;
    if (from > to) [from, to] = [to, from];
    return {
      mode,
      today,
      currentMonth,
      currentYear,
      label: `${formatDateLabel(from)} to ${formatDateLabel(to)}`,
      start: dateAtIndiaStart(from),
      end: dateAtIndiaStart(addDays(to, 1)),
      date: today,
      month: currentMonth,
      year: currentYear,
      from,
      to,
    };
  }

  const month = isMonth(param(params.month)) ? param(params.month)! : currentMonth;
  return {
    mode: "month" as RangeMode,
    today,
    currentMonth,
    currentYear,
    label: formatMonthLabel(month),
    start: dateAtIndiaStart(`${month}-01`),
    end: dateAtIndiaStart(`${addMonths(month, 1)}-01`),
    date: today,
    month,
    year: month.slice(0, 4),
    from: `${month}-01`,
    to: addDays(`${addMonths(month, 1)}-01`, -1),
  };
}

function rangeLink(mode: RangeMode, range: ReturnType<typeof buildRange>) {
  if (mode === "day") return `/earnings?range=day&date=${range.today}`;
  if (mode === "week") return `/earnings?range=week&date=${range.today}`;
  if (mode === "month") return `/earnings?range=month&month=${range.currentMonth}`;
  if (mode === "year") return `/earnings?range=year&year=${range.currentYear}`;
  if (mode === "all") return "/earnings?range=all";
  return `/earnings?range=custom&from=${range.today}&to=${range.today}`;
}

function metricClass(accent: "teal" | "amber" | "coral" | "navy") {
  const accents = {
    teal: "border-[#87d8d8] bg-[#d9f3f2] text-[#082342]",
    amber: "border-[#f7c948]/60 bg-[#fff2c4] text-[#082342]",
    coral: "border-[#f47d61]/50 bg-[#ffe1d8] text-[#082342]",
    navy: "border-[#082342]/15 bg-[#eef4fb] text-[#082342]",
  };
  return accents[accent];
}

export default async function EarningsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = buildRange(params);

  const bills = await prisma.bill.findMany({
    where:
      range.start && range.end
        ? {
            documentType: "TAX_INVOICE",
            date: { gte: range.start, lt: range.end },
          }
        : { documentType: "TAX_INVOICE" },
    include: { parts: true, services: true },
    orderBy: { date: "desc" },
  });

  const invoices = bills.map((bill) => {
    const grand = calcGrandTotals(
      bill.parts,
      bill.services,
      "TAX_INVOICE",
      bill.gstRate
    );

    return {
      id: bill.id,
      documentNumber: bill.documentNumber,
      date: bill.date,
      dateKey: toIndiaYmd(bill.date),
      customerName: bill.customerName,
      vehicleName: bill.vehicleName,
      vehicleNo: bill.vehicleNo,
      partsTotal: grand.partsTaxable,
      labourTotal: grand.labourTaxable,
      gstTotal: grand.totalGst,
      grandTotal: grand.grandTotal,
    };
  });

  const totalEarnings = invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
  const totalGst = invoices.reduce((sum, invoice) => sum + invoice.gstTotal, 0);
  const totalParts = invoices.reduce((sum, invoice) => sum + invoice.partsTotal, 0);
  const totalLabour = invoices.reduce((sum, invoice) => sum + invoice.labourTotal, 0);
  const averageInvoice = invoices.length ? totalEarnings / invoices.length : 0;

  const groupMode =
    range.mode === "year" ? "month" : range.mode === "all" ? "year" : "day";
  const breakdown = Array.from(
    invoices.reduce((map, invoice) => {
      const key =
        groupMode === "year"
          ? invoice.dateKey.slice(0, 4)
          : groupMode === "month"
          ? invoice.dateKey.slice(0, 7)
          : invoice.dateKey;
      const current = map.get(key) || { key, count: 0, total: 0 };
      current.count += 1;
      current.total += invoice.grandTotal;
      map.set(key, current);
      return map;
    }, new Map<string, { key: string; count: number; total: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.key.localeCompare(b.key));

  const maxBreakdownTotal = Math.max(...breakdown.map((item) => item.total), 1);
  const chartItems = breakdown.slice(-12);
  const chartMax = Math.max(...chartItems.map((item) => item.total), 1);
  const chartWidth = 920;
  const chartHeight = 260;
  const chartPadX = 42;
  const chartPadTop = 24;
  const chartPadBottom = 46;
  const chartPlotHeight = chartHeight - chartPadTop - chartPadBottom;
  const chartStep =
    chartItems.length > 1
      ? (chartWidth - chartPadX * 2) / (chartItems.length - 1)
      : 0;
  const chartPoints = chartItems.map((item, index) => {
    const x = chartItems.length === 1 ? chartWidth / 2 : chartPadX + index * chartStep;
    const y = chartPadTop + (1 - item.total / chartMax) * chartPlotHeight;
    return {
      ...item,
      x,
      y,
      label: formatChartLabel(item.key, groupMode),
      barHeight: Math.max((item.total / chartMax) * chartPlotHeight, item.total > 0 ? 4 : 0),
    };
  });
  const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints =
    chartPoints.length > 1
      ? `${chartPadX},${chartHeight - chartPadBottom} ${linePoints} ${
          chartWidth - chartPadX
        },${chartHeight - chartPadBottom}`
      : "";
  const bestPeriod = [...breakdown].sort((a, b) => b.total - a.total)[0];
  const quickFilters: { label: string; mode: RangeMode }[] = [
    { label: "Today", mode: "day" },
    { label: "This Week", mode: "week" },
    { label: "This Month", mode: "month" },
    { label: "This Year", mode: "year" },
    { label: "All", mode: "all" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-stretch">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f9fa6]">
              Tax Invoice Earnings
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#082342]">
              Earnings Report
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-[#35526f]">
              Showing final Tax Invoice earnings for {range.label}.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickFilters.map((filter) => {
                const active = range.mode === filter.mode;
                return (
                  <Link
                    key={filter.mode}
                    href={rangeLink(filter.mode, range)}
                    className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                      active
                        ? "border-[#0f9fa6] bg-[#0f9fa6] text-white shadow-sm"
                        : "border-[#87d8d8] bg-white/80 text-[#082342] hover:bg-[#d9f3f2]"
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#87d8d8] bg-[#d9f3f2] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#087d86]">
              Final Earning
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[#082342]">
              {currency.format(totalEarnings)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-[#082342]">
              <div className="rounded-lg bg-white/75 p-3">
                <p className="text-[#6d7f91]">Invoices</p>
                <p className="mt-1 text-xl">{invoices.length}</p>
              </div>
              <div className="rounded-lg bg-white/75 p-3">
                <p className="text-[#6d7f91]">GST</p>
                <p className="mt-1 text-xl">{currency.format(totalGst)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Invoice Earnings",
            value: currency.format(totalEarnings),
            sub: `${invoices.length} final invoice${invoices.length === 1 ? "" : "s"}`,
            accent: "teal" as const,
          },
          {
            label: "Total Tax Invoices",
            value: String(invoices.length),
            sub: "Estimate and Proforma excluded",
            accent: "amber" as const,
          },
          {
            label: "GST Total",
            value: currency.format(totalGst),
            sub: "From final Tax Invoices",
            accent: "navy" as const,
          },
          {
            label: "Average Invoice",
            value: currency.format(averageInvoice),
            sub: "Grand Total average",
            accent: "coral" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-lg border p-4 shadow-sm ${metricClass(metric.accent)}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight">{metric.value}</p>
            <p className="mt-1 text-xs font-semibold opacity-75">{metric.sub}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f9fa6]">
              Earnings Graph
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#082342]">
              Tax Invoice Trend
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#35526f]">
              Graph shows final invoice earnings by {groupMode === "day" ? "date" : groupMode}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm font-black text-[#082342]">
            <div className="rounded-lg border border-[#87d8d8] bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[#6d7f91]">Highest</p>
              <p className="mt-1">{bestPeriod ? currency.format(bestPeriod.total) : currency.format(0)}</p>
            </div>
            <div className="rounded-lg border border-[#87d8d8] bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[#6d7f91]">Periods</p>
              <p className="mt-1">{breakdown.length}</p>
            </div>
          </div>
        </div>

        {chartPoints.length === 0 ? (
          <div className="rounded-lg bg-[#fff2c4] p-8 text-center text-sm font-semibold text-[#35526f]">
            No graph data available for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="min-w-[760px] rounded-lg border border-[#87d8d8] bg-white"
              role="img"
              aria-label="Earnings graph"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartPadTop + ratio * chartPlotHeight;
                const value = chartMax * (1 - ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={chartPadX}
                      y1={y}
                      x2={chartWidth - chartPadX}
                      y2={y}
                      stroke="#d7eeee"
                      strokeWidth="1"
                    />
                    <text
                      x={chartPadX - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="700"
                      fill="#6d7f91"
                    >
                      {value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}
                    </text>
                  </g>
                );
              })}

              {chartPoints.map((point) => {
                const barWidth = Math.min(44, Math.max(18, chartStep * 0.45 || 34));
                const barY = chartHeight - chartPadBottom - point.barHeight;
                return (
                  <g key={point.key}>
                    <rect
                      x={point.x - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={point.barHeight}
                      rx="7"
                      fill="#0f9fa6"
                      opacity="0.22"
                    >
                      <title>{`${point.label}: ${currency.format(point.total)}`}</title>
                    </rect>
                    <text
                      x={point.x}
                      y={chartHeight - 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill="#35526f"
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}

              {areaPoints && <polygon points={areaPoints} fill="#0f9fa6" opacity="0.10" />}
              {linePoints && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#0f9fa6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {chartPoints.map((point) => (
                <g key={`${point.key}-point`}>
                  <circle cx={point.x} cy={point.y} r="6" fill="#f7c948" stroke="#082342" strokeWidth="2">
                    <title>{`${point.label}: ${currency.format(point.total)}`}</title>
                  </circle>
                  <text
                    x={point.x}
                    y={point.y - 11}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="900"
                    fill="#082342"
                  >
                    {currency.format(point.total).replace(".00", "")}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <form action="/earnings" className="space-y-2">
            <input type="hidden" name="range" value="day" />
            <label className="block text-xs font-black uppercase tracking-wide text-[#35526f]">
              Per Day
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                name="date"
                defaultValue={range.date}
                className="min-w-0 flex-1 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
              <button className="rounded-lg bg-[#0f9fa6] px-3 py-2 text-sm font-black text-white hover:bg-[#087d86]">
                View
              </button>
            </div>
          </form>

          <form action="/earnings" className="space-y-2">
            <input type="hidden" name="range" value="week" />
            <label className="block text-xs font-black uppercase tracking-wide text-[#35526f]">
              Per Week
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                name="date"
                defaultValue={range.date}
                className="min-w-0 flex-1 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
              <button className="rounded-lg bg-[#0f9fa6] px-3 py-2 text-sm font-black text-white hover:bg-[#087d86]">
                View
              </button>
            </div>
          </form>

          <form action="/earnings" className="space-y-2">
            <input type="hidden" name="range" value="month" />
            <label className="block text-xs font-black uppercase tracking-wide text-[#35526f]">
              Month
            </label>
            <div className="flex gap-2">
              <input
                type="month"
                name="month"
                defaultValue={range.month}
                className="min-w-0 flex-1 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
              <button className="rounded-lg bg-[#0f9fa6] px-3 py-2 text-sm font-black text-white hover:bg-[#087d86]">
                View
              </button>
            </div>
          </form>

          <form action="/earnings" className="space-y-2">
            <input type="hidden" name="range" value="year" />
            <label className="block text-xs font-black uppercase tracking-wide text-[#35526f]">
              Year
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="year"
                min="2000"
                max="2100"
                defaultValue={range.year}
                className="min-w-0 flex-1 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
              <button className="rounded-lg bg-[#0f9fa6] px-3 py-2 text-sm font-black text-white hover:bg-[#087d86]">
                View
              </button>
            </div>
          </form>

          <form action="/earnings" className="space-y-2">
            <input type="hidden" name="range" value="custom" />
            <label className="block text-xs font-black uppercase tracking-wide text-[#35526f]">
              Custom Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="from"
                defaultValue={range.from}
                className="min-w-0 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
              <input
                type="date"
                name="to"
                defaultValue={range.to}
                className="min-w-0 rounded-lg border border-[#87d8d8] bg-white px-3 py-2 text-sm font-semibold text-[#082342]"
              />
            </div>
            <button className="w-full rounded-lg bg-[#0f9fa6] px-3 py-2 text-sm font-black text-white hover:bg-[#087d86]">
              View Custom
            </button>
          </form>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#082342]">Earning Split</h2>
              <p className="text-xs font-semibold text-[#35526f]">Taxable parts, labour, and GST.</p>
            </div>
            <p className="rounded-full bg-[#d9f3f2] px-3 py-1 text-sm font-black text-[#082342]">
              {currency.format(totalEarnings)}
            </p>
          </div>
          <div className="mt-5 space-y-4">
            {[
              { label: "Parts Total", value: totalParts, color: "bg-[#0f9fa6]" },
              { label: "Labour Total", value: totalLabour, color: "bg-[#f7c948]" },
              { label: "GST Total", value: totalGst, color: "bg-[#f47d61]" },
            ].map((item) => {
              const percent = totalEarnings ? (item.value / totalEarnings) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold text-[#35526f]">{item.label}</span>
                    <span className="font-black text-[#082342]">
                      {currency.format(item.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#fff0d2]">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#082342]">Period Breakdown</h2>
              <p className="text-xs font-semibold text-[#35526f]">
                Grouped by {groupMode === "day" ? "date" : groupMode}.
              </p>
            </div>
          </div>

          {breakdown.length === 0 ? (
            <p className="rounded-lg bg-[#fff2c4] p-4 text-sm font-semibold text-[#35526f]">
              No Tax Invoice earnings in this period.
            </p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((item) => {
                const barWidth = (item.total / maxBreakdownTotal) * 100;
                const label =
                  groupMode === "year"
                    ? item.key
                    : groupMode === "month"
                    ? formatMonthLabel(item.key)
                    : formatDateLabel(item.key);
                return (
                  <div key={item.key}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="font-bold text-[#35526f]">
                        {label} | {item.count} invoice{item.count === 1 ? "" : "s"}
                      </span>
                      <span className="font-black text-[#082342]">
                        {currency.format(item.total)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#fff0d2]">
                      <div
                        className="h-2 rounded-full bg-[#0f9fa6]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#87d8d8] bg-[#fffaf0] shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#87d8d8] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[#082342]">Tax Invoice List</h2>
            <p className="text-xs font-semibold text-[#35526f]">Only final invoices are shown here.</p>
          </div>
          <p className="rounded-full bg-[#d9f3f2] px-3 py-1 text-sm font-black text-[#087d86]">
            {currency.format(totalEarnings)}
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-[#35526f]">
            No final Tax Invoices found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#87d8d8] bg-[#d9f3f2]">
                  <th className="px-4 py-3 text-left font-black text-[#35526f]">Invoice</th>
                  <th className="px-4 py-3 text-left font-black text-[#35526f]">Customer</th>
                  <th className="px-4 py-3 text-left font-black text-[#35526f]">Vehicle</th>
                  <th className="px-4 py-3 text-right font-black text-[#35526f]">GST</th>
                  <th className="px-4 py-3 text-right font-black text-[#35526f]">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#d7eeee] bg-white/70 hover:bg-[#fff2c4]/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/bills/${invoice.id}`}
                        className="font-black text-[#082342] hover:text-[#0f9fa6]"
                      >
                        {invoice.documentNumber || "No Number"}
                      </Link>
                      <div className="text-xs font-semibold text-[#6d7f91]">
                        {formatDateLabel(invoice.dateKey)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#35526f]">
                      {invoice.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#35526f]">{invoice.vehicleName}</div>
                      <div className="text-xs font-semibold text-[#0f9fa6]">
                        {invoice.vehicleNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#35526f]">
                      {currency.format(invoice.gstTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#082342]">
                      {currency.format(invoice.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
