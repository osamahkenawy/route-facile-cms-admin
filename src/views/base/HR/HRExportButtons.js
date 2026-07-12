import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { notifyError, notifySuccess } from "../../../components/notify/notify";

/**
 * Reusable export buttons for HR list pages.
 *
 * Props:
 *  - rows: array of source records
 *  - columns: array of { header: string, accessor: (row) => any }
 *  - filename: base file name (no extension)
 *  - title: PDF document title (defaults to filename)
 *  - subtitle: optional sub-line printed under the title in the PDF
 *  - sheetName: Excel sheet name (defaults to "Data")
 *  - orientation: "portrait" | "landscape" (default landscape)
 */
const HRExportButtons = ({
  rows = [],
  columns = [],
  filename = "hr-export",
  title,
  subtitle,
  sheetName = "Data",
  orientation = "landscape",
}) => {
  const [busy, setBusy] = useState(false);

  const safeRows = Array.isArray(rows) ? rows : [];
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `${filename}-${stamp}`;

  const buildTable = () =>
    safeRows.map((row) =>
      columns.map((col) => {
        try {
          const v = col.accessor ? col.accessor(row) : "";
          if (v === null || v === undefined) return "";
          return typeof v === "object" ? JSON.stringify(v) : String(v);
        } catch (e) {
          return "";
        }
      })
    );

  const exportExcel = async () => {
    if (!safeRows.length) {
      notifyError("Nothing to export");
      return;
    }
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const headers = columns.map((c) => c.header);
      const data = buildTable();
      const aoa = [headers, ...data];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      // Auto column widths
      ws["!cols"] = headers.map((h, i) => {
        const maxLen = Math.max(
          String(h).length,
          ...data.map((r) => (r[i] ? String(r[i]).length : 0))
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${baseName}.xlsx`);
      notifySuccess("Excel downloaded");
    } catch (err) {
      notifyError("Failed to export Excel");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    if (!safeRows.length) {
      notifyError("Nothing to export");
      return;
    }
    setBusy(true);
    let host = null;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const docTitle = title || filename;
      const sub = `${subtitle ? subtitle + "  •  " : ""}Generated ${new Date().toLocaleString(
        "en-GB"
      )}  •  ${safeRows.length} record${safeRows.length === 1 ? "" : "s"}`;

      // Build an off-screen HTML table — the browser handles Arabic shaping
      // and bidi correctly with system fonts.
      const isLandscape = orientation === "landscape";
      // A4 @ 96dpi: portrait 794x1123, landscape 1123x794. Use width minus margins.
      const renderWidth = isLandscape ? 1100 : 770;

      host = document.createElement("div");
      host.style.cssText = `position:fixed;left:-99999px;top:0;width:${renderWidth}px;background:#fff;font-family:'Segoe UI','Tahoma','Arial','Noto Sans Arabic','Amiri',sans-serif;color:#0f172a;padding:24px;`;

      const escape = (s) =>
        String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const arabicRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      const cellHtml = (val) => {
        const text = val === null || val === undefined ? "" : String(val);
        const isAr = arabicRe.test(text);
        const align = isAr ? "right" : "left";
        const dir = isAr ? "rtl" : "ltr";
        return `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:${align};vertical-align:top;direction:${dir};">${escape(text)}</td>`;
      };

      const headerHtml = columns
        .map(
          (c) =>
            `<th style="padding:8px;background:#0a1733;color:#fff;font-size:11px;font-weight:700;text-align:left;border-bottom:2px solid #0a1733;">${escape(
              c.header
            )}</th>`
        )
        .join("");

      const bodyHtml = safeRows
        .map((row, idx) => {
          const cells = columns
            .map((col) => {
              try {
                const v = col.accessor ? col.accessor(row) : "";
                return cellHtml(v);
              } catch (e) {
                return cellHtml("");
              }
            })
            .join("");
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          return `<tr style="background:${bg};">${cells}</tr>`;
        })
        .join("");

      host.innerHTML = `
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${escape(docTitle)}</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">${escape(sub)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;table-layout:auto;">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      `;
      document.body.appendChild(host);

      // Wait one frame so fonts/layout settle.
      await new Promise((r) => requestAnimationFrame(() => r()));

      const canvas = await html2canvas(host, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2 - 18; // reserve 18pt for footer

      const imgWidthPt = usableWidth;
      const imgHeightPt = (canvas.height * imgWidthPt) / canvas.width;

      // Slice the canvas into page-sized chunks
      const pageHeightPx = (usableHeight * canvas.width) / usableWidth;
      let renderedPx = 0;
      let pageNum = 0;
      const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

      while (renderedPx < canvas.height) {
        if (pageNum > 0) doc.addPage();
        pageNum += 1;

        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedPx,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        const sliceImg = sliceCanvas.toDataURL("image/png");
        const sliceHeightPt = (sliceHeightPx * imgWidthPt) / canvas.width;
        doc.addImage(sliceImg, "PNG", margin, margin, imgWidthPt, sliceHeightPt);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 60, pageHeight - 12);
        doc.setTextColor(0);

        renderedPx += sliceHeightPx;
      }

      // Suppress unused var lint
      void imgHeightPt;

      doc.save(`${baseName}.pdf`);
      notifySuccess("PDF downloaded");
    } catch (err) {
      notifyError("Failed to export PDF");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      if (host && host.parentNode) host.parentNode.removeChild(host);
      setBusy(false);
    }
  };

  return (
    <div className="d-inline-flex align-items-center gap-2">
      <motion.button
        type="button"
        className="hr-pill-button"
        style={{
          background: "#16a34a",
          color: "#fff",
          border: "none",
          opacity: busy ? 0.6 : 1,
        }}
        onClick={exportExcel}
        disabled={busy}
        whileHover={{ scale: busy ? 1 : 1.03 }}
        whileTap={{ scale: 0.97 }}
        title="Export visible rows as Excel"
      >
        <FaFileExcel size={12} /> Excel
      </motion.button>
      <motion.button
        type="button"
        className="hr-pill-button"
        style={{
          background: "#dc2626",
          color: "#fff",
          border: "none",
          opacity: busy ? 0.6 : 1,
        }}
        onClick={exportPdf}
        disabled={busy}
        whileHover={{ scale: busy ? 1 : 1.03 }}
        whileTap={{ scale: 0.97 }}
        title="Export visible rows as PDF"
      >
        <FaFilePdf size={12} /> PDF
      </motion.button>
    </div>
  );
};

export default HRExportButtons;
