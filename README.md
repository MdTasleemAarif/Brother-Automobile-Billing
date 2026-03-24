# 🔧 Brothers Automobiles — Garage Billing System

A full-stack billing web application for **Brothers Automobiles** built with Next.js 15 (App Router), Tailwind CSS, PostgreSQL, and Prisma ORM. Generates pixel-perfect PDFs matching your existing Estimate, Proforma Invoice, and Tax Invoice formats.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+ (local or cloud like Neon / Supabase / Railway)
- **npm** or **yarn**
Tasleem@786
---

## 📦 Installation

### Step 1 — Install Dependencies

```bash
cd garage-billing
npm install
```

### Step 2 — Set up Environment Variables

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/garage_billing?schema=public"
```

**PostgreSQL connection string formats:**
- Local: `postgresql://postgres:password@localhost:5432/garage_billing`
- Neon: `postgresql://user:pass@ep-xxx.neon.tech/garage_billing?sslmode=require`
- Supabase: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`
- Railway: (copy from Railway dashboard)

### Step 3 — Set up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

### Step 4 — Add Your Logo (Optional but Recommended)

Place your logo file at:
```
public/BA-logo.png
```

The PDF will automatically use it. Without the logo, a placeholder box is shown.

### Step 5 — Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
garage-billing/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── BA-logo.png            # ← Put your logo here!
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── bills/
│   │   │       ├── route.ts           # GET all, POST create
│   │   │       └── [id]/
│   │   │           ├── route.ts       # GET, PUT, DELETE
│   │   │           └── pdf/
│   │   │               └── route.ts   # PDF generation
│   │   ├── bills/
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # Create new bill
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # View bill
│   │   │       └── edit/
│   │   │           └── page.tsx       # Edit bill
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Dashboard / bill list
│   ├── components/
│   │   ├── BillForm.tsx               # Create form
│   │   └── EditBillForm.tsx           # Edit form
│   └── lib/
│       ├── calculations.ts            # GST & total calculations
│       ├── numberToWords.ts           # Amount in words (Indian)
│       ├── prisma.ts                  # Prisma client singleton
│       ├── types.ts                   # TypeScript types
│       └── pdf/
│           └── BillPdf.tsx            # React PDF document
```

---

## 📄 Document Types

| Type | Label | Doc Number Prefix |
|------|-------|-------------------|
| Estimate | Estimate | RFE No |
| Proforma Invoice | Proforma Invoice | Proforma Invoice No |
| Tax Invoice | Tax Invoice | Invoice No |

---

## 💡 Features

- ✅ **Three document types** — Estimate, Proforma Invoice, Tax Invoice
- ✅ **PDF generation** — Pixel-perfect match to your existing PDFs
- ✅ **Logo support** — Place `BA-logo.png` in `/public`
- ✅ **GST control** — Default 18%, change globally or per row
- ✅ **Live totals** — Real-time calculation as you type
- ✅ **Parts & Labour tables** — Separate numbered sections
- ✅ **Amount in words** — Indian number system (Lakhs/Crores)
- ✅ **CGST + SGST split** — Tax summary table in PDF
- ✅ **Insurance company details** — Full address block
- ✅ **Edit & Delete** — Full CRUD operations
- ✅ **Pre-filled garage info** — Brothers Automobiles defaults

---

## 🎨 PDF Layout

The generated PDF exactly matches your uploaded invoices:
- Header with logo + garage name + GSTIN
- Info block: document number, date, job card, vehicle, customer, insurance
- **Parts table** with subtotals (Taxable Value, GST, Round off)
- **Labour table** with subtotals  
- **CGST/SGST summary** table
- Amount in words
- Grand Total block (Parts Total, Labour Total, GST, Grand Total, Round Off, Balance)
- Signature row (Customer / Advisor / Cashier)
- Page numbers

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build
npm run start

# Database
npm run db:push        # Push schema changes
npm run db:generate    # Regenerate Prisma client
npm run db:studio      # Open Prisma Studio (visual DB editor)
npm run db:migrate     # Create migration file
```

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy — Vercel auto-runs `prisma generate` during build

Add to `package.json` scripts for Vercel:
```json
"postinstall": "prisma generate"
```

### Self-hosted
```bash
npm run build
npm run db:push
npm run start
```

---

## 🔧 Troubleshooting

**PDF not generating?**
- Check `DATABASE_URL` is correct
- Run `npm run db:push` to ensure tables exist
- Check server console for errors

**Logo not showing?**
- File must be named exactly `BA-logo.png`
- Must be placed in the `public/` folder (not `src/`)
- PNG format required

**Database connection error?**
- Verify PostgreSQL is running
- Check username/password in `DATABASE_URL`
- Ensure database exists: `CREATE DATABASE garage_billing;`






# 1. Unzip and enter the folder
unzip garage-billing-app.zip && cd garage-billing

# 2. Install dependencies
npm install

# 3. Add your database connection to .env
cp .env.example .env
# Edit .env → set DATABASE_URL="postgresql://user:pass@localhost:5432/garage_billing"

# 4. Push schema to database
npm run db:generate && npm run db:push

# 5. Start the app
npm run dev
# → Open http://localhost:3000