(function() {
    function generateCompleteShiftPDF() {
        const dateInput = document.getElementById('sr-filter-date');
        const selectedDate = dateInput ? dateInput.value.trim() : '';

        if (!selectedDate) {
            alert('Please select a date in the Daily Shift Reports section first to generate the PDF.');
            return;
        }

        // Fetch data for the selected date from localStorage
        const rmData = JSON.parse(localStorage.getItem('fm_standalone_rm_checks') || '[]').filter(r => r.date === selectedDate);
        const performaData = JSON.parse(localStorage.getItem('fm_performas') || '[]').filter(r => r.date === selectedDate);
        const plantReportData = JSON.parse(localStorage.getItem('fm_plant_report') || '[]').filter(r => r.date === selectedDate);
        const qsReportData = JSON.parse(localStorage.getItem('fm_qs_report') || '[]').filter(r => r.date === selectedDate);
        const siloDumpData = JSON.parse(localStorage.getItem('fm_silo_dump') || '[]').filter(r => r.date === selectedDate);
        const siloMoistData = JSON.parse(localStorage.getItem('fm_silo_moisture') || '[]').filter(r => r.date === selectedDate);

        // Sort each dataset by shift (A, B, C) and then by time if possible
        const sortByShift = (arr) => {
            arr.sort((a, b) => (a.shift || '').localeCompare(b.shift || ''));
        };
        sortByShift(rmData);
        sortByShift(performaData);
        sortByShift(plantReportData);
        sortByShift(qsReportData);
        sortByShift(siloDumpData);
        sortByShift(siloMoistData);

        let html = `
            <div class="pdf-report-header">
                <h1>Combined Daily Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // 1. Raw Material
        html += `<div class="pdf-section"><h3>1. Raw Material Checks (Combined)</h3>`;
        if (rmData.length > 0 && rmData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Vehicle No</th><th>Material</th><th>Supplier</th><th>Moisture %</th><th>Time</th><th>Status</th>
            </tr></thead><tbody>`;
            rmData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.vehicleNo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.supplier || '-'}</td>
                        <td>${row.moisture || '-'}</td>
                        <td>${row.time || '-'}</td>
                        <td>${row.status || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No raw material data for this date.</p>`;
        }
        html += `</div>`;

        // 2. Performas
        html += `<div class="pdf-section"><h3>2. Performas (Combined)</h3>`;
        if (performaData.length > 0 && performaData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Type</th><th>Material</th><th>Value</th><th>Remarks</th>
            </tr></thead><tbody>`;
            performaData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.type || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.value || '-'}</td>
                        <td>${row.remarks || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No performa data for this date.</p>`;
        }
        html += `</div>`;

        // 3. Plant Report
        html += `<div class="pdf-section"><h3>3. Plant Report (Combined)</h3>`;
        if (plantReportData.length > 0 && plantReportData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Line</th><th>Product</th><th>Output (Tons)</th><th>Downtime (hrs)</th><th>Reason</th>
            </tr></thead><tbody>`;
            plantReportData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.line || '-'}</td>
                        <td>${row.product || '-'}</td>
                        <td>${row.output || '-'}</td>
                        <td>${row.downtime || '-'}</td>
                        <td>${row.reason || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No plant report data for this date.</p>`;
        }
        html += `</div>`;

        // 4. Quality Standards
        html += `<div class="pdf-section"><h3>4. Quality Standards (Combined)</h3>`;
        if (qsReportData.length > 0 && qsReportData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Parameter</th><th>Standard</th><th>Actual</th><th>Status</th>
            </tr></thead><tbody>`;
            qsReportData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.parameter || '-'}</td>
                        <td>${row.standard || '-'}</td>
                        <td>${row.actual || '-'}</td>
                        <td>${row.status || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No quality standards data for this date.</p>`;
        }
        html += `</div>`;

        // 5. Silo Dumping
        html += `<div class="pdf-section"><h3>5. Silo Dumping (Combined)</h3>`;
        if (siloDumpData.length > 0 && siloDumpData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Silo No</th><th>Material</th><th>Quantity (Tons)</th><th>Time</th>
            </tr></thead><tbody>`;
            siloDumpData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.siloNo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.qty || '-'}</td>
                        <td>${row.time || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No silo dumping data for this date.</p>`;
        }
        html += `</div>`;

        // 6. Silo Moisture
        html += `<div class="pdf-section"><h3>6. Silo Moisture (Combined)</h3>`;
        if (siloMoistData.length > 0 && siloMoistData.some(r => r.rows && r.rows.length > 0)) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Silo No</th><th>Moisture %</th><th>Time</th>
            </tr></thead><tbody>`;
            
            let sum = 0, count = 0;
            siloMoistData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.siloNo || '-'}</td>
                        <td>${row.moisture || '-'}</td>
                        <td>${row.time || '-'}</td>
                    </tr>`;
                    const m = parseFloat(row.moisture);
                    if (!isNaN(m)) { sum += m; count++; }
                });
            });
            html += `</tbody></table>`;
            
            // Add Moisture Summary
            if (count > 0) {
                const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
                const formulaVal = formulas[selectedDate];
                const avg = (sum / count).toFixed(2);
                
                html += `<div style="margin-top:10px; padding:10px; border:1px solid #000; background:#f9fafb;">
                    <strong>Daily Moisture Summary (All Shifts):</strong><br>
                    Actual Average: ${avg}% (Based on ${count} readings)<br>`;
                
                if (formulaVal !== undefined) {
                    html += `Formula Moisture: ${formulaVal}%<br>`;
                    const diff = parseFloat((avg - formulaVal).toFixed(2));
                    const absDiff = Math.abs(diff);
                    const sign = diff > 0 ? '+' : '';
                    if (absDiff === 0) {
                        html += `Difference: 0.00% (Match)<br>`;
                    } else if (absDiff <= 2) {
                        html += `Difference: ${sign}${diff}% (Within Limits)<br>`;
                    } else {
                        html += `<strong style="color:red;">Difference: ${sign}${diff}% (Out of Range!)</strong><br>`;
                    }
                } else {
                    html += `Formula Moisture: Not Entered<br>`;
                }
                html += `</div>`;
            }

        } else {
            html += `<p style="font-style:italic;color:#666;">No silo moisture data for this date.</p>`;
        }
        html += `</div>`;

        // Approval Block
        html += `
            <div class="pdf-approval-block">
                <h3 style="margin-top:0; border-bottom:1px solid #000; padding-bottom:10px;">Production Manager Approval</h3>
                <div style="margin-top:20px;">
                    <strong>Comments / Remarks:</strong>
                    <div style="border-bottom: 1px dotted #999; height: 30px; margin-top:10px;"></div>
                    <div style="border-bottom: 1px dotted #999; height: 30px;"></div>
                    <div style="border-bottom: 1px dotted #999; height: 30px;"></div>
                </div>
                <div class="signature-box">
                    <div>
                        <div class="signature-line"></div>
                        <div>Production Manager Signature</div>
                    </div>
                    <div>
                        <div class="signature-line" style="width:150px;"></div>
                        <div>Date</div>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('shift-report-print-container');
        if (container) {
            container.innerHTML = html;
        }

        // Trigger print
        document.body.classList.add('printing-shift-pdf');
        setTimeout(() => {
            window.print();
            // Remove class after print dialog closes
            setTimeout(() => {
                document.body.classList.remove('printing-shift-pdf');
            }, 1000);
        }, 300);
    }

    // Initialize when DOM is ready
    const initPDFEvents = () => {
        const btn = document.getElementById('btn-generate-shift-pdf');
        if (btn) {
            btn.addEventListener('click', generateCompleteShiftPDF);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFEvents);
    } else {
        initPDFEvents();
    }
})();
