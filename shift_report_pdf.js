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

    function generateCompleteShiftPDF(isApproved = false, remarks = '') {
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
        let dryerReportData = [];

        try {
            shiftReportsData = getSafeLocalStorageData('fmpr_shiftReports').filter(r => r.date === selectedDate);
            rmData = getSafeLocalStorageData('fm_standalone_rm_checks').filter(r => r.date === selectedDate);
            performaData = getSafeLocalStorageData('fm_performas').filter(r => r.date === selectedDate);
            plantReportData = getSafeLocalStorageData('fm_plant_report').filter(r => r.date === selectedDate);
            qsReportData = getSafeLocalStorageData('fm_qs_report').filter(r => r.date === selectedDate);
            siloDumpData = getSafeLocalStorageData('fm_silo_dump').filter(r => r.date === selectedDate);
            siloMoistData = getSafeLocalStorageData('fm_silo_moisture').filter(r => r.date === selectedDate);
            dailyChecklistData = getSafeLocalStorageData('fmpr_dailyChecklists').filter(r => r.date === selectedDate);
            dryerReportData = getSafeLocalStorageData('dryer_side_reports').filter(r => r.date === selectedDate);
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
        sortByShift(dryerReportData);

        let html = `
            <style>
                .pdf-report-header h1, .pdf-report-header p { text-align: center !important; }
                .pdf-section h3, .pdf-section h4, .pdf-section h5 { text-align: center !important; }
                .pdf-table th, .pdf-table td { text-align: center !important; }
            </style>
            <div class="pdf-report-header" style="text-align:center;">
                <h1>Combined Daily Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // 1. Production Officer Shift Reports (Combined)
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>1. Production Officer Shift Reports (Combined)</h3>`;
        html += `<table class="pdf-table" style="margin-bottom: 1.5rem; width: 100%; border: 2px solid #1e293b; text-align: center;">
            <thead style="background-color: #e2e8f0; font-weight: bold;">
                <tr>
                    <th style="width: 25%; text-align:left; border-bottom: 2px solid #1e293b;">Metrics</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift A</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift B</th>
                    <th style="width: 25%; border-bottom: 2px solid #1e293b;">Shift C</th>
                </tr>
            </thead>
            <tbody>`;
        
        const getShiftData = (arr, shiftCode) => arr.find(x => x.shift === shiftCode) || {};

        const sra = getShiftData(shiftReportsData, 'A');
        const srb = getShiftData(shiftReportsData, 'B');
        const src = getShiftData(shiftReportsData, 'C');

        html += `
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Officer Name</td>
                <td>${sra.officerName || '-'}</td>
                <td>${srb.officerName || '-'}</td>
                <td>${src.officerName || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Batches Produced</td>
                <td>${sra.batches || '-'}</td>
                <td>${srb.batches || '-'}</td>
                <td>${src.batches || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Production Bags</td>
                <td>${sra.productionBags || '-'}</td>
                <td>${srb.productionBags || '-'}</td>
                <td>${src.productionBags || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Machine Issues</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${sra.machineIssues || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${srb.machineIssues || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${src.machineIssues || '-'}</td>
            </tr>
            <tr>
                <td style="text-align:left; font-weight:bold; background:#f8fafc;">Quality Remarks</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${sra.qualityRemarks || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${srb.qualityRemarks || '-'}</td>
                <td style="text-align:left; font-size:0.8rem; white-space:pre-wrap;">${src.qualityRemarks || '-'}</td>
            </tr>
        `;
        html += `</tbody></table></div>`;


        // 2. Raw Material
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>2. Raw Material Checks (Combined)</h3>`;
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
        }
        html += `</div>`;

        // 3. Performas
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>3. Performas (Combined)</h3>`;
        if (performaData.length > 0) {
            performaData.forEach(row => {
                html += `<div style="border: 1px solid #000; padding: 1rem; margin-bottom: 1rem; page-break-inside: avoid; background: #fff;">
                    ${row.remarks ? `<p style="margin: 0 0 10px 0;"><strong>Remarks:</strong> ${row.remarks}</p>` : ''}
                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th style="vertical-align:bottom;">Performa Name/Category</th>
                                <th style="width: 100px; text-align: center;">
                                    <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${row.signM || row.sign || '-'}</strong></div>
                                    Morning
                                </th>
                                <th style="width: 100px; text-align: center;">
                                    <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${row.signE || row.sign || '-'}</strong></div>
                                    Evening
                                </th>
                                <th style="width: 100px; text-align: center;">
                                    <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${row.signN || row.sign || '-'}</strong></div>
                                    Night
                                </th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                const performaItems = window.PERFORMA_ITEMS || [];
                let hasItems = false;
                
                const renderCell = (val, isApplicable) => {
                    if (!isApplicable) return `<td style="background:#f1f5f9;"></td>`;
                    if (val === 'Y' || val === true) return `<td style="text-align:center; font-weight:bold; color: green; font-size:1.1rem;">✔</td>`;
                    if (val === 'N') return `<td style="text-align:center; font-weight:bold; color: red; font-size:1.1rem;">❌</td>`;
                    return `<td style="text-align:center; color: #9ca3af; font-size:0.75rem; font-weight:bold;">NOT FILLED</td>`;
                };

                performaItems.forEach((item, idx) => {
                    hasItems = true;
                    const check = (row.checks && row.checks[idx]) ? row.checks[idx] : {};
                    html += `<tr>
                        <td style="font-weight:600; color:#1e293b; font-size:1.05em; text-align:left;">${item.name}</td>
                        ${renderCell(check.m, item.m)}
                        ${renderCell(check.e, item.e)}
                        ${renderCell(check.n, item.n)}
                    </tr>`;
                });
                
                if (!hasItems) {
                    html += `<tr><td colspan="4" style="text-align:center; color:#666; font-style:italic;">No performa items found.</td></tr>`;
                }

                html += `</tbody></table></div>`;
            });
        }
        html += `</div>`;

        // 4. Plant Report
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>4. Plant Report (Combined)</h3>`;
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
                            ${Array.isArray(row.grd) ? row.grd.map(g => `
                                <tr>
                                    <td>${g.g || '-'}</td>
                                    <td>${g.t || '-'}</td>
                                    <td>${g.m || '-'}</td>
                                    <td>${g.hz || '-'}</td>
                                    <td>${g.aa || '-'} / ${g.am || '-'}</td>
                                    <td>${g.ov || '-'}</td>
                                    <td>${g.rm || '-'}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td>${row.grd?.g || '-'}</td>
                                    <td>${row.grd?.t || '-'}</td>
                                    <td>${row.grd?.m || '-'}</td>
                                    <td>${row.grd?.hz || '-'}</td>
                                    <td>${row.grd?.aa || '-'} / ${row.grd?.am || '-'}</td>
                                    <td>${row.grd?.ov || '-'}</td>
                                    <td>${row.grd?.rm || '-'}</td>
                                </tr>
                            `}
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
                            ${Array.isArray(row.pel) ? row.pel.map(p => `
                                <tr>
                                    <td>${p.m || '-'}</td>
                                    <td>${p.t || '-'}</td>
                                    <td>${p.f || '-'}</td>
                                    <td>${p.hz || '-'}</td>
                                    <td>${p.aa || '-'} / ${p.am || '-'}</td>
                                    <td>${p.p || '-'}</td>
                                    <td>${p.tm || '-'}</td>
                                    <td>${p.sm || '-'}</td>
                                    <td>${p.d || '-'}</td>
                                    <td>${p.rm || '-'}</td>
                                </tr>
                            `).join('') : `
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
                            `}
                        </tbody>
                    </table>

                </div>`;
            });
        }
        html += `</div>`;

        // 5. Physical Visit (Combined)
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>5. Physical Visit (Combined)</h3>`;
        if (plantReportData.length > 0) {
            const locations = ['Basement', 'Ground Flr', '1st Flr (19)', '2nd Flr (51)', '3rd Flr (67)', '4th Flr (91)', 'Roof (110)', 'Silos Top', 'Silos Tower', 'Dryer Side'];
            const params = ['Floor & Walls Cleaning', 'Machine Cleaning', 'Leakage', 'Abnormal Machine Sound', 'Unnecessary item'];
            
            html += `<div style="border: 1px solid #000; padding: 1rem; page-break-inside: avoid; background: #fff;">
                <table class="pdf-table" style="font-size:0.85rem;">
                    <thead>
                        <tr>
                            <th style="width:140px;">Parameter</th>
                            <th style="width:70px;">Shift</th>`;
            locations.forEach(loc => { html += `<th>${loc}</th>`; });
            html += `</tr>
                    </thead>
                    <tbody>`;
            
            const shifts = ['Morning', 'Evening', 'Night'];
            params.forEach((pName, pIdx) => {
                shifts.forEach((shiftName, sIdx) => {
                    const row = plantReportData.find(r => r.shift === shiftName);
                    html += `<tr>`;
                    if (sIdx === 0) {
                        html += `<td rowspan="3" style="font-weight:bold; vertical-align:middle; background:#f8fafc;">${pName}</td>`;
                    }
                    html += `<td style="font-weight:600; color:#555; text-align:center;">${shiftName.substring(0,3)}</td>`;
                    
                    locations.forEach((loc, lIdx) => {
                        if (!row) {
                            html += `<td style="text-align:center;color:#ccc;">-</td>`;
                        } else {
                            const checked = row.pv && row.pv[pIdx] ? !!row.pv[pIdx][lIdx] : false;
                            html += `<td style="text-align:center; font-weight:bold; color: ${checked ? 'green' : '#ccc'};">${checked ? '✓' : '-'}</td>`;
                        }
                    });
                    html += `</tr>`;
                });
            });
            html += `</tbody></table></div>`;
        } else {
            html += `<p style="color:#666; font-style:italic;">No physical visit data found.</p>`;
        }
        html += `</div>`;

        // 6. Quality Standards
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>6. Quality Standards (Combined)</h3>`;
        if (qsReportData.length > 0) {
            const qsM = qsReportData.find(r => r.shift === 'Morning') || {};
            const qsE = qsReportData.find(r => r.shift === 'Evening') || {};
            const qsN = qsReportData.find(r => r.shift === 'Night') || {};
            
            html += `<div style="border: 1px solid #000; padding: 1rem; page-break-inside: avoid; background: #fff;">
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th style="vertical-align:bottom;">Standard / Checklist Item</th>
                            <th style="width: 100px; text-align: center;">
                                <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${qsM.officer || '-'}</strong></div>
                                Morning
                            </th>
                            <th style="width: 100px; text-align: center;">
                                <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${qsE.officer || '-'}</strong></div>
                                Evening
                            </th>
                            <th style="width: 100px; text-align: center;">
                                <div style="font-size:0.75rem; color:#555; font-weight:normal; margin-bottom:2px;">Officer Name:<br><strong style="color:#000;">${qsN.officer || '-'}</strong></div>
                                Night
                            </th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            const renderQsCell = (shiftData, idx, type) => {
                if (!shiftData.shift) return `<td style="background:#f1f5f9; text-align:center; color:#9ca3af; font-size:0.75rem;">N/A</td>`;
                const vals = type === 'B' ? shiftData.bVals : shiftData.pVals;
                const checked = vals && vals[idx] ? true : false;
                return `<td style="text-align:center; font-weight:bold; color: ${checked ? 'green' : 'red'}; font-size:1.1rem;">${checked ? '✔' : '❌'}</td>`;
            };

            const bItems = window.QS_BATCHING_ITEMS || [];
            if (bItems.length > 0) {
                html += `<tr><td colspan="4" style="background:#f8fafc; font-weight:bold;">Batching Standards</td></tr>`;
                bItems.forEach((item, idx) => {
                    html += `<tr>
                        <td class="urdu-text" style="direction: rtl; font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; text-align: right; font-size: 1.4em; font-weight: bold; color: #000; line-height: 1.6;">${item}</td>
                        ${renderQsCell(qsM, idx, 'B')}
                        ${renderQsCell(qsE, idx, 'B')}
                        ${renderQsCell(qsN, idx, 'B')}
                    </tr>`;
                });
            }

            const pItems = window.QS_PELLET_ITEMS || [];
            if (pItems.length > 0) {
                html += `<tr><td colspan="4" style="background:#f8fafc; font-weight:bold;">Pellet Standards</td></tr>`;
                pItems.forEach((item, idx) => {
                    html += `<tr>
                        <td class="urdu-text" style="direction: rtl; font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; text-align: right; font-size: 1.4em; font-weight: bold; color: #000; line-height: 1.6;">${item}</td>
                        ${renderQsCell(qsM, idx, 'P')}
                        ${renderQsCell(qsE, idx, 'P')}
                        ${renderQsCell(qsN, idx, 'P')}
                    </tr>`;
                });
            }

            html += `</tbody></table></div>`;
        } else {
            html += `<p style="font-style:italic;color:#666;">No quality standards data for this date.</p>`;
        }
        html += `</div>`;

        // 7. Silo Dumping
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>7. Silo Dumping Moisture (24-Hour Combined)</h3>`;
        if (siloDumpData.length >= 0) { // Always show, even if no data, since user wants empty items too. Wait, if there's absolutely no data filled, it might still be good to show the blank 24 hours table. But let's check `if (true)`
            const times = [];
            for (let i = 0; i < 48; i++) {
                let totalMinutes = i * 30;
                let h = Math.floor(totalMinutes / 60);
                let m = totalMinutes % 60;
                let hh24 = h < 10 ? '0'+h : h;
                let mm = m === 0 ? '00' : '30';
                
                let ampm = h >= 12 ? 'PM' : 'AM';
                let h12 = h % 12;
                if (h12 === 0) h12 = 12;
                let hh12 = h12 < 10 ? '0'+h12 : h12;
                
                times.push(`${hh12}:${mm} ${ampm}`);
            }

            let rowsHtml = '';
            
            times.forEach((timeStr, i) => {
                let filledRow = null;
                let filledShift = '-';
                let filledOfficer = '-';

                siloDumpData.forEach(r => {
                    if (r.rows && r.rows[i]) {
                        const row = r.rows[i];
                        const hasA = row.amois || row.acr || row.acond || row.asilo;
                        const hasB = row.bmois || row.bcr || row.bcond || row.bsilo;
                        if (hasA || hasB) {
                            filledRow = row;
                            filledShift = r.shift || '-';
                            filledOfficer = r.officer || '-';
                        }
                    }
                });

                if (!filledRow) {
                    filledRow = { mat: '-', amois: '-', acr: '-', acond: '-', asilo: '-', bmois: '-', bcr: '-', bcond: '-', bsilo: '-' };
                } else {
                    ['mat','amois','acr','acond','asilo','bmois','bcr','bcond','bsilo'].forEach(k => {
                        if (!filledRow[k]) filledRow[k] = '-';
                    });
                }

                rowsHtml += `<tr>
                    <td style="font-weight:bold; font-size:0.75rem;">${timeStr}</td>
                    <td style="font-weight:bold; color:var(--primary);">${filledShift}</td>
                    <td>${filledOfficer}</td>
                    <td>${filledRow.mat}</td>
                    <td style="border-left: 2px solid #000;">${filledRow.amois}</td>
                    <td>${filledRow.acr}</td>
                    <td>${filledRow.acond}</td>
                    <td style="border-right: 2px solid #000;">${filledRow.asilo}</td>
                    
                    <td>${filledRow.bmois}</td>
                    <td>${filledRow.bcr}</td>
                    <td>${filledRow.bcond}</td>
                    <td>${filledRow.bsilo}</td>
                </tr>`;
            });

            html += `<div style="border: 1px solid #000; padding: 1rem; margin-bottom: 1.5rem; background: #fff; page-break-inside: avoid;">
                <table class="pdf-table" style="font-size:0.8rem; text-align:center;">
                    <thead>
                        <tr>
                            <th rowspan="2" style="vertical-align:middle; width: 110px;">Time</th>
                            <th rowspan="2" style="vertical-align:middle;">Shift</th>
                            <th rowspan="2" style="vertical-align:middle;">Officer</th>
                            <th rowspan="2" style="vertical-align:middle;">Material</th>
                            <th colspan="4" style="border-left: 2px solid #000; border-right: 2px solid #000;">A Line</th>
                            <th colspan="4">B Line</th>
                        </tr>
                        <tr>
                            <th style="border-left: 2px solid #000;">Moisture</th>
                            <th>C.R</th>
                            <th>Condition</th>
                            <th style="border-right: 2px solid #000;">Silo</th>
                            
                            <th>Moisture</th>
                            <th>C.R</th>
                            <th>Condition</th>
                            <th>Silo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>`;
        } else {
            html += `<p style="font-style: italic; color: #666;">No Silo Dumping records filled yet.</p>`;
        }
        
        html += `</div>`;
        // 8. Silo Moisture Records
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>8. Silo Moisture Records (Control Room / Lab)</h3>`;
        if (siloMoistData.length > 0 && siloMoistData.some(r => r.rows && r.rows.length > 0)) {
            const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
            let formulaVal = formulas[selectedDate];
            if (formulaVal === undefined) {
                const globalVal = localStorage.getItem('fm_global_formula_moisture');
                if (globalVal !== null && globalVal !== '') {
                    formulaVal = parseFloat(globalVal);
                }
            }
            const formulaDisplay = formulaVal !== undefined ? formulaVal + '%' : 'N/A';

            html += `<table class="pdf-table"><thead><tr>
                <th>Shift</th><th>Officer</th><th>Silo No</th><th>Material</th><th>Control Room %</th><th>Lab Ungrind %</th><th>Lab Grind %</th><th>Remarks</th>
            </tr></thead><tbody>`;
            
            let sum = 0, count = 0;
            siloMoistData.forEach(r => {
                (r.rows || []).forEach(row => {
                    const mat = (row.material || '').trim().toLowerCase();
                    if (mat !== 'maize') return; // Only display maize

                    const valUngrind = row.moistureUngrind || row.moisture || '-';
                    const valGrind = row.moistureGrind || '-';

                    html += `<tr>
                        <td><strong>${r.shift || '-'}</strong></td>
                        <td>${r.officerName || '-'}</td>
                        <td>${row.silo || '-'}</td>
                        <td>${row.material || '-'}</td>
                        <td>${row.ctrlMoisture ? row.ctrlMoisture + '%' : '-'}</td>
                        <td>${valUngrind}</td>
                        <td>${valGrind}</td>
                        <td>${row.remarks || '-'}</td>
                    </tr>`;
                    const m = parseFloat(row.ctrlMoisture);
                    if (!isNaN(m)) { sum += m; count++; }
                });
            });
            html += `</tbody></table>`;
            
            // Add Moisture Summary
            const avg = count > 0 ? (sum / count).toFixed(2) : '0.00';
            
            html += `<div style="margin-top:10px; padding:15px; border:1px solid #000; background:#f9fafb; text-align:center; border-radius:8px;">
                <strong style="font-size:1.1em; color:#1f2937;">Daily Moisture Summary (All Shifts):</strong><br><br>
                <span style="color:#4b5563;">Actual Average:</span> <strong>${count > 0 ? avg + '%' : 'N/A'}</strong> (Based on ${count} readings)<br>`;
            
            if (formulaVal !== undefined) {
                html += `<span style="color:#4b5563;">Formula Moisture:</span> <strong>${formulaVal}%</strong><br><br>`;
                if (count > 0) {
                    const diff = parseFloat((avg - formulaVal).toFixed(2));
                    const absDiff = Math.abs(diff);
                    const sign = diff > 0 ? '+' : '';
                    if (absDiff === 0) {
                        html += `<strong style="color:#10b981; font-size:1.4em;">Difference: 0.00% (Match)</strong><br>`;
                    } else if (absDiff <= 2) {
                        html += `<strong style="color:#0284c7; font-size:1.4em;">Difference: ${sign}${diff}% (Within Limits)</strong><br>`;
                    } else {
                        html += `<strong style="color:#e11d48; font-size:1.4em;">Difference: ${sign}${diff}% (Out of Range!)</strong><br>`;
                    }
                } else {
                    html += `<strong style="color:#6b7280; font-size:1.4em;">Difference: N/A (No maize readings)</strong><br>`;
                }
            } else {
                html += `<strong style="color:#6b7280; font-size:1.1em;">Formula Moisture: Not Entered</strong><br>`;
            }
            html += `</div>`;

        } else {
            html += `<p style="font-style: italic; color: #666;">No Silo Moisture records filled yet.</p>`;
        }
        html += `</div>`;

        // 9. Daily Less / Excess Report (Combined)
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>9. Daily Less / Excess Report (Combined)</h3>`;
        
        try {
            const allLeLogs = JSON.parse(localStorage.getItem('fmpr_lessExcessLogs') || '[]');
            
            // Format selectedDate for Less/Excess filter
            let leFormattedDate = selectedDate;
            const leParts = selectedDate.split('-');
            if (leParts.length === 3) {
                const day = parseInt(leParts[2], 10);
                const monthIndex = parseInt(leParts[1], 10) - 1;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                if (monthIndex >= 0 && monthIndex < 12) {
                    leFormattedDate = day + '-' + months[monthIndex];
                }
            }
            
            const leLogs = allLeLogs.filter(r => r.date === leFormattedDate || r.date === selectedDate);
            
            if (leLogs.length > 0) {
                // Calculate overall averages first
                const feedTotals = {};
                allLeLogs.forEach(log => {
                    const expectedBags = (log.batches || 0) * 100;
                    const diffBags = (log.productionBags || 0) - expectedBags;
                    if (!feedTotals[log.feedName]) feedTotals[log.feedName] = { expected: 0, diff: 0 };
                    feedTotals[log.feedName].expected += expectedBags;
                    feedTotals[log.feedName].diff += diffBags;
                    const totals = feedTotals[log.feedName];
                    let pct = '0.00%';
                    if (totals && totals.expected > 0) {
                        const pctNum = (totals.diff / totals.expected) * 100;
                        pct = pctNum.toFixed(2) + '%';
                        if (pctNum > 0) pct = '+' + pct;
                    }
                    log._overallPct = pct;
                });
                
                // Group by shift/officer
                const groups = {};
                leLogs.forEach(log => {
                    const key = `${log.shift} - ${log.officerName}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(log);
                });
                
                let totalBatches = 0, totalProdBags = 0, totalExpectedBags = 0;
                
                Object.keys(groups).forEach(key => {
                    const logs = groups[key];
                    const [shift, officer] = key.split(' - ');
                    
                    html += `
                        <div style="margin-top:10px; border:1px solid #000; padding:10px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 10px 0; background:#f1f5f9; padding:5px; text-align:left !important;">Shift: ${shift} | Officer: ${officer}</h4>
                            <table class="pdf-table">
                                <thead>
                                    <tr>
                                        <th>Feed Name</th>
                                        <th>Batches</th>
                                        <th>Prod. Bags</th>
                                        <th>Difference</th>
                                        <th>Percentage</th>
                                        <th>Overall Avg L/E</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    let shiftExpected = 0, shiftProd = 0;
                    
                    logs.forEach(log => {
                        const expected = (log.batches || 0) * 100;
                        const prod = log.productionBags || 0;
                        const diff = prod - expected;
                        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                        const pct = expected > 0 ? ((diff / expected) * 100).toFixed(2) + '%' : '0.00%';
                        const pctStr = diff > 0 ? `+${pct}` : `${pct}`;
                        
                        shiftExpected += expected; shiftProd += prod;
                        totalBatches += (log.batches || 0); totalProdBags += prod; totalExpectedBags += expected;
                        
                        html += `
                            <tr>
                                <td>${log.feedName || '-'}</td>
                                <td>${log.batches || '0'}</td>
                                <td>${prod.toLocaleString()}</td>
                                <td style="font-weight:bold; color:${diff >= 0 ? '#15803d' : '#b91c1c'};">${diffStr}</td>
                                <td style="font-weight:bold; color:${diff >= 0 ? '#15803d' : '#b91c1c'};">${pctStr}</td>
                                <td style="font-weight:bold; color:${(log._overallPct||'').startsWith('+') ? '#15803d' : (log._overallPct||'').startsWith('-') ? '#b91c1c' : '#475569'};">${log._overallPct || '-'}</td>
                                <td>${log.remarks || '-'}</td>
                            </tr>
                        `;
                    });
                    
                    const shiftDiff = shiftProd - shiftExpected;
                    const shiftDiffStr = shiftDiff > 0 ? `+${shiftDiff}` : `${shiftDiff}`;
                    const shiftPct = shiftExpected > 0 ? ((shiftDiff / shiftExpected) * 100).toFixed(2) + '%' : '0.00%';
                    const shiftPctStr = shiftDiff > 0 ? `+${shiftPct}` : `${shiftPct}`;
                    
                    html += `
                                    <tr style="font-weight:bold; background-color:#f8fafc;">
                                        <td>Total</td>
                                        <td>-</td>
                                        <td>${shiftProd.toLocaleString()}</td>
                                        <td style="color:${shiftDiff >= 0 ? '#15803d' : '#b91c1c'};">${shiftDiffStr}</td>
                                        <td style="color:${shiftDiff >= 0 ? '#15803d' : '#b91c1c'};">${shiftPctStr}</td>
                                        <td>-</td>
                                        <td>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    `;
                });
                
                // Overall summary
                const overallDiff = totalProdBags - totalExpectedBags;
                const overallDiffStr = overallDiff > 0 ? `+${overallDiff}` : `${overallDiff}`;
                const overallPct = totalExpectedBags > 0 ? ((overallDiff / totalExpectedBags) * 100).toFixed(2) + '%' : '0.00%';
                const overallPctStr = overallDiff > 0 ? `+${overallPct}` : `${overallPct}`;
                
                html += `
                    <div style="margin-top:15px; border:2px solid #000; padding:10px; background-color:#f8fafc; page-break-inside: avoid;">
                        <h4 style="margin:0 0 10px 0;">Daily Overall Summary (All Shifts Combined)</h4>
                        <table class="pdf-table">
                            <thead>
                                <tr>
                                    <th>Overall Batches</th>
                                    <th>Overall Production</th>
                                    <th>Overall Avg Less/Excess</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="font-weight:bold;">${totalBatches}</td>
                                    <td style="font-weight:bold;">${totalProdBags.toLocaleString()} Bags</td>
                                    <td style="font-weight:bold; color:${overallDiff >= 0 ? '#15803d' : '#b91c1c'};">${overallPctStr} (${overallDiffStr} Bags)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                html += `<p style="font-style: italic; color: #666;">No Less/Excess logs found for this date.</p>`;
            }
        } catch(e) {
            console.error(e);
            html += `<p style="color:red;">Error loading Less/Excess Report.</p>`;
        }
        html += `</div>`;

        // 10. Department Daily Checklists
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>10. Department Daily Checklists (Combined)</h3>`;
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
                let hasCheckedItems = false;
                questions.forEach((q, idx) => {
                    const isChecked = dc.checkedItems ? !!dc.checkedItems[idx] : false;
                    if (isChecked) {
                        hasCheckedItems = true;
                        html += `<tr>
                            <td>${q}</td>
                            <td style="text-align: center; font-weight: bold; color: green;">✅ Yes</td>
                        </tr>`;
                    }
                });
                
                if (!hasCheckedItems) {
                    html += `<tr>
                        <td colspan="2" style="text-align: center; font-style: italic; color: #666;">No items were checked for this department.</td>
                    </tr>`;
                }

                html += `</tbody></table>`;
                if (dc.remarks) {
                    html += `<div style="font-size: 0.9rem; color: #555; margin-top: 0.5rem;"><strong>Remarks:</strong> ${dc.remarks}</div>`;
                }
                html += `</div>`;
            });
        }
        html += `</div>`;

        // Dryer Side Reports
        if (dryerReportData && dryerReportData.length > 0) {
            html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>11. Dryer Side Shift Reports</h3>`;
            dryerReportData.forEach(r => {
                html += `
                <div style="border:1px solid #000; padding:10px; margin-bottom:15px; page-break-inside: avoid;">
                    <p><strong>Shift:</strong> ${r.shift} | <strong>Operator:</strong> ${r.operator_name || r.operatorName}</p>
                    
                    <h4>Material Dumping</h4>
                    <table class="pdf-table" style="width:100%; font-size:0.8rem; margin-bottom:5px;">
                        <thead><tr><th>Material</th><th>On Time</th><th>Off Time</th><th>Silo/Wet Bin</th><th>Break</th><th>Remarks</th></tr></thead>
                        <tbody>
                            ${Array.isArray(r.material_dumping) && r.material_dumping.length > 0 ? r.material_dumping.map(d => `<tr><td>${d.material}</td><td>${d.onTime}</td><td>${d.offTime}</td><td>${d.siloWetBin}</td><td>${d.breakReason || ''}</td><td>${d.remarks}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;">No records</td></tr>'}
                        </tbody>
                    </table>
                    ${(r.dumping_total_weight || r.dumping_total_eff) ? `
                    <div style="font-size:0.85rem; font-weight:bold; margin-bottom:10px; background:#f1f5f9; padding:4px 8px; border:1px solid #cbd5e1; display:inline-block;">
                        Total Weight: ${r.dumping_total_weight || '-'} kg &nbsp;|&nbsp; Efficiency: ${r.dumping_total_eff || '-'}
                    </div>` : '<div style="margin-bottom:10px;"></div>'}

                    <h4>Material Discharge</h4>
                    <table class="pdf-table" style="width:100%; font-size:0.8rem; margin-bottom:10px;">
                        <thead><tr><th>Material</th><th>Silo No.</th><th>On Time</th><th>Off Time</th><th>Break</th><th>Remarks</th></tr></thead>
                        <tbody>
                            ${Array.isArray(r.material_discharge) && r.material_discharge.length > 0 ? r.material_discharge.map(d => `<tr><td>${d.material}</td><td>${d.siloNo}</td><td>${d.onTime}</td><td>${d.offTime}</td><td>${d.breakReason || ''}</td><td>${d.remarks}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;">No records</td></tr>'}
                        </tbody>
                    </table>

                    <table style="width:100%; font-size:0.8rem; margin-bottom:10px;">
                        <tr>
                            <td style="vertical-align:top; width:50%; padding-right:10px;">
                                <h4>Silos Discharge Gates</h4>
                                <table class="pdf-table" style="width:100%;">
                                    <thead><tr><th>Conv #</th><th>Silo #</th><th>Gate #</th><th>Open</th></tr></thead>
                                    <tbody>
                                        ${Array.isArray(r.silos_discharge_gates) ? r.silos_discharge_gates.map(g => `<tr><td>${g.conveyor}</td><td>${g.silo}</td><td>${g.gate}</td><td>${g.isOpen ? 'Yes' : 'No'}</td></tr>`).join('') : ''}
                                    </tbody>
                                </table>
                            </td>
                            <td style="vertical-align:top; width:50%;">
                                <h4>Silo Status</h4>
                                <table class="pdf-table" style="width:100%;">
                                    <thead><tr><th>Silo</th><th>On Time</th><th>Off Time</th><th>Meter (Hrs)</th></tr></thead>
                                    <tbody>
                                        ${r.silo_status ? `
                                            <tr><td>Silo 08</td><td>${r.silo_status.silo08 ? r.silo_status.silo08.onTime : ''}</td><td>${r.silo_status.silo08 ? r.silo_status.silo08.offTime : ''}</td><td>${r.silo_status.silo08 ? r.silo_status.silo08.meter : ''}</td></tr>
                                            <tr><td>Silo 09</td><td>${r.silo_status.silo09 ? r.silo_status.silo09.onTime : ''}</td><td>${r.silo_status.silo09 ? r.silo_status.silo09.offTime : ''}</td><td>${r.silo_status.silo09 ? r.silo_status.silo09.meter : ''}</td></tr>
                                            <tr><td>Silo 10</td><td>${r.silo_status.silo10 ? r.silo_status.silo10.onTime : ''}</td><td>${r.silo_status.silo10 ? r.silo_status.silo10.offTime : ''}</td><td>${r.silo_status.silo10 ? r.silo_status.silo10.meter : ''}</td></tr>
                                            <tr><td>Silo 11</td><td>${r.silo_status.silo11 ? r.silo_status.silo11.onTime : ''}</td><td>${r.silo_status.silo11 ? r.silo_status.silo11.offTime : ''}</td><td>${r.silo_status.silo11 ? r.silo_status.silo11.meter : ''}</td></tr>
                                            <tr><td>Silo 12</td><td>${r.silo_status.silo12 ? r.silo_status.silo12.onTime : ''}</td><td>${r.silo_status.silo12 ? r.silo_status.silo12.offTime : ''}</td><td>${r.silo_status.silo12 ? r.silo_status.silo12.meter : ''}</td></tr>
                                            <tr><td>Silo 13</td><td>${r.silo_status.silo13 ? r.silo_status.silo13.onTime : ''}</td><td>${r.silo_status.silo13 ? r.silo_status.silo13.offTime : ''}</td><td>${r.silo_status.silo13 ? r.silo_status.silo13.meter : ''}</td></tr>
                                            <tr><td>Silo 14</td><td>${r.silo_status.silo14 ? r.silo_status.silo14.onTime : ''}</td><td>${r.silo_status.silo14 ? r.silo_status.silo14.offTime : ''}</td><td>${r.silo_status.silo14 ? r.silo_status.silo14.meter : ''}</td></tr>
                                            <tr><td>Silo 15</td><td>${r.silo_status.silo15 ? r.silo_status.silo15.onTime : ''}</td><td>${r.silo_status.silo15 ? r.silo_status.silo15.offTime : ''}</td><td>${r.silo_status.silo15 ? r.silo_status.silo15.meter : ''}</td></tr>
                                            <tr><td>Silo 16</td><td>${r.silo_status.silo16 ? r.silo_status.silo16.onTime : ''}</td><td>${r.silo_status.silo16 ? r.silo_status.silo16.offTime : ''}</td><td>${r.silo_status.silo16 ? r.silo_status.silo16.meter : ''}</td></tr>
                                            <tr><td>Wet Bin</td><td>${r.silo_status.wetBin ? r.silo_status.wetBin.onTime : ''}</td><td>${r.silo_status.wetBin ? r.silo_status.wetBin.offTime : ''}</td><td>${r.silo_status.wetBin ? r.silo_status.wetBin.meter : ''}</td></tr>
                                            <tr><td>Cooling Bin</td><td>${r.silo_status.coolingBin ? r.silo_status.coolingBin.onTime : ''}</td><td>${r.silo_status.coolingBin ? r.silo_status.coolingBin.offTime : ''}</td><td>${r.silo_status.coolingBin ? r.silo_status.coolingBin.meter : ''}</td></tr>
                                        ` : ''}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <p style="font-size:0.8rem; margin:5px 0;"><strong>Faults & Causes:</strong> ${r.faults_and_causes || '-'}</p>
                    <p style="font-size:0.8rem; margin:5px 0;"><strong>General:</strong> ${r.general || '-'}</p>
                    ${r.summary ? `<p style="font-size:0.8rem; margin:5px 0;"><strong>Summary:</strong> ${r.summary}</p>` : ''}
                    ${r.supervisor_approval ? `<p style="font-size:0.85rem; margin:10px 0 5px 0; background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 6px 10px; border-radius: 4px; font-weight: bold; display: inline-block;">🟢 Approved by Supervisor: ${r.supervisor_approval}</p>` : ''}
                </div>
                `;
            });
            html += `</div>`;
        }

        // Approval & Remarks Block
        html += `
            <div class="pdf-approval-block" style="margin-top: 30px; border-top: 2px solid #1e293b; padding-top: 20px; page-break-inside: avoid;">
                <h3 style="margin-top:0; color: #1e293b; font-size: 1.1rem; margin-bottom: 15px;">Production Manager Remarks</h3>
                <textarea id="preview-approval-remarks" rows="3" placeholder="Write remarks here... (they will appear on the printed report)" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-family: inherit; font-size: 0.95rem; resize: vertical; outline: none; background: #f8fafc; box-sizing: border-box;">${remarks || ''}</textarea>
                
                <div class="signature-box" style="margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div style="text-align:center;">
                        <div style="border-bottom: 1px solid #000; width:250px; padding-bottom:5px;"></div>
                        <div style="margin-top:8px; font-weight:600;">Production Manager Signature</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="border-bottom: 1px solid #000; width:150px; padding-bottom:5px; font-weight:bold;">
                            ${new Date().toLocaleDateString('en-GB')}
                        </div>
                        <div style="margin-top:8px; font-weight:600;">Date</div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    let pdfSbClient = null;
    const initPdfSb = () => {
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl') || (window.env && window.env.SUPABASE_URL) || '';
        const sbKey = localStorage.getItem('fmpr_supabaseKey') || (window.env && window.env.SUPABASE_KEY) || '';
        if (sbUrl && sbKey && typeof supabase !== 'undefined') {
            const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
            pdfSbClient = supabase.createClient(cleanUrl, sbKey);
        }
    };

    // Initialize when DOM is ready
    const initPDFEvents = () => {
        initPdfSb();
        const updatePreview = () => {
            const chk = document.getElementById('preview-approval-check');
            const rem = document.getElementById('preview-approval-remarks');
            const isApproved = chk ? chk.checked : false;
            const remarks = rem ? rem.value.trim() : '';
            const html = generateCompleteShiftPDF(isApproved, remarks);
            const paper = document.getElementById('preview-document-paper');
            if (paper) paper.innerHTML = html;
        };

        const openPreviewModal = () => {
            const dateInput = document.getElementById('sr-filter-date');
            const selectedDate = dateInput ? dateInput.value.trim() : '';
            if (!selectedDate) {
                alert('Please select a date in the Daily Shift Reports section first to generate the PDF.');
                return;
            }
            
            // Default to approved and empty remarks when opening
            const chk = document.getElementById('preview-approval-check');
            if (chk) chk.checked = true;
            const rem = document.getElementById('preview-approval-remarks');
            if (rem) rem.value = '';

            const paper = document.getElementById('preview-document-paper');
            if (paper) paper.innerHTML = '<div style="padding:2rem;text-align:center;">Loading report...</div>';

            const modal = document.getElementById('report-preview-modal');
            if (modal) modal.classList.add('show');

            if (pdfSbClient) {
                pdfSbClient.from('generated_shift_reports').select('*').eq('report_date', selectedDate).limit(1).then(({data, error}) => {
                    if (!error && data && data.length > 0) {
                        let htmlStr = data[0].report_html;
                        
                        // If it's an old report without the textarea, upgrade it so it's editable
                        if (!htmlStr.includes('id="preview-approval-remarks"')) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = htmlStr;
                            const oldBlock = tempDiv.querySelector('.pdf-approval-block');
                            if (oldBlock) {
                                oldBlock.outerHTML = `
            <div class="pdf-approval-block" style="margin-top: 30px; border-top: 2px solid #1e293b; padding-top: 20px; page-break-inside: avoid;">
                <h3 style="margin-top:0; color: #1e293b; font-size: 1.1rem; margin-bottom: 15px;">Production Manager Remarks</h3>
                <textarea id="preview-approval-remarks" rows="3" placeholder="Write remarks here... (they will appear on the printed report)" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-family: inherit; font-size: 0.95rem; resize: vertical; outline: none; background: #f8fafc; box-sizing: border-box;">${data[0].supervisor_remarks || ''}</textarea>
                
                <div class="signature-box" style="margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div style="text-align:center;">
                        <div style="border-bottom: 1px solid #000; width:250px; padding-bottom:5px;"></div>
                        <div style="margin-top:8px; font-weight:600;">Production Manager Signature</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="border-bottom: 1px solid #000; width:150px; padding-bottom:5px; font-weight:bold;">
                            ${new Date(selectedDate).toLocaleDateString('en-GB') || new Date().toLocaleDateString('en-GB')}
                        </div>
                        <div style="margin-top:8px; font-weight:600;">Date</div>
                    </div>
                </div>
            </div>`;
                                htmlStr = tempDiv.innerHTML;
                            }
                        }
                        
                        if (paper) paper.innerHTML = htmlStr;
                        
                        // Sync saved remarks to the textarea
                        const remBox = paper ? paper.querySelector('#preview-approval-remarks') : null;
                        if (remBox) {
                            remBox.value = data[0].supervisor_remarks || '';
                            remBox.textContent = data[0].supervisor_remarks || '';
                        }
                    } else {
                        updatePreview();
                    }
                });
            } else {
                updatePreview();
            }
        };

        // Bind main trigger button to open preview
        const btnView = document.getElementById('btn-view-shift-report');
        if (btnView) btnView.addEventListener('click', openPreviewModal);

        // Auto-save remarks when typed in the View Report modal
        const paperContainer = document.getElementById('preview-document-paper');
        if (paperContainer) {
            // Keep innerHTML synced as they type
            paperContainer.addEventListener('input', (e) => {
                if (e.target && e.target.id === 'preview-approval-remarks') {
                    e.target.textContent = e.target.value;
                }
            });
            
            // Save to Supabase when they click outside the textarea
            paperContainer.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'preview-approval-remarks') {
                    const remarks = e.target.value.trim();
                    const html = paperContainer.innerHTML;
                    const dateInput = document.getElementById('sr-filter-date');
                    const selectedDate = dateInput ? dateInput.value.trim() : '';

                    if (selectedDate && pdfSbClient) {
                        const dbRecord = {
                            report_date: selectedDate,
                            report_html: html,
                            is_approved: false,
                            supervisor_remarks: remarks
                        };
                        pdfSbClient.from('generated_shift_reports').upsert([dbRecord], { onConflict: 'report_date' }).then(({error}) => {
                            if (!error) {
                                if (window.showToast) window.showToast('✓ Remarks auto-saved');
                                if (window.loadShiftReportsSummary) window.loadShiftReportsSummary();
                            }
                        });
                    }
                }
            });
        }

        // Close preview modal logic
        const closePreview = () => {
            document.getElementById('report-preview-modal').classList.remove('show');
        };

        const closeBtn = document.getElementById('btn-close-preview');
        if (closeBtn) closeBtn.addEventListener('click', closePreview);

        const cancelBtn = document.getElementById('btn-preview-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', closePreview);

        // Print & Save logic from preview modal
        const printBtn = document.getElementById('btn-preview-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                const chk = document.getElementById('preview-approval-check');
                const rem = document.getElementById('preview-approval-remarks');
                const isApproved = chk ? chk.checked : false;
                const remarks = rem ? rem.value.trim() : '';

                // Close preview modal
                document.getElementById('report-preview-modal').classList.remove('show');

                // FIX: Instead of regenerating from empty localStorage (which breaks backdated reports),
                // we grab the exact HTML that is currently displayed in the preview modal!
                const paper = document.getElementById('preview-document-paper');
                
                // Sync textarea value before grabbing HTML so typed remarks get printed
                if (paper) {
                    const remarkBox = paper.querySelector('#preview-approval-remarks');
                    if (remarkBox) {
                        remarkBox.textContent = remarkBox.value;
                    }
                }
                
                let html = paper ? paper.innerHTML : '';
                
                const container = document.getElementById('shift-report-print-container');
                if (container) container.innerHTML = html;

                if (pdfSbClient) {
                    const dateInput = document.getElementById('sr-filter-date');
                    const selectedDate = dateInput ? dateInput.value.trim() : '';
                    if (selectedDate) {
                        const dbRecord = {
                            report_date: selectedDate,
                            report_html: html,
                            is_approved: isApproved,
                            supervisor_remarks: remarks
                        };
                        pdfSbClient.from('generated_shift_reports').upsert([dbRecord], { onConflict: 'report_date' }).then(({error}) => {
                            if (error) console.error("PDF Supabase save error:", error);
                            else {
                                if (window.showToast) window.showToast('✓ Combined PDF Report saved to Supabase');
                                if (window.loadShiftReportsSummary) window.loadShiftReportsSummary();
                            }
                        });
                    }
                }

                // Trigger print using a robust popup window
                const printWindow = window.open('', '_blank', 'width=1000,height=800');
                if (printWindow) {
                    printWindow.document.write(`<!DOCTYPE html><html><head><title>Shift Report</title>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; padding: 20px; background: #fff; }
                            .pdf-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
                            .pdf-table th, .pdf-table td { border: 1px solid #000; padding: 6px; text-align: left; color: #000; }
                            .pdf-table th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .pdf-section { margin-bottom: 30px; page-break-inside: avoid; }
                            .pdf-section h3 { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; color: #000; padding: 8px; border: 1px solid #000; margin: 0; font-size: 14px; }
                            h1, h2, h3, h4 { color: #000; }
                            textarea { border: 1px solid #000; width: 100%; box-sizing: border-box; font-family: inherit; font-size: 13px; padding: 8px; }
                            @media print {
                                body { margin: 0; padding: 10px; }
                                textarea { resize: none; overflow: hidden; border: none; }
                            }
                        </style>
                    </head><body>${html}</body></html>`);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 500);
                } else {
                    alert('Please allow popups for this site to print the report.');
                }
            });
        }
    };

    function loadShiftReportsSummary() {
        const tbody = document.getElementById('generated-shift-reports-tbody');
        if (!tbody || !pdfSbClient) return;

        pdfSbClient.from('generated_shift_reports')
            .select('report_date, is_approved, supervisor_remarks')
            .order('report_date', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.error("Error loading shift reports history:", error);
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Failed to load reports</td></tr>';
                    return;
                }

                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#64748b;">No shift reports generated yet</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                data.forEach(report => {
                    let dateStr = report.report_date;
                    try {
                        const parts = report.report_date.split('-');
                        if (parts.length === 3) {
                            dateStr = new Date(report.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        }
                    } catch(e) {}

                    const remarks = report.supervisor_remarks ? report.supervisor_remarks : '<span style="color:#94a3b8;font-style:italic;">No remarks</span>';
                    const isApproved = report.is_approved === true || report.is_approved === 'true';
                    const rowBg = isApproved ? 'background-color: #f0fdf4;' : 'background-color: #ffffff;';
                    const btnStyle = isApproved 
                        ? 'background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 10px rgba(34,197,94,0.3); transition: all 0.3s; width: 120px;'
                        : 'background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.3s; width: 120px;';
                    const btnText = isApproved ? '✅ Approved' : '⏳ Pending';

                    const tr = document.createElement('tr');
                    tr.style.cssText = rowBg + ' transition: background-color 0.3s;';
                    tr.innerHTML = `
                        <td style="font-weight:700; color: #1e293b;">${dateStr}</td>
                        <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; color: #334155;" title="${report.supervisor_remarks || ''}">${remarks}</td>
                        <td style="text-align:center;">
                            <button onclick="window.toggleShiftReportApproval('${report.report_date}')" style="${btnStyle}">
                                ${btnText}
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-secondary" onclick="document.getElementById('sr-filter-date').value='${report.report_date}'; document.getElementById('btn-view-shift-report').click();" style="padding:0.3rem 0.8rem; font-size:0.85rem; border-radius: 6px; background: #3b82f6; color: white; border: none; box-shadow: 0 2px 5px rgba(59,130,246,0.3);">👁️ View Report</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            });
    }

    window.loadShiftReportsSummary = loadShiftReportsSummary;
    window.toggleShiftReportApproval = (dateStr) => {
        if (!pdfSbClient) return;
        pdfSbClient.from('generated_shift_reports')
            .select('is_approved')
            .eq('report_date', dateStr)
            .single()
            .then(({ data, error }) => {
                if (error || !data) return;
                const newState = !(data.is_approved === true || data.is_approved === 'true');
                pdfSbClient.from('generated_shift_reports')
                    .update({ is_approved: newState })
                    .eq('report_date', dateStr)
                    .then(({ error: updateErr }) => {
                        if (updateErr) {
                            console.error("Failed to update approval status:", updateErr);
                            alert("Failed to save approval status.");
                        } else {
                            if (window.showToast) {
                                window.showToast(newState ? '✓ Report Approved' : '✓ Approval Removed');
                            }
                            // Reload table to show green color immediately
                            loadShiftReportsSummary();
                        }
                    });
            });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPDFEvents();
            loadShiftReportsSummary();
        });
    } else {
        initPDFEvents();
        loadShiftReportsSummary();
    }
})();
