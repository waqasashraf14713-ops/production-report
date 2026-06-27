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

        let html = `
            <div class="pdf-report-header">
                <h1>Complete Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // 1. Raw Material
        html += `<div class="pdf-section"><h3>1. Raw Material Checks</h3>`;
        if (rmData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Vehicle No</th><th>Material</th><th>Supplier</th><th>Moisture %</th><th>Time</th><th>Status</th>
            </tr></thead><tbody>`;
            rmData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
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
            html += `<p>No raw material data for this date.</p>`;
        }
        html += `</div>`;

        // 2. Performas
        html += `<div class="pdf-section"><h3>2. Performas</h3>`;
        if (performaData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Type</th><th>Material</th><th>Value</th><th>Remarks</th>
            </tr></thead><tbody>`;
            performaData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
                        <td>${row.type || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.value || '-'}</td>
                        <td>${row.remarks || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p>No performa data for this date.</p>`;
        }
        html += `</div>`;

        // 3. Plant Report
        html += `<div class="pdf-section"><h3>3. Plant Report</h3>`;
        if (plantReportData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Line</th><th>Product</th><th>Output (Tons)</th><th>Downtime (hrs)</th><th>Reason</th>
            </tr></thead><tbody>`;
            plantReportData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
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
            html += `<p>No plant report data for this date.</p>`;
        }
        html += `</div>`;

        // 4. Quality Standards
        html += `<div class="pdf-section"><h3>4. Quality Standards</h3>`;
        if (qsReportData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Parameter</th><th>Standard</th><th>Actual</th><th>Status</th>
            </tr></thead><tbody>`;
            qsReportData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
                        <td>${row.parameter || '-'}</td>
                        <td>${row.standard || '-'}</td>
                        <td>${row.actual || '-'}</td>
                        <td>${row.status || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p>No quality standards data for this date.</p>`;
        }
        html += `</div>`;

        // 5. Silo Dumping
        html += `<div class="pdf-section"><h3>5. Silo Dumping</h3>`;
        if (siloDumpData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Silo No</th><th>Material</th><th>Quantity (Tons)</th><th>Time</th>
            </tr></thead><tbody>`;
            siloDumpData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
                        <td>${row.siloNo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.qty || '-'}</td>
                        <td>${row.time || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
        } else {
            html += `<p>No silo dumping data for this date.</p>`;
        }
        html += `</div>`;

        // 6. Silo Moisture
        html += `<div class="pdf-section"><h3>6. Silo Moisture</h3>`;
        if (siloMoistData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Silo No</th><th>Moisture %</th><th>Time</th>
            </tr></thead><tbody>`;
            siloMoistData.forEach(r => {
                const rows = r.rows || [];
                rows.forEach(row => {
                    html += `<tr>
                        <td>${row.siloNo || '-'}</td>
                        <td>${row.moisture || '-'}</td>
                        <td>${row.time || '-'}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table>`;
            
            // Add Moisture Summary
            const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
            const formulaVal = formulas[selectedDate];
            let sum = 0, count = 0;
            siloMoistData.forEach(r => {
                (r.rows || []).forEach(row => {
                    const m = parseFloat(row.moisture);
                    if (!isNaN(m)) { sum += m; count++; }
                });
            });
            
            if (count > 0) {
                const avg = (sum / count).toFixed(2);
                html += `<div style="margin-top:15px; padding:10px; border:1px solid #000; background:#f9fafb;">
                    <strong>Moisture Summary:</strong><br>
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
            html += `<p>No silo moisture data for this date.</p>`;
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
