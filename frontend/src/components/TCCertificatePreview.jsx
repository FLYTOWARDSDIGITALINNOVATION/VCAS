import React from 'react';
import { Printer, X, Edit3, Award } from 'lucide-react';
import vcasLogo from '../assets/vcas-logo.png';

/**
 * Format date from YYYY-MM-DD to DD-MM-YYYY or return as-is
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  return dateStr;
}

/**
 * Combine Nationality & Religion if separate, matching the original format: "INDIAN & HINDU"
 */
function getNationalityReligion(data = {}) {
  const nat = (data.nationality || '').trim();
  const rel = (data.religion || '').trim();
  if (nat && rel) {
    if (nat.toUpperCase().includes(rel.toUpperCase())) return nat.toUpperCase();
    return `${nat.toUpperCase()} & ${rel.toUpperCase()}`;
  }
  return (nat || rel || 'INDIAN & HINDU').toUpperCase();
}

/**
 * Generates standalone printable HTML for A4 print / PDF export
 * Designed to exactly replicate the official Vivekananda College TC format
 */
export function generatePrintableTCHtml(tcData = {}) {
  const logoSrc = tcData.logoSrc || '/vcas-logo.png';
  const natRel = getNationalityReligion(tcData);

  const photoHtml = tcData.photo
    ? `<img src="${tcData.photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="Student Photo" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:9px;color:#64748b;text-align:center;padding:4px;line-height:1.2;">AFFIX<br/>PASSPORT<br/>PHOTO</div>`;

  const principalSignHtml = tcData.principalSignature
    ? `<img src="${tcData.principalSignature}" style="max-height: 52px; max-width: 160px; object-fit: contain; margin-bottom: 4px;" alt="Principal Signature" />`
    : `<div style="height: 40px;"></div>`;

  const collegeSealHtml = tcData.collegeSeal
    ? `<img src="${tcData.collegeSeal}" style="max-height: 80px; max-width: 130px; object-fit: contain; margin-bottom: 4px;" alt="College Seal" />`
    : `<div style="height: 45px;"></div>`;

  const studentSignHtml = tcData.studentSignature
    ? `<img src="${tcData.studentSignature}" style="max-height: 36px; max-width: 140px; object-fit: contain; margin-bottom: 4px;" alt="Student Signature" />`
    : `<div style="height: 28px;"></div>`;

  const parentSignHtml = tcData.parentSignature
    ? `<img src="${tcData.parentSignature}" style="max-height: 36px; max-width: 140px; object-fit: contain; margin-bottom: 4px;" alt="Parent Signature" />`
    : `<div style="height: 28px;"></div>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Transfer Certificate - ${tcData.tcNumber || 'TC'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background-color: #f1f5f9;
          font-family: 'Times New Roman', Times, Georgia, serif;
          color: #000000;
          line-height: 1.25;
        }
        .no-print {
          padding: 12px 18px;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .btn-print {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-print:hover { background: #1d4ed8; }
        .cert-container {
          width: 190mm;
          min-height: 272mm;
          margin: 16px auto;
          background: #ffffff;
          border: 1.5px solid #000000;
          padding: 8mm 10mm 8mm 10mm;
          position: relative;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .tc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5pt;
        }
        .tc-table td {
          padding: 2px 0;
          vertical-align: top;
        }
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .cert-container {
            width: 100%;
            min-height: 275mm;
            margin: 0;
            padding: 6mm 8mm 6mm 8mm;
            border: 1.5px solid #000000;
            box-shadow: none;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div style="font-weight: bold; font-size: 14px;">
          🎓 VCAS Transfer Certificate Official Print Preview
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" onclick="window.print()">
            🖨️ Print Certificate (Save as PDF)
          </button>
        </div>
      </div>

      <div class="cert-container">
        
        <!-- Header Section -->
        <div style="position: relative; text-align: center; margin-bottom: 6px;">
          <img src="${logoSrc}" style="position: absolute; right: 0; top: 0; width: 62px; height: 62px; object-fit: contain;" alt="College Emblem" />
          <div style="font-size: 17pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Times New Roman', serif;">
            VIVEKANANDA COLLEGE OF ARTS & SCIENCE
          </div>
          <div style="font-size: 10pt; font-style: italic; margin-top: 2px; color: #111;">
            (Affiliated to Manonmaniam Sundaranar University)
          </div>
          <div style="font-size: 10pt; margin-top: 2px; color: #111;">
            Vellalankulam, Tenkasi District – 627857
          </div>

          <!-- Reg No & TC No Banner -->
          <div style="display: flex; justify-content: space-between; font-size: 10.5pt; font-weight: bold; margin-top: 10px; padding: 0 2px;">
            <span>Reg No.: ${tcData.regNo || '—'}</span>
            ${tcData.umisNumber ? `<span>UMIS No.: ${tcData.umisNumber}</span>` : ''}
            <span>T.C. No.: ${tcData.tcNumber || '—'}</span>
          </div>

          <!-- Document Title -->
          <div style="text-align: center; margin-top: 6px; margin-bottom: 8px;">
            <span style="font-size: 12.5pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; text-transform: uppercase;">TRANSFER CERTIFICATE</span>
          </div>
        </div>

        <!-- Perfectly Aligned 5-Column Table Layout -->
        <table class="tc-table">
          <tbody>
            <!-- 1. NAME -->
            <tr>
              <td style="width: 26px; font-weight: normal;">1.</td>
              <td style="width: 240px; font-weight: normal; text-transform: uppercase;">NAME</td>
              <td style="width: 16px; text-align: center;">:</td>
              <td style="font-weight: bold; text-transform: uppercase;">${(tcData.studentName || '—').toUpperCase()}</td>
              <td rowspan="5" style="width: 95px; text-align: right; padding-left: 8px;">
                <div style="width: 92px; height: 114px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; background: #fff; overflow: hidden;">
                  ${photoHtml}
                </div>
              </td>
            </tr>

            <!-- 2. GENDER -->
            <tr>
              <td style="font-weight: normal;">2.</td>
              <td style="font-weight: normal; text-transform: uppercase;">GENDER</td>
              <td style="text-align: center;">:</td>
              <td style="font-weight: bold; text-transform: uppercase;">${(tcData.gender || '—').toUpperCase()}</td>
            </tr>

            <!-- 3. DATE OF BIRTH -->
            <tr>
              <td style="font-weight: normal;">3.</td>
              <td style="font-weight: normal; text-transform: uppercase;">DATE OF BIRTH</td>
              <td style="text-align: center;">:</td>
              <td style="font-weight: bold;">${formatDisplayDate(tcData.dob)}</td>
            </tr>

            <!-- 3b. (IN WORDS) -->
            <tr>
              <td></td>
              <td style="font-weight: normal; text-transform: uppercase;">(IN WORDS)</td>
              <td style="text-align: center;">:</td>
              <td style="font-weight: bold; text-transform: uppercase; font-size: 9pt;">${(tcData.dobWords || '—').toUpperCase()}</td>
            </tr>

            <!-- 4. FATHER'S NAME -->
            <tr>
              <td style="font-weight: normal;">4.</td>
              <td style="font-weight: normal; text-transform: uppercase;">FATHER'S NAME</td>
              <td style="text-align: center;">:</td>
              <td style="font-weight: bold; text-transform: uppercase;">${(tcData.fatherName || '—').toUpperCase()}</td>
            </tr>

            <!-- 5. NATIONALITY & RELIGION - Strictly below Row 4 with normal line spacing -->
            <tr>
              <td style="font-weight: normal;">5.</td>
              <td style="font-weight: normal; text-transform: uppercase;">NATIONALITY & RELIGION</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">${natRel}</td>
            </tr>

            <!-- 6. CASTE AND COMMUNITY -->
            <tr>
              <td style="font-weight: normal;">6.</td>
              <td style="font-weight: normal; text-transform: uppercase;">CASTE AND COMMUNITY</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">${(tcData.casteCommunity || '—').toUpperCase()}</td>
            </tr>

            <!-- 7. DATE OF ADMISSION -->
            <tr>
              <td style="font-weight: normal;">7.</td>
              <td style="font-weight: normal; text-transform: uppercase;">DATE OF ADMISSION</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold;">${formatDisplayDate(tcData.dateOfAdmission)}</td>
            </tr>

            <!-- 8. COURSE IN WHICH ADMITTED -->
            <tr>
              <td style="font-weight: normal;">8.</td>
              <td style="font-weight: normal; text-transform: uppercase;">COURSE IN WHICH ADMITTED</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">${(tcData.courseAdmitted || '—').toUpperCase()}</td>
            </tr>

            <!-- 9. SUBJECT STUDIED -->
            <tr>
              <td style="font-weight: normal;">9.</td>
              <td style="font-weight: normal; text-transform: uppercase;">SUBJECT STUDIED</td>
              <td style="text-align: center;"></td>
              <td colspan="2"></td>
            </tr>

            <!-- Sub items Part-I, II, III -->
            <tr>
              <td></td>
              <td colspan="4" style="padding-left: 140px;">
                <div style="display: flex; flex-direction: column; gap: 2px; font-size: 9.5pt;">
                  <div style="display: flex; gap: 14px;">
                    <span style="width: 75px; font-weight: normal;">PART-I</span>
                    <span style="width: 14px; text-align: center;">-</span>
                    <span style="font-weight: bold; text-transform: uppercase;">${(tcData.subjectStudiedPart1 || 'TAMIL').toUpperCase()}</span>
                  </div>
                  <div style="display: flex; gap: 14px;">
                    <span style="width: 75px; font-weight: normal;">PART-II</span>
                    <span style="width: 14px; text-align: center;">-</span>
                    <span style="font-weight: bold; text-transform: uppercase;">${(tcData.subjectStudiedPart2 || 'ENGLISH').toUpperCase()}</span>
                  </div>
                  <div style="display: flex; gap: 14px;">
                    <span style="width: 75px; font-weight: normal;">PART- III</span>
                    <span style="width: 14px; text-align: center;">-</span>
                    <span style="font-weight: bold; text-transform: uppercase;">${(tcData.subjectStudiedPart3 || 'CRIMINOLOGY AND FORENSIC SCIENCE').toUpperCase()}</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- MEDIUM OF INSTRUCTION -->
            <tr>
              <td></td>
              <td style="font-weight: normal; text-transform: uppercase; text-align: right; padding-right: 6px;">MEDIUM OF INSTRUCTION</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">${(tcData.mediumOfInstruction || 'ENGLISH').toUpperCase()}</td>
            </tr>

            <!-- 10. CLASS/YEAR AT THE TIME OF LEAVING -->
            <tr>
              <td style="font-weight: normal;">10.</td>
              <td style="font-weight: normal; text-transform: uppercase; line-height: 1.2;">CLASS/YEAR AT THE TIME OF<br/>LEAVING</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; line-height: 1.2;">${tcData.classAtLeaving || '—'}</td>
            </tr>

            <!-- 11. WHETHER QUALIFIED FOR PROMOTION TO HIGHER STUDIES -->
            <tr>
              <td style="font-weight: normal;">11.</td>
              <td style="font-weight: normal; text-transform: uppercase; line-height: 1.2;">WHETHER QUALIFIED FOR<br/>PROMOTION TO HIGHER STUDIES</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase; line-height: 1.2;">${(tcData.qualifiedForPromotion || '—').toUpperCase()}</td>
            </tr>

            <!-- 12. PERSONAL MARKS / IDENTIFICATION -->
            <tr>
              <td style="font-weight: normal;">12.</td>
              <td style="font-weight: normal; text-transform: uppercase;">PERSONAL MARKS / IDENTIFICATION</td>
              <td style="text-align: center;"></td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase; line-height: 1.35;">
                <div>A)&nbsp;&nbsp;${(tcData.idMark1 || '—').toUpperCase()}</div>
                <div style="margin-top: 2px;">B)&nbsp;&nbsp;${(tcData.idMark2 || '—').toUpperCase()}</div>
              </td>
            </tr>

            <!-- 13. DATE OF TRANSFER CERTIFICATE -->
            <tr>
              <td style="font-weight: normal;">13.</td>
              <td style="font-weight: normal; text-transform: uppercase;">DATE OF TRANSFER CERTIFICATE</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold;">${formatDisplayDate(tcData.tcDate)}</td>
            </tr>

            <!-- CONDUCT AND CHARACTER -->
            <tr>
              <td></td>
              <td style="font-weight: normal; text-transform: uppercase;">CONDUCT AND CHARACTER</td>
              <td style="text-align: center;">:</td>
              <td colspan="2" style="font-weight: bold; text-transform: uppercase;">${(tcData.conduct || 'GOOD').toUpperCase()}</td>
            </tr>
          </tbody>
        </table>

        <!-- Seal & Principal Row (Clearly visible & naturally spaced) -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; margin-bottom: 10px; padding: 0 10px;">
          <div style="text-align: center; width: 170px;">
            ${collegeSealHtml}
            <div style="font-size: 9.5pt; font-weight: normal; color: #000;">College Seal</div>
          </div>
          <div style="text-align: center; width: 220px;">
            ${principalSignHtml}
            <div style="font-size: 9.5pt; font-weight: normal; color: #000;">Signature of the Principal</div>
          </div>
        </div>

        <!-- Declaration Section with Larger, Clear Font -->
        <div style="margin-top: 8px;">
          <div style="text-align: center; margin-bottom: 6px;">
            <span style="font-size: 10pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px;">DECLARATION BY THE PARENT / GUARDIAN</span>
          </div>
          <div style="font-size: 10pt; font-weight: 500; text-align: left; text-indent: 12px; line-height: 1.45; color: #000; margin-bottom: 20px; padding: 0 4px;">
            ${tcData.declarationText || 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.'}
          </div>

          <!-- Student & Parent Signatures -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px;">
            <div style="text-align: center; width: 190px;">
              ${studentSignHtml}
              <div style="font-size: 9.5pt; font-weight: normal; color: #000;">Signature of the Student</div>
            </div>
            <div style="text-align: center; width: 220px;">
              ${parentSignHtml}
              <div style="font-size: 9.5pt; font-weight: normal; color: #000;">Signature of the Parent / Guardian</div>
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Triggers clean print/PDF popup
 */
export function openTCPrintWindow(tcData) {
  const printWin = window.open('', '_blank', 'width=950,height=950');
  if (!printWin) {
    alert('Please allow popups in your browser to print the Transfer Certificate.');
    return;
  }
  const html = generatePrintableTCHtml(tcData);
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
}

/**
 * High-fidelity in-app Certificate Preview Modal
 * Matches the official physical Vivekananda College TC layout exactly
 */
export default function TCCertificatePreview({
  data = {},
  onClose,
  onEdit,
  onSave
}) {
  const handlePrint = () => {
    openTCPrintWindow(data);
  };

  const natRel = getNationalityReligion(data);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Transfer Certificate Preview
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  data.status === 'Issued' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {data.status || 'Draft'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {data.tcNumber || 'TC Number TBA'} • Reg: {data.regNo || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                title="Return to form editing"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Form</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
              title="Print certificate or generate PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Rendering Canvas */}
        <div className="overflow-y-auto p-3 sm:p-6 flex justify-center bg-slate-300/60">
          <div 
            className="w-full max-w-[760px] bg-white border-[1.5px] border-black p-6 sm:p-8 shadow-xl font-serif text-black leading-tight relative select-text"
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
          >
            
            {/* Header Section */}
            <div className="relative text-center mb-2">
              <img 
                src={vcasLogo} 
                alt="College Emblem" 
                className="absolute right-0 top-0 w-14 h-14 sm:w-16 sm:h-16 object-contain" 
              />
              <div className="text-lg sm:text-xl font-bold tracking-wide uppercase font-serif text-black pr-14 sm:pr-0">
                VIVEKANANDA COLLEGE OF ARTS & SCIENCE
              </div>
              <div className="text-xs sm:text-sm italic text-neutral-800 mt-0.5">
                (Affiliated to Manonmaniam Sundaranar University)
              </div>
              <div className="text-xs sm:text-sm text-neutral-800 mt-0.5">
                Vellalankulam, Tenkasi District – 627857
              </div>

              {/* Reg No & TC No */}
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold mt-2.5 px-0.5 text-black">
                <div>Reg No.: {data.regNo || '—'}</div>
                {data.umisNumber && <div className="font-mono">UMIS No.: {data.umisNumber}</div>}
                <div>T.C. No.: {data.tcNumber || '—'}</div>
              </div>

              {/* Title */}
              <div className="text-center mt-1.5 mb-2">
                <span className="text-sm sm:text-base font-bold underline uppercase tracking-wide">
                  TRANSFER CERTIFICATE
                </span>
              </div>
            </div>

            {/* Mathematically Aligned 5-Column Table Layout */}
            <table className="w-full border-collapse font-serif text-xs sm:text-sm text-black">
              <tbody>
                {/* 1. NAME */}
                <tr>
                  <td className="w-7 py-0.5 align-top font-normal">1.</td>
                  <td className="w-56 sm:w-64 py-0.5 align-top font-normal uppercase">NAME</td>
                  <td className="w-4 py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-top font-bold uppercase">{(data.studentName || '—').toUpperCase()}</td>
                  <td rowSpan={5} className="w-24 sm:w-28 py-0.5 align-top text-right pl-2">
                    <div className="w-24 h-28 sm:w-28 sm:h-32 border border-black inline-flex items-center justify-center bg-white overflow-hidden">
                      {data.photo ? (
                        <img src={data.photo} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-400 text-center leading-tight font-sans">
                          AFFIX<br />PASSPORT<br />PHOTO
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 2. GENDER */}
                <tr>
                  <td className="py-0.5 align-top font-normal">2.</td>
                  <td className="py-0.5 align-top font-normal uppercase">GENDER</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-top font-bold uppercase">{(data.gender || '—').toUpperCase()}</td>
                </tr>

                {/* 3. DATE OF BIRTH */}
                <tr>
                  <td className="py-0.5 align-top font-normal">3.</td>
                  <td className="py-0.5 align-top font-normal uppercase">DATE OF BIRTH</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-top font-bold">{formatDisplayDate(data.dob)}</td>
                </tr>

                {/* 3b. (IN WORDS) */}
                <tr>
                  <td className="py-0.5 align-top"></td>
                  <td className="py-0.5 align-top font-normal uppercase">(IN WORDS)</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-top font-bold uppercase text-[11px] sm:text-xs">{(data.dobWords || '—').toUpperCase()}</td>
                </tr>

                {/* 4. FATHER'S NAME */}
                <tr>
                  <td className="py-0.5 align-top font-normal">4.</td>
                  <td className="py-0.5 align-top font-normal uppercase">FATHER'S NAME</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-top font-bold uppercase">{(data.fatherName || '—').toUpperCase()}</td>
                </tr>

                {/* 5. NATIONALITY & RELIGION - Directly follows Row 4 with normal line spacing */}
                <tr>
                  <td className="py-0.5 align-top font-normal">5.</td>
                  <td className="py-0.5 align-top font-normal uppercase">NATIONALITY & RELIGION</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase">{natRel}</td>
                </tr>

                {/* 6. CASTE AND COMMUNITY */}
                <tr>
                  <td className="py-0.5 align-top font-normal">6.</td>
                  <td className="py-0.5 align-top font-normal uppercase">CASTE AND COMMUNITY</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase">{(data.casteCommunity || '—').toUpperCase()}</td>
                </tr>

                {/* 7. DATE OF ADMISSION */}
                <tr>
                  <td className="py-0.5 align-top font-normal">7.</td>
                  <td className="py-0.5 align-top font-normal uppercase">DATE OF ADMISSION</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold">{formatDisplayDate(data.dateOfAdmission)}</td>
                </tr>

                {/* 8. COURSE IN WHICH ADMITTED */}
                <tr>
                  <td className="py-0.5 align-top font-normal">8.</td>
                  <td className="py-0.5 align-top font-normal uppercase">COURSE IN WHICH ADMITTED</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase">{(data.courseAdmitted || '—').toUpperCase()}</td>
                </tr>

                {/* 9. SUBJECT STUDIED */}
                <tr>
                  <td className="py-0.5 align-top font-normal">9.</td>
                  <td className="py-0.5 align-top font-normal uppercase">SUBJECT STUDIED</td>
                  <td className="py-0.5 align-top text-center"></td>
                  <td colSpan={2} className="py-0.5 align-top"></td>
                </tr>

                {/* Sub items Part-I, II, III */}
                <tr>
                  <td className="py-0.5 align-top"></td>
                  <td colSpan={4} className="py-0.5 align-top pl-24 sm:pl-32">
                    <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                      <div className="flex gap-3">
                        <span className="w-20 font-normal">PART-I</span>
                        <span className="w-3 text-center">-</span>
                        <span className="font-bold uppercase">{(data.subjectStudiedPart1 || 'TAMIL').toUpperCase()}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-20 font-normal">PART-II</span>
                        <span className="w-3 text-center">-</span>
                        <span className="font-bold uppercase">{(data.subjectStudiedPart2 || 'ENGLISH').toUpperCase()}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-20 font-normal">PART- III</span>
                        <span className="w-3 text-center">-</span>
                        <span className="font-bold uppercase">{(data.subjectStudiedPart3 || 'CRIMINOLOGY AND FORENSIC SCIENCE').toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* MEDIUM OF INSTRUCTION */}
                <tr>
                  <td className="py-0.5 align-top"></td>
                  <td className="py-0.5 align-top font-normal uppercase text-right pr-2">MEDIUM OF INSTRUCTION</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase">{(data.mediumOfInstruction || 'ENGLISH').toUpperCase()}</td>
                </tr>

                {/* 10. CLASS/YEAR AT THE TIME OF LEAVING */}
                <tr>
                  <td className="py-0.5 align-top font-normal">10.</td>
                  <td className="py-0.5 align-top font-normal uppercase leading-tight">CLASS/YEAR AT THE TIME OF<br/>LEAVING</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold leading-tight">{data.classAtLeaving || '—'}</td>
                </tr>

                {/* 11. WHETHER QUALIFIED FOR PROMOTION TO HIGHER STUDIES */}
                <tr>
                  <td className="py-0.5 align-top font-normal">11.</td>
                  <td className="py-0.5 align-top font-normal uppercase leading-tight">WHETHER QUALIFIED FOR<br/>PROMOTION TO HIGHER STUDIES</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase leading-tight">{(data.qualifiedForPromotion || '—').toUpperCase()}</td>
                </tr>

                {/* 12. PERSONAL MARKS / IDENTIFICATION */}
                <tr>
                  <td className="py-0.5 align-top font-normal">12.</td>
                  <td className="py-0.5 align-top font-normal uppercase">PERSONAL MARKS / IDENTIFICATION</td>
                  <td className="py-0.5 align-top text-center"></td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase leading-snug">
                    <div>A)&nbsp;&nbsp;{(data.idMark1 || '—').toUpperCase()}</div>
                    <div className="mt-0.5">B)&nbsp;&nbsp;{(data.idMark2 || '—').toUpperCase()}</div>
                  </td>
                </tr>

                {/* 13. DATE OF TRANSFER CERTIFICATE */}
                <tr>
                  <td className="py-0.5 align-top font-normal">13.</td>
                  <td className="py-0.5 align-top font-normal uppercase">DATE OF TRANSFER CERTIFICATE</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold">{formatDisplayDate(data.tcDate)}</td>
                </tr>

                {/* CONDUCT AND CHARACTER */}
                <tr>
                  <td className="py-0.5 align-top"></td>
                  <td className="py-0.5 align-top font-normal uppercase">CONDUCT AND CHARACTER</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td colSpan={2} className="py-0.5 align-top font-bold uppercase">{(data.conduct || 'GOOD').toUpperCase()}</td>
                </tr>
              </tbody>
            </table>

            {/* Seal & Principal Row (Clearly visible & naturally spaced) */}
            <div className="flex justify-between items-end mt-6 mb-2 px-3">
              <div className="text-center w-40">
                {data.collegeSeal ? (
                  <img 
                    src={data.collegeSeal} 
                    alt="College Seal" 
                    className="max-h-20 sm:max-h-24 max-w-[130px] object-contain mx-auto mb-1 drop-shadow-xs" 
                  />
                ) : (
                  <div className="h-12 sm:h-14"></div>
                )}
                <div className="text-xs sm:text-sm font-normal text-black">
                  College Seal
                </div>
              </div>

              <div className="text-center w-56">
                {data.principalSignature ? (
                  <img 
                    src={data.principalSignature} 
                    alt="Principal Signature" 
                    className="max-h-16 sm:max-h-20 max-w-[160px] object-contain mx-auto mb-1" 
                  />
                ) : (
                  <div className="h-12 sm:h-14"></div>
                )}
                <div className="text-xs sm:text-sm font-normal text-black">
                  Signature of the Principal
                </div>
              </div>
            </div>

            {/* Declaration Section with Larger Font */}
            <div className="mt-2 text-xs sm:text-sm">
              <div className="text-center mb-1.5">
                <span className="font-bold underline uppercase tracking-wide text-xs sm:text-sm">
                  DECLARATION BY THE PARENT / GUARDIAN
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-left indent-3 leading-relaxed text-black mb-5 px-1">
                {data.declarationText || 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.'}
              </p>

              {/* Signatures */}
              <div className="flex justify-between items-end px-3">
                <div className="text-center w-48">
                  {data.studentSignature ? (
                    <img src={data.studentSignature} alt="Student Signature" className="max-h-10 sm:max-h-12 max-w-full object-contain mx-auto mb-1" />
                  ) : (
                    <div className="h-8"></div>
                  )}
                  <div className="text-xs sm:text-sm font-normal text-black">
                    Signature of the Student
                  </div>
                </div>

                <div className="text-center w-56">
                  {data.parentSignature ? (
                    <img src={data.parentSignature} alt="Parent Signature" className="max-h-10 sm:max-h-12 max-w-full object-contain mx-auto mb-1" />
                  ) : (
                    <div className="h-8"></div>
                  )}
                  <div className="text-xs sm:text-sm font-normal text-black">
                    Signature of the Parent / Guardian
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Form formatted according to official TC layout. Click <strong>Print / PDF</strong> to export or print.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
