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

        // Extract unique combinations of Shift and Officer
        const combinations = new Map(); // key: "shift|officer", value: {shift, officer}
        
        const addToCombinations = (arr) => {
            arr.forEach(r => {
                if (r.shift && r.officerName) {
                    const key = `${r.shift}|${r.officerName}`;
                    if (!combinations.has(key)) {
                        combinations.set(key, { shift: r.shift, officerName: r.officerName });
                    }
                }
            });
        };

        addToCombinations(rmData);
        addToCombinations(performaData);
        addToCombinations(plantReportData);
        addToCombinations(qsReportData);
        addToCombinations(siloDumpData);
        addToCombinations(siloMoistData);

        const uniqueGroups = Array.from(combinations.values());
        
        // Sort by shift (A, B, C) then officer name
        uniqueGroups.sort((a, b) => {
            if (a.shift < b.shift) return -1;
            if (a.shift > b.shift) return 1;
            return a.officerName.localeCompare(b.officerName);
        });

        let html = `
            <div class="pdf-report-header">
                <h1>Complete Daily Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        if (uniqueGroups.length === 0) {
            html += `<p style="text-align:center; margin-top: 50px;">No shift data found for this date.</p>`;
        } else {
            // Iterate over each officer/shift combination
            uniqueGroups.forEach(group => {
                const shift = group.shift;
                const officer = group.officerName;

                html += `
                    <div style="background-color: #374151; color: white; padding: 10px 15px; margin-top: 30px; margin-bottom: 15px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; page-break-after: avoid;">
                        <h2 style="margin: 0; font-size: 16px;">Shift: ${shift}</h2>
                        <h2 style="margin: 0; font-size: 16px;">Production Officer: ${officer}</h2>
                    </div>
                `;

                // Filter data for this specific group
                const gRm = rmData.filter(r => r.shift === shift && r.officerName === officer);
                const gPerf = performaData.filter(r => r.shift === shift && r.officerName === officer);
                const gPlant = plantReportData.filter(r => r.shift === shift && r.officerName === officer);
                const gQs = qsReportData.filter(r => r.shift === shift && r.officerName === officer);
                const gSilo = siloDumpData.filter(r => r.shift === shift && r.officerName === officer);
                const gMoist = siloMoistData.filter(r => r.shift === shift && r.officerName === officer);

                let hasData = false;

                // 1. Raw Material
                if (gRm.length > 0 && gRm.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>1. Raw Material Checks</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Vehicle No</th><th>Material</th><th>Supplier</th><th>Moisture %</th><th>Time</th><th>Status</th>
                    </tr></thead><tbody>`;
                    gRm.forEach(r => {
                        (r.rows || []).forEach(row => {
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
                    html += `</tbody></table></div>`;
                }

                // 2. Performas
                if (gPerf.length > 0 && gPerf.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>2. Performas</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Type</th><th>Material</th><th>Value</th><th>Remarks</th>
                    </tr></thead><tbody>`;
                    gPerf.forEach(r => {
                        (r.rows || []).forEach(row => {
                            html += `<tr>
                                <td>${row.type || '-'}</td>
                                <td>${row.material || '-'}</td>
                                <td>${row.value || '-'}</td>
                                <td>${row.remarks || '-'}</td>
                            </tr>`;
                        });
                    });
                    html += `</tbody></table></div>`;
                }

                // 3. Plant Report
                if (gPlant.length > 0 && gPlant.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>3. Plant Report</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Line</th><th>Product</th><th>Output (Tons)</th><th>Downtime (hrs)</th><th>Reason</th>
                    </tr></thead><tbody>`;
                    gPlant.forEach(r => {
                        (r.rows || []).forEach(row => {
                            html += `<tr>
                                <td>${row.line || '-'}</td>
                                <td>${row.product || '-'}</td>
                                <td>${row.output || '-'}</td>
                                <td>${row.downtime || '-'}</td>
                                <td>${row.reason || '-'}</td>
                            </tr>`;
                        });
                    });
                    html += `</tbody></table></div>`;
                }

                // 4. Quality Standards
                if (gQs.length > 0 && gQs.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>4. Quality Standards</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Parameter</th><th>Standard</th><th>Actual</th><th>Status</th>
                    </tr></thead><tbody>`;
                    gQs.forEach(r => {
                        (r.rows || []).forEach(row => {
                            html += `<tr>
                                <td>${row.parameter || '-'}</td>
                                <td>${row.standard || '-'}</td>
                                <td>${row.actual || '-'}</td>
                                <td>${row.status || '-'}</td>
                            </tr>`;
                        });
                    });
                    html += `</tbody></table></div>`;
                }

                // 5. Silo Dumping
                if (gSilo.length > 0 && gSilo.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>5. Silo Dumping</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Silo No</th><th>Material</th><th>Quantity (Tons)</th><th>Time</th>
                    </tr></thead><tbody>`;
                    gSilo.forEach(r => {
                        (r.rows || []).forEach(row => {
                            html += `<tr>
                                <td>${row.siloNo || '-'}</td>
                                <td>${row.material || '-'}</td>
                                <td>${row.qty || '-'}</td>
                                <td>${row.time || '-'}</td>
                            </tr>`;
                        });
                    });
                    html += `</tbody></table></div>`;
                }

                // 6. Silo Moisture
                if (gMoist.length > 0 && gMoist.some(r => r.rows && r.rows.length > 0)) {
                    hasData = true;
                    html += `<div class="pdf-section"><h3>6. Silo Moisture</h3>`;
                    html += `<table class="pdf-table"><thead><tr>
                        <th>Silo No</th><th>Moisture %</th><th>Time</th>
                    </tr></thead><tbody>`;
                    
                    let sum = 0, count = 0;
                    gMoist.forEach(r => {
                        (r.rows || []).forEach(row => {
                            html += `<tr>
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
                            <strong>Officer Moisture Summary:</strong><br>
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
                    html += `</div>`;
                }

                if (!hasData) {
                    html += `<p style="font-style: italic; color: #666;">No completed reports for this shift.</p>`;
                }
            });
        }

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
