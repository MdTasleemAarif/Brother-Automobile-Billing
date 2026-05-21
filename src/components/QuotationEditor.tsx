"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    html2pdf?: () => {
      set: (options: unknown) => {
        from: (element: HTMLElement) => {
          save: () => Promise<void>;
        };
      };
    };
  }
}

const fontOptions = [
  { label: "Montserrat Premium", value: "'Montserrat', sans-serif" },
  { label: "Poppins Modern", value: "'Poppins', sans-serif" },
  { label: "Bebas Bold", value: "'Bebas Neue', sans-serif" },
  { label: "Anton Strong", value: "'Anton', sans-serif" },
  { label: "Oswald Garage", value: "'Oswald', sans-serif" },
  { label: "Exo Tech", value: "'Exo 2', sans-serif" },
  { label: "Rajdhani Mechanical", value: "'Rajdhani', sans-serif" },
  { label: "Teko Automotive", value: "'Teko', sans-serif" },
  { label: "Cinzel Luxury", value: "'Cinzel', serif" },
  { label: "Playfair Premium", value: "'Playfair Display', serif" },
  { label: "Roboto Slab Solid", value: "'Roboto Slab', serif" },
  { label: "Merriweather Classic", value: "'Merriweather', serif" },
];

const writingFonts = [
  "Arial",
  "Helvetica",
  "Poppins",
  "Montserrat",
  "Lato",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

function formatDisplayDate(dateValue: string) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-IN");
}

