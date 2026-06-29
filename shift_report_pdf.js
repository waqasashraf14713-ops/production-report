(function() {
    function getSafeLocalStorageData(key) {
        try {
            const val = localStorage.getItem(key);
            if (!val) return [];
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            return [];
        }
    }

    function generateCompleteShiftPDF() {
        const dateInput = document.getElementById('sr-filter-date');
        const selectedDate = dateInput ? dateInput.value.trim() : '';

        if (!selectedDate) {
            alert('Please select a date in the Daily Shift Reports section first to generate the PDF.');
            return;
        }

        let shiftReportsData = [];
        let rmData = [];
        let performaData = [];
        let plantReportData = [];
        let qsReportData = [];
        let siloDumpData = [];
        let siloMoistData = [];
        let dailyChecklistData = [];

        try {
            shiftReportsData = getSafeLocalStorageData('fmpr_shiftReports').filter(r => r.date === selectedDate);
            rmData = getSafeLocalStorageData('fm_standalone_rm_checks').filter(r => r.date === selectedDate);
            performaData = getSafeLocalStorageData('fm_performas').filter(r => r.date === selectedDate);
            plantReportData = getSafeLocalStorageData('fm_plant_report').filter(r => r.date === selectedDate);
            qsReportData = getSafeLocalStorageData('fm_qs_report').filter(r => r.date === selectedDate);
            siloDumpData = getSafeLocalStorageData('fm_silo_dump').filter(r => r.date === selectedDate);
            siloMoistData = getSafeLocalStorageData('fm_silo_moisture').filter(r => r.date === selectedDate);
            dailyChecklistData = getSafeLocalStorageData('fmpr_dailyChecklists').filter(r => r.date === selectedDate);
        } catch (err) {
            console.error('Error filtering PDF datasets:', err);
        }

        // Sort each dataset by shift (A, B, C) and then by time if possible
        const sortByShift = (arr) => {
            if (!Array.isArray(arr)) return;
            arr.sort((a, b) => (a.shift || '').localeCompare(b.shift || ''));
        };
        sortByShift(shiftReportsData);
        sortByShift(rmData);
        sortByShift(performaData);
        sortByShift(plantReportData);
        sortByShift(qsReportData);
        sortByShift(siloDumpData);
        sortByShift(siloMoistData);
        sortByShift(dailyChecklistData);

        let html = `
            <div class="pdf-report-header">
                <h1>Combined Daily Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // 0. Main Shift Reports
        html += `<div class="pdf-section"><h3>Production Officer Shift Reports</h3>`;
        if (shiftReportsData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Batches</th><th>Bags</th><th>Feed Produced</th><th>RM Used</th><th>Machine Issues</th><th>Quality Remarks</th><th>General Remarks</th>
            </tr></thead><tbody>`;
            shiftReportsData.forEach(r => {
                html += `<tr>
                    <td><strong>${r.shift || '-'}</strong></td>
                    <td>${r.officerName || '-'}</td>
                    <td>${r.batches || '0'}</td>
                    <td>${(r.productionBags || 0).toLocaleString()}</td>
                    <td>${r.feedProduced || '-'}</td>
                    <td>${r.rawMaterialUsed || '-'}</td>
                    <td>${r.machineIssues || '-'}</td>
                    <td>${r.qualityRemarks || '-'}</td>
                    <td>${r.generalRemarks || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No main shift reports for this date.</p>`;
        }
        html += `</div>`;

        // 1. Raw Material
        html += `<div class="pdf-section"><h3>1. Raw Material Checks (Combined)</h3>`;
        if (rmData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Vehicle No</th><th>Location</th><th>Moisture %</th><th>Quality</th><th>Remarks</th>
            </tr></thead><tbody>`;
            rmData.forEach(row => {
                html += `<tr>
                    <td><strong>${row.shift || '-'}</strong></td>
                    <td>${row.vehicle || '-'}</td>
                    <td>${row.location || '-'}</td>
                    <td>${row.moisture || '-'}</td>
                    <td>${row.quality || '-'}</td>
                    <td>${row.remarks || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No raw material data for this date.</p>`;
        }
        html += `</div>`;

        // 2. Performas
        html += `<div class="pdf-section"><h3>2. Performas (Combined)</h3>`;
        if (performaData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Signature</th><th>Remarks</th>
            </tr></thead><tbody>`;
            performaData.forEach(row => {
                html += `<tr>
                    <td>${row.sign || '-'}</td>
                    <td>${row.remarks || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No performa data for this date.</p>`;
        }
        html += `</div>`;

        // 3. Plant Report
        html += `<div class="pdf-section"><h3>3. Plant Report (Combined)</h3>`;
        if (plantReportData.length > 0) {
            plantReportData.forEach(row => {
                html += `<div style="margin-top: 1rem; border: 2px solid #000; padding: 1rem; background: #fff; page-break-inside: avoid; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; border-bottom: 2px solid #000; padding-bottom: 0.25rem;">Shift details: <strong>${row.shift || '-'} Shift</strong></h4>
                    
                    <!-- Shift Details Table -->
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Production Officer</th>
                                <th>Plant Operator</th>
                                <th>Start Time</th>
                                <th>Finish Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.shiftDetails?.off || '-'}</td>
                                <td>${row.shiftDetails?.op || '-'}</td>
                                <td>${row.shiftDetails?.st || '-'}</td>
                                <td>${row.shiftDetails?.fn || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 5S Checklist Sign Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">5'S Checklists Sign</h5>
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Control ROOMS</th>
                                <th>Pellet Mills</th>
                                <th>Batching</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.fiveS?.cr || '-'}</td>
                                <td>${row.fiveS?.pm || '-'}</td>
                                <td>${row.fiveS?.b || '-'}</td>
                                <td>${row.fiveS?.rm || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Receiving Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">Receiving</h5>
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Workforce (Persons)</th>
                                <th>Receiving Avg. (Bags/min)</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.rec?.wf || '-'}</td>
                                <td>${row.rec?.avg || '-'}</td>
                                <td>${row.rec?.rm || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Quality Control Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">Quality Control</h5>
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Time (hh:mm)</th>
                                <th>Feed Moisture (%)</th>
                                <th>Micro-ingredient weights</th>
                                <th>Feed bag weight (kg)</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.qc?.t || '-'}</td>
                                <td>${row.qc?.m || '-'}</td>
                                <td>${row.qc?.mi || '-'}</td>
                                <td>${row.qc?.b || '-'}</td>
                                <td>${row.qc?.rm || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Grinding Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">Grinding</h5>
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Grinder</th>
                                <th>Time (hh:mm)</th>
                                <th>Material</th>
                                <th>Feeder Hz</th>
                                <th>Motor Amps (Actual / Max)</th>
                                <th>Overs (%)</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.grd?.g || '-'}</td>
                                <td>${row.grd?.t || '-'}</td>
                                <td>${row.grd?.m || '-'}</td>
                                <td>${row.grd?.hz || '-'}</td>
                                <td>${row.grd?.aa || '-'} / ${row.grd?.am || '-'}</td>
                                <td>${row.grd?.ov || '-'}</td>
                                <td>${row.grd?.rm || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Pelleting Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">Pelleting</h5>
                    <table class="pdf-table" style="margin-bottom: 0.75rem;">
                        <thead>
                            <tr>
                                <th>Pellet Mill</th>
                                <th>Time (hh:mm)</th>
                                <th>Feed #</th>
                                <th>Feeder Hz</th>
                                <th>Motor Amps (Actual / Max)</th>
                                <th>Powder (%)</th>
                                <th>Temp (°C)</th>
                                <th>Sifter (Mash)</th>
                                <th>Dumper (Open Inch)</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${row.pel?.m || '-'}</td>
                                <td>${row.pel?.t || '-'}</td>
                                <td>${row.pel?.f || '-'}</td>
                                <td>${row.pel?.hz || '-'}</td>
                                <td>${row.pel?.aa || '-'} / ${row.pel?.am || '-'}</td>
                                <td>${row.pel?.p || '-'}</td>
                                <td>${row.pel?.tm || '-'}</td>
                                <td>${row.pel?.sm || '-'}</td>
                                <td>${row.pel?.d || '-'}</td>
                                <td>${row.pel?.rm || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Physical Visit Table -->
                    <h5 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem;">Physical Visit Checklist</h5>
                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th>Checking Parameters</th>
                                <th>Basement</th>
                                <th>Ground Flr</th>
                                <th>1st Flr (19)</th>
                                <th>2nd Flr (51)</th>
                                <th>3rd Flr (67)</th>
                                <th>4th Flr (91)</th>
                                <th>Roof (110)</th>
                                <th>Silos Top</th>
                                <th>Silos Tower</th>
                                <th>Dryer Side</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                const locations = ['Basement', 'Ground Flr', '1st Flr (19)', '2nd Flr (51)', '3rd Flr (67)', '4th Flr (91)', 'Roof (110)', 'Silos Top', 'Silos Tower', 'Dryer Side'];
                const params = [
                    'Floor & Walls Cleaning',
                    'Machine Cleaning',
                    'Leakage',
                    'Abnormal Machine Sound',
                    'Unnecessary item'
                ];

                params.forEach((pName, pIdx) => {
                    html += `<tr>
                        <td><strong>${pName}</strong></td>`;
                    locations.forEach((loc, lIdx) => {
                        const checked = row.pv && row.pv[pIdx] ? !!row.pv[pIdx][lIdx] : false;
                        html += `<td style="text-align: center; font-weight: bold; color: ${checked ? 'green' : '#ccc'};">${checked ? '✓' : '-'}</td>`;
                    });
                    html += `</tr>`;
                });

                html += `</tbody>
                    </table>
                </div>`;
            });
        } else {
            html += `<p style="font-style:italic;color:#666;">No plant report data for this date.</p>`;
        }
        html += `</div>`;

        // 4. Quality Standards
        html += `<div class="pdf-section"><h3>4. Quality Standards (Combined)</h3>`;
        if (qsReportData.length > 0) {
            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th>
            </tr></thead><tbody>`;
            qsReportData.forEach(row => {
                html += `<tr>
                    <td><strong>${row.shift || '-'}</strong></td>
                    <td>${row.officer || '-'}</td>
                </tr>`;
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
                <th>Shift</th><th>Officer</th><th>Silo</th><th>Material</th><th>Remarks</th>
            </tr></thead><tbody>`;
            siloDumpData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officer || '-'}</td>
                        <td>${row.silo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.remarks || '-'}</td>
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
                <th>Shift</th><th>Officer</th><th>Silo No</th><th>Material</th><th>Moisture %</th><th>Remarks</th>
            </tr></thead><tbody>`;
            
            let sum = 0, count = 0;
            siloMoistData.forEach(r => {
                (r.rows || []).forEach(row => {
                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.silo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.moisture || '-'}</td>
                        <td>${row.remarks || '-'}</td>
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

        // 7. Department Daily Checklists
        html += `<div class="pdf-section"><h3>7. Department Daily Checklists (Combined)</h3>`;
        if (dailyChecklistData.length > 0) {
            const localChecklistQuestions = window.DAILY_CHECKLIST_QUESTIONS || {
                'Old Godown': [
                    'All incoming bags are inspected for leakage and weight.',
                    'Moisture levels of grain bags are checked and logged.',
                    'Stacking heights do not exceed the safe limit (15 bags).',
                    'Aisles and emergency exits are completely unobstructed.',
                    'Rodent traps and bait stations are inspected.',
                    'Daily dispatch and receipt ledger is updated.'
                ],
                'Mechanical': [
                    'All machines are lubricated and oil levels checked.',
                    'Guards and safety covers are securely in place.',
                    'Pre-start inspection completed for hammer mills and mixers.',
                    'No abnormal noise or vibration detected during idle run.',
                    'Workshop tools are accounted for and sorted.',
                    'Pneumatic lines are checked for leaks and pressure.'
                ],
                'Electrical': [
                    'Motor control centers (MCC) checked for overheating/burning smell.',
                    'Power factor panels are operating at target (>0.90).',
                    'Backup generator has sufficient fuel and battery voltage.',
                    'Emergency stop buttons on all major machines are tested/functional.',
                    'Electrical panels are locked and keys secured.',
                    'Cable trays and conduits inspected for damage or exposure.'
                ],
                'Control Room': [
                    'SCADA system communication with PLC is stable.',
                    'All bin/silo level sensors show active readings.',
                    'Feeder speed controls and batching scales are calibrated.',
                    'Interlock system status verified and fully active.',
                    'Batch production logs are printed/backed up.',
                    'Control room temperature is within limits (AC functioning).'
                ],
                'Premix': [
                    'Micro-ingredient scales are calibrated and zeroed.',
                    'Pre-weighed premix batches verified against formulation sheet.',
                    'Premix dispenser and dumping hopper suction fans are on.',
                    'No cross-contamination risk in the preparation area.',
                    'Inventory of high-value vitamins/minerals checked.',
                    'Hand addition log sheet is signed and completed.'
                ],
                'Other Department': [
                    'Office computers, lights, and AC are turned off after shift.',
                    'Sufficient supply of printing paper and office stationery.',
                    'Admin files and records are organized and stored securely.',
                    'Sewerage and water supply pumps are checked and working.',
                    'Visitor log and gate pass register are up to date.',
                    'General cleanliness of office areas and toilets.'
                ]
            };

            dailyChecklistData.forEach(dc => {
                html += `<div style="margin-bottom: 1.5rem; border: 1px solid #ccc; border-radius: 6px; padding: 1rem; background: #fff;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                        <strong>Department: ${dc.departmentName || '-'}</strong>
                        <span>Filled By: ${dc.filledBy || '-'}</span>
                    </div>
                    <table class="pdf-table" style="margin-bottom: 0.5rem;">
                        <thead>
                            <tr>
                                <th style="width: 80%;">Checklist Item</th>
                                <th style="width: 20%; text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>`;
                const questions = localChecklistQuestions[dc.departmentName] || [];
                questions.forEach((q, idx) => {
                    const isChecked = dc.checkedItems ? !!dc.checkedItems[idx] : false;
                    html += `<tr>
                        <td>${q}</td>
                        <td style="text-align: center; font-weight: bold; color: ${isChecked ? 'green' : 'red'};">${isChecked ? '✅ Yes' : '❌ No'}</td>
                    </tr>`;
                });
                html += `</tbody></table>`;
                if (dc.remarks) {
                    html += `<div style="font-size: 0.9rem; color: #555; margin-top: 0.5rem;"><strong>Remarks:</strong> ${dc.remarks}</div>`;
                }
                html += `</div>`;
            });
        } else {
            html += `<p style="font-style:italic;color:#666;">No daily checklist data for this date.</p>`;
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
