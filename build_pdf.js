const fs = require('fs');
let code = fs.readFileSync('d:/production report/shift_report_pdf.js', 'utf8');

// 1. Insert Comparison Summary
const summaryInsertionPoint = '\n        // 1. Raw Material';
const comparisonCode = `
        // NEW COMPARISON SUMMARY
        html += \`<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>Summary: Shift A vs B vs C</h3>\`;
        html += \`<table class="pdf-table" style="margin-bottom: 1.5rem; width: 100%; border: 2px solid #1e293b; text-align: center;">
            <thead style="background-color: #e2e8f0; font-weight: bold;">
                <tr>
                    <th style="width: 25%; text-align:left; border-bottom: 2px solid #1e293b;">Metrics</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift A</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift B</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift C</th>
                </tr>
            </thead>
            <tbody>\`;
        
        const getShiftData = (arr, shiftCode) => arr.find(x => x.shift === shiftCode) || {};

        const sra = getShiftData(shiftReportsData, 'A');
        const srb = getShiftData(shiftReportsData, 'B');
        const src = getShiftData(shiftReportsData, 'C');

        html += \`
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Officer Name</td>
                <td>\${sra.officerName || '-'}</td>
                <td>\${srb.officerName || '-'}</td>
                <td>\${src.officerName || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Batches Produced</td>
                <td>\${sra.batches || '-'}</td>
                <td>\${srb.batches || '-'}</td>
                <td>\${src.batches || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Production Bags</td>
                <td>\${sra.productionBags || '-'}</td>
                <td>\${srb.productionBags || '-'}</td>
                <td>\${src.productionBags || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Machine Issues</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${sra.machineIssues || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${srb.machineIssues || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${src.machineIssues || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Quality Remarks</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${sra.qualityRemarks || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${srb.qualityRemarks || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">\${src.qualityRemarks || '-'}</td>
            </tr>
        \`;
        html += \`</tbody></table></div>\`;
`;
if (!code.includes('Summary: Shift A vs B vs C')) {
    code = code.replace(summaryInsertionPoint, comparisonCode + summaryInsertionPoint);
}

// 2. Hide Empty Sections
// Replace occurrences of } else { html += <p ...>No data...</p>; }
const regexElseNoData = /\} else \{\s*html \+= `<p style="font-style:italic;color:#666;">No.*?<\/p>`;\s*\}/g;
code = code.replace(regexElseNoData, '}');

// Add page-break-inside to pdf-section
code = code.replace(/<div class="pdf-section">/g, '<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;">');

fs.writeFileSync('d:/production report/shift_report_pdf.js', code, 'utf8');
console.log('Modifications applied successfully!');