export function QuotationEditor() {
  const writingAreaRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [logoData, setLogoData] = useState("/BA-logo.png");
  const [companyName, setCompanyName] = useState("BROTHERS AUTOMOBILES");
  const [companyFont, setCompanyFont] = useState("'Montserrat', sans-serif");
  const [tagline, setTagline] = useState(
    "Exclusive Body & Paint Multi Brand Cars Service Center"
  );
  const [taglineFont, setTaglineFont] = useState("'Poppins', sans-serif");
  const [gstin, setGstin] = useState("37BPKPS3819B1ZR");
  const [ownerName, setOwnerName] = useState("A. Sanaulla");
  const [phone1, setPhone1] = useState("+91-9666650584");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("brothersautomobilesvsp@gmail.com");
  const [companyAddress, setCompanyAddress] = useState(
    "#6-60-9/6/1, Chinagantyada, Opp. R.K. Hospital, Gajuwaka, Visakhapatnam, Andhra Pradesh."
  );
  const [refNo, setRefNo] = useState("REF-001");
  const [quoteDate, setQuoteDate] = useState("");
  const [signatureName, setSignatureName] = useState("Authorized Signatory");

  useEffect(() => {
    setQuoteDate(new Date().toISOString().split("T")[0]);
  }, []);

  const saveSelection = () => {
    const writingArea = writingAreaRef.current;
    const selection = window.getSelection();

    if (!writingArea || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (writingArea.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range;
    }
  };

  const restoreSelection = () => {
    const writingArea = writingAreaRef.current;
    if (!writingArea) return;

    writingArea.focus();

    if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRangeRef.current);
    }
  };

  const formatText = (command: string) => {
    restoreSelection();
    document.execCommand(command, false);
    saveSelection();
  };

  const applyFontName = (fontName: string) => {
    restoreSelection();
    document.execCommand("fontName", false, fontName);
    saveSelection();
  };

  const applyFontSize = (size: string) => {
    restoreSelection();
    document.execCommand("fontSize", false, size);
    saveSelection();
  };

  const applyTextColor = (color: string) => {
    restoreSelection();
    document.execCommand("foreColor", false, color);
    saveSelection();
  };

  const applyHighlight = (color: string) => {
    restoreSelection();
    document.execCommand("hiliteColor", false, color);
    saveSelection();
  };

  const insertHTML = (html: string) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    saveSelection();
  };

  const insertLine = () => insertHTML("<hr><br>");

  const insertSampleMatter = () => {
    insertHTML(`
      <p>Dear Sir/Madam,</p>
      <p>As per inspection of the vehicle, please find below the estimated garage quotation.</p>
      <p><strong>Vehicle No:</strong> __________________________</p>
      <p><strong>Car Model:</strong> __________________________</p>
      <p><strong>Chassis Number:</strong> __________________________</p>
      <p><strong>Engine Number:</strong> __________________________</p>
      <p><strong>Work Details:</strong> __________________________</p>
      <p><strong>Estimated Amount:</strong> Rs. ____________________</p>
      <p>Kindly approve the above quotation to proceed with the work.</p>
    `);
  };

  const insertQuotationTable = () => {
    insertHTML(`
      <table>
        <thead>
          <tr>
            <th style="width:45px;">S.No</th>
            <th>Description</th>
            <th style="width:70px;">Qty</th>
            <th style="width:90px;">Rate</th>
            <th style="width:100px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Garage work item</td>
            <td>1</td>
            <td>Rs. 0.00</td>
            <td>Rs. 0.00</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Labour charges</td>
            <td>1</td>
            <td>Rs. 0.00</td>
            <td>Rs. 0.00</td>
          </tr>
        </tbody>
      </table>
      <br>
    `);
  };

  const getNodeElement = (node: Node | null) => {
    if (!node) return null;
    return node.nodeType === 1 ? (node as Element) : node.parentElement;
  };

  const getActiveCell = () => {
    const writingArea = writingAreaRef.current;
    restoreSelection();

    const selection = window.getSelection();
    if (!writingArea || !selection?.rangeCount) return null;

    let node = getNodeElement(selection.getRangeAt(0).commonAncestorContainer);

    while (node && node !== writingArea) {
      if (node.tagName === "TD" || node.tagName === "TH") {
        return node as HTMLTableCellElement;
      }
      node = node.parentElement;
    }

    return null;
  };

  const getActiveTable = () => {
    const writingArea = writingAreaRef.current;
    const cell = getActiveCell();

    if (cell) return cell.closest("table");
    const tables = writingArea?.querySelectorAll("table");
    return tables?.length ? tables[tables.length - 1] : null;
  };

  const getColumnIndex = (cell: HTMLTableCellElement | null) => {
    if (!cell || !cell.parentElement) return 0;
    return Array.from(cell.parentElement.children).indexOf(cell);
  };

  const addTableRow = () => {
    const table = getActiveTable();
    if (!table) {
      alert("First add a table or click inside a table.");
      return;
    }

    const cell = getActiveCell();
    const rows = Array.from(table.rows);
    const activeRow = cell?.parentElement || rows[rows.length - 1];
    const columnCount = activeRow.children.length;
    const newRow = document.createElement("tr");

    for (let i = 0; i < columnCount; i += 1) {
      const td = document.createElement("td");
      td.innerHTML = "<br>";
      newRow.appendChild(td);
    }

    activeRow.parentNode?.insertBefore(newRow, activeRow.nextSibling);
  };

  const removeTableRow = () => {
    const table = getActiveTable();
    if (!table) {
      alert("First click inside a table.");
      return;
    }

    const cell = getActiveCell();
    const rows = Array.from(table.rows);
    if (rows.length <= 1) {
      alert("At least one row is required.");
      return;
    }

    const activeRow = cell?.parentElement || rows[rows.length - 1];
    activeRow.remove();
  };

  const addTableColumn = () => {
    const table = getActiveTable();
    if (!table) {
      alert("First add a table or click inside a table.");
      return;
    }

    const cell = getActiveCell();
    const columnIndex = cell ? getColumnIndex(cell) : table.rows[0].cells.length - 1;

    Array.from(table.rows).forEach((row) => {
      const isHeader = row.parentElement?.tagName === "THEAD";
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.innerHTML = isHeader ? "New Column" : "<br>";

      if (row.cells[columnIndex]) {
        row.insertBefore(newCell, row.cells[columnIndex].nextSibling);
      } else {
        row.appendChild(newCell);
      }
    });
  };

  const removeTableColumn = () => {
    const table = getActiveTable();
    if (!table) {
      alert("First click inside a table.");
      return;
    }

    const cell = getActiveCell();
    const columnIndex = cell ? getColumnIndex(cell) : table.rows[0].cells.length - 1;
    const columnCount = table.rows[0].cells.length;

    if (columnCount <= 1) {
      alert("At least one column is required.");
      return;
    }

    Array.from(table.rows).forEach((row) => {
      row.cells[columnIndex]?.remove();
    });
  };

  const clearWritingArea = () => {
    if (confirm("Do you want to clear the full writing area?")) {
      if (writingAreaRef.current) writingAreaRef.current.innerHTML = "";
    }
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogoData(String(event.target?.result || ""));
    reader.readAsDataURL(file);
  };

  const downloadPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    if (!window.html2pdf) {
      window.print();
      return;
    }

    await document.fonts?.ready;
    element.classList.add("exporting");

    try {
      const fileName = `${refNo || "garage-quotation"}.pdf`;
      await window
        .html2pdf()
        .set({
          margin: 0,
          filename: fileName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } finally {
      element.classList.remove("exporting");
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        strategy="afterInteractive"
      />

      <div className="quotation-app">
        <aside className="quotation-sidebar">
          <h2>Garage Quotation</h2>

          <button className="q-btn q-btn-primary" onClick={downloadPDF}>
            Download PDF
          </button>
          <button className="q-btn q-btn-green" onClick={() => window.print()}>
            Print
          </button>

          <div className="q-section">
            <h3>Company Details</h3>

            <label>Upload Logo</label>
            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />

            <button className="q-btn q-btn-secondary" onClick={() => setLogoData("")}>
              Remove Logo
            </button>

            <label>Company Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

            <label>Company Name Font</label>
            <select value={companyFont} onChange={(e) => setCompanyFont(e.target.value)}>
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>

            <label>Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} />

            <label>Tagline Font</label>
            <select value={taglineFont} onChange={(e) => setTaglineFont(e.target.value)}>
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>

            <label>GSTIN Optional</label>
            <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} />

            <label>Name / Owner Name Optional</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />

            <label>Phone Number 1</label>
            <input value={phone1} onChange={(e) => setPhone1(e.target.value)} />

            <label>Phone Number 2 Optional</label>
            <input value={phone2} onChange={(e) => setPhone2(e.target.value)} />

            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />

            <label>Address</label>
            <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
          </div>

          <div className="q-section">
            <h3>Ref Details</h3>
            <label>Ref No</label>
            <input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            <label>Date</label>
            <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          </div>

          <div className="q-section">
            <h3>Important Writing Tools</h3>

            <div className="q-toolbar">
              <select className="wide-tool" onChange={(e) => applyFontName(e.target.value)}>
                {writingFonts.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>

              <select className="wide-tool" onChange={(e) => applyFontSize(e.target.value)}>
                <option value="3">Normal</option>
                <option value="2">Small</option>
                <option value="4">Medium</option>
                <option value="5">Large</option>
                <option value="6">Extra Large</option>
              </select>

              <button onClick={() => formatText("bold")}>B</button>
              <button onClick={() => formatText("italic")}>I</button>
              <button onClick={() => formatText("underline")}>U</button>
              <button onClick={() => formatText("strikeThrough")}>S</button>

              <button onClick={() => formatText("justifyLeft")}>Left</button>
              <button onClick={() => formatText("justifyCenter")}>Center</button>
              <button onClick={() => formatText("justifyRight")}>Right</button>
              <button onClick={() => formatText("justifyFull")}>Justify</button>

              <button onClick={() => formatText("insertUnorderedList")}>List</button>
              <button onClick={() => formatText("insertOrderedList")}>1. List</button>
              <button onClick={() => formatText("indent")}>Indent</button>
              <button onClick={() => formatText("outdent")}>Outdent</button>

              <label>Text</label>
              <input type="color" defaultValue="#082342" onChange={(e) => applyTextColor(e.target.value)} />
              <label>Highlight</label>
              <input type="color" defaultValue="#fff2c4" onChange={(e) => applyHighlight(e.target.value)} />

              <button onClick={() => formatText("undo")}>Undo</button>
              <button onClick={() => formatText("redo")}>Redo</button>
              <button onClick={() => formatText("removeFormat")}>Clear</button>
              <button onClick={insertLine}>Line</button>

              <button className="wide-tool" onClick={insertSampleMatter}>
                Sample Matter
              </button>
              <button className="wide-tool table-tool" onClick={insertQuotationTable}>
                Add Table
              </button>
              <button className="wide-tool table-tool" onClick={addTableRow}>
                + Row
              </button>
              <button className="wide-tool table-tool" onClick={removeTableRow}>
                - Row
              </button>
              <button className="wide-tool table-tool" onClick={addTableColumn}>
                + Column
              </button>
              <button className="wide-tool table-tool" onClick={removeTableColumn}>
                - Column
              </button>
              <button className="full-tool" onClick={clearWritingArea}>
                Clear Full Writing Area
              </button>
            </div>
          </div>

          <div className="q-section">
            <h3>Signature</h3>
            <label>Authorized Signatory</label>
            <input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
          </div>
        </aside>

        <section className="quotation-preview-wrap">
          <div className="quotation-paper" ref={printAreaRef}>
            <div className="quotation-letter-head">
              <div className="quotation-top-line">
                <div className="quotation-top-left">
                  {gstin.trim() && (
                    <div>
                      GSTIN : <span>{gstin}</span>
                    </div>
                  )}
                  {ownerName.trim() && (
                    <div>
                      Name : <span>{ownerName}</span>
                    </div>
                  )}
                </div>

                <div className="quotation-top-right">
                  {phone1.trim() && (
                    <div>
                      Cell : <span>{phone1}</span>
                    </div>
                  )}
                  {phone2.trim() && (
                    <div>
                      Cell : <span>{phone2}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="quotation-brand">
                {logoData && (
                  <div className="quotation-logo-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoData} alt="Company Logo" />
                  </div>
                )}

                <div>
                  <div
                    className="quotation-company-name"
                    style={{ fontFamily: companyFont }}
                  >
                    {companyName}
                  </div>
                  <div className="quotation-tagline" style={{ fontFamily: taglineFont }}>
                    {tagline}
                  </div>
                </div>
              </div>
            </div>

            <div className="quotation-ref-date-row">
              <div className="quotation-ref-box">
                <strong>Ref No:</strong>
                <span>{refNo}</span>
              </div>

              <div className="quotation-date-box">
                <strong>Date:</strong>
                <span>{formatDisplayDate(quoteDate)}</span>
              </div>
            </div>

            <div
              className="quotation-writing-area"
              ref={writingAreaRef}
              contentEditable
              suppressContentEditableWarning
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              onInput={saveSelection}
              onFocus={saveSelection}
              onClick={saveSelection}
            />

            <div className="quotation-signature-area">
              <div className="quotation-sign-box">
                <div className="quotation-sign-line">{signatureName}</div>
              </div>
            </div>

            <div className="quotation-bottom-address">
              <div>{companyAddress}</div>
              <div>
                E-mail : <span>{email}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Cinzel:wght@700&family=Exo+2:wght@700;800&family=Lato:wght@400;700;900&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700;800;900&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700;800;900&family=Rajdhani:wght@400;700&family=Roboto+Slab:wght@400;700&family=Teko:wght@400;700&display=swap");

        .quotation-app {
          display: grid;
          grid-template-columns: 390px 1fr;
          min-height: calc(100vh - 110px);
          overflow: hidden;
          border: 1px solid #87d8d8;
          border-radius: 8px;
          background: #fffaf0;
          box-shadow: 0 18px 50px rgba(8, 35, 66, 0.12);
        }

        .quotation-sidebar {
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          background: #082342;
          color: white;
          padding: 18px;
        }

        .quotation-sidebar h2 {
          margin: 0 0 14px;
          color: #fffaf0;
          font-size: 22px;
          font-weight: 900;
        }

        .q-section {
          margin-bottom: 14px;
          border: 1px solid rgba(135, 216, 216, 0.28);
          border-radius: 8px;
          background: rgba(255, 250, 240, 0.07);
          padding: 14px;
        }

        .q-section h3 {
          margin: 0 0 12px;
          color: #87d8d8;
          font-size: 15px;
          font-weight: 900;
        }

        .quotation-sidebar label {
          display: block;
          margin-bottom: 5px;
          color: #d9f3f2;
          font-size: 12px;
          font-weight: 800;
        }

        .quotation-sidebar input,
        .quotation-sidebar textarea,
        .quotation-sidebar select {
          width: 100%;
          margin-bottom: 10px;
          border: 1px solid rgba(135, 216, 216, 0.45);
          border-radius: 8px;
          background: #051a33;
          color: white;
          padding: 10px;
          font-size: 13px;
          outline: none;
        }

        .quotation-sidebar textarea {
          min-height: 80px;
          resize: vertical;
        }

        .q-btn,
        .q-toolbar button {
          border: 0;
          cursor: pointer;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .q-btn {
          width: 100%;
          margin-bottom: 10px;
        }

        .q-btn-primary {
          background: #0f9fa6;
          color: white;
        }

        .q-btn-green {
          background: #f7c948;
          color: #082342;
        }

        .q-btn-secondary {
          background: rgba(255, 250, 240, 0.14);
          color: white;
        }

        .q-toolbar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .q-toolbar button,
        .q-toolbar select,
        .q-toolbar input[type="color"] {
          width: 100%;
          margin-bottom: 0;
          border-radius: 8px;
          font-size: 12px;
        }

        .q-toolbar button {
          background: rgba(255, 250, 240, 0.14);
          color: white;
          padding: 9px 8px;
        }

        .q-toolbar .table-tool {
          background: #0f9fa6;
        }

        .wide-tool {
          grid-column: span 2;
        }

        .full-tool {
          grid-column: span 4;
        }

        .quotation-preview-wrap {
          overflow: auto;
          padding: 30px;
          background:
            radial-gradient(circle at top left, rgba(15, 159, 166, 0.15), transparent 22rem),
            #fff8ea;
        }

        .quotation-paper {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          margin: auto;
          background: white;
          padding: 12mm;
          box-shadow: 0 20px 60px rgba(8, 35, 66, 0.25);
        }

        .quotation-paper.exporting {
          height: 297mm;
          min-height: 297mm;
          overflow: hidden;
          box-shadow: none;
        }

        .quotation-letter-head {
          border-bottom: 3px double #0f9fa6;
          padding-bottom: 8px;
        }

        .quotation-top-line {
          display: flex;
          min-height: 18px;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
          color: #082342;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
        }

        .quotation-top-left,
        .quotation-top-right {
          min-width: 180px;
        }

        .quotation-top-right {
          text-align: right;
        }

        .quotation-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .quotation-logo-wrap {
          display: flex;
          width: 72px;
          height: 72px;
          align-items: center;
          justify-content: center;
        }

        .quotation-logo-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .quotation-company-name {
          color: #082342;
          font-size: 31px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1;
          text-transform: uppercase;
        }

        .quotation-tagline {
          display: inline-block;
          margin-top: 6px;
          border-top: 2px solid #0f9fa6;
          border-bottom: 2px solid #0f9fa6;
          color: #082342;
          padding: 2px 8px;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .quotation-ref-date-row {
          display: flex;
          width: 100%;
          align-items: flex-start;
          justify-content: space-between;
          margin-top: 18px;
          font-size: 14px;
          line-height: 1.8;
        }

        .quotation-ref-box,
        .quotation-date-box {
          display: grid;
          width: 260px;
          grid-template-columns: 75px 1fr;
          gap: 8px;
        }

        .quotation-date-box {
          margin-left: auto;
        }

        .quotation-ref-box strong,
        .quotation-date-box strong {
          color: #0f9fa6;
        }

        .quotation-ref-box span,
        .quotation-date-box span {
          display: block;
          min-height: 22px;
          border-bottom: 1px dotted #6d7f91;
        }

        .quotation-writing-area {
          min-height: 160mm;
          margin-top: 22px;
          padding: 8px;
          color: #082342;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          outline: none;
          white-space: normal;
        }

        .quotation-writing-area:empty::before {
          color: #6d7f91;
          content: "Write quotation matter here...";
        }

        .quotation-paper.exporting .quotation-writing-area:empty::before {
          content: "";
        }

        .quotation-writing-area table {
          width: 100%;
          margin: 12px 0;
          border-collapse: collapse;
          font-size: 14px;
        }

        .quotation-writing-area th {
          border: 1px solid #0f9fa6;
          background: #0f9fa6;
          color: white;
          padding: 7px;
          text-align: left;
        }

        .quotation-writing-area td {
          min-height: 28px;
          border: 1px solid #b7eceb;
          padding: 7px;
        }

        .quotation-writing-area td:focus,
        .quotation-writing-area th:focus {
          outline: 2px solid #f7c948;
        }

        .quotation-signature-area {
          display: flex;
          align-items: end;
          justify-content: flex-end;
          margin-top: 35px;
          font-size: 13px;
        }

        .quotation-sign-box {
          min-width: 190px;
          text-align: center;
        }

        .quotation-sign-line {
          border-top: 1px solid #082342;
          padding-top: 6px;
          font-weight: 800;
        }

        .quotation-bottom-address {
          position: absolute;
          right: 12mm;
          bottom: 10mm;
          left: 12mm;
          border-top: 2px solid #0f9fa6;
          padding-top: 6px;
          color: #082342;
          text-align: center;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 980px) {
          .quotation-app {
            grid-template-columns: 1fr;
          }

          .quotation-sidebar {
            max-height: none;
          }
        }

        @media print {
          body {
            background: white;
          }

          body > header,
          .quotation-sidebar {
            display: none !important;
          }

          main {
            max-width: none !important;
            padding: 0 !important;
          }

          .quotation-app {
            display: block;
            border: 0;
            box-shadow: none;
          }

          .quotation-preview-wrap {
            padding: 0;
            background: white;
          }

          .quotation-paper {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            box-sizing: border-box;
            margin: 0;
            box-shadow: none;
          }

          .quotation-writing-area:empty::before {
            content: "";
          }
        }

        @page {
          size: A4;
          margin: 0;
        }
      `}</style>
    </>
  );
}
