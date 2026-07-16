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
            <div class="pdf-report-header">
                <h1>Combined Daily Shift Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // NEW COMPARISON SUMMARY
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>Summary: Shift A vs B vs C</h3>`;
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


        // 1. Raw Material
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>1. Raw Material Checks (Combined)</h3>`;
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

        // 2. Performas
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>2. Performas (Combined)</h3>`;
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
                        <td>${item.name}</td>
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

        // 3. Plant Report
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>3. Plant Report (Combined)</h3>`;
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
        }
        html += `</div>`;

        // 4. Quality Standards
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>4. Quality Standards (Combined)</h3>`;
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
                        <td class="urdu-text" style="direction: rtl; font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; text-align: right;">${item}</td>
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
                        <td class="urdu-text" style="direction: rtl; font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; text-align: right;">${item}</td>
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

        // 5. Silo Dumping
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>5. Silo Dumping Moisture (24-Hour Combined)</h3>`;
        if (siloDumpData.length > 0) {
            const times = [];
            for (let i = 0; i < 48; i++) {
                let totalMinutes = i * 30;
                let h = Math.floor(totalMinutes / 60);
                let m = totalMinutes % 60;
                times.push(`${h < 10 ? '0'+h : h}:${m === 0 ? '00' : '30'}`);
            }

            let rowsHtml = '';
            let hasData = false;

            times.forEach((timeStr, i) => {
                // Find if any shift has data for this timeslot index 'i'
                let filledRow = null;
                let filledShift = '';
                let filledOfficer = '';

                siloDumpData.forEach(r => {
                    if (r.rows && r.rows[i]) {
                        const row = r.rows[i];
                        const hasA = row.amois || row.acr || row.acond || row.asilo;
                        const hasB = row.bmois || row.bcr || row.bcond || row.bsilo;
                        // ONLY consider the row filled if it has A Line or B Line data
                        // Ignore the material default value "Winter Maize"
                        if (hasA || hasB) {
                            filledRow = row;
                            filledShift = r.shift || '-';
                            filledOfficer = r.officer || '-';
                        }
                    }
                });

                if (filledRow) {
                    hasData = true;
                    rowsHtml += `<tr>
                        <td style="font-weight:bold;">${timeStr}</td>
                        <td style="font-weight:bold; color:var(--primary);">${filledShift}</td>
                        <td>${filledOfficer}</td>
                        <td>${filledRow.mat || '-'}</td>
                        <td style="border-left: 2px solid #000;">${filledRow.amois || '-'}</td>
                        <td>${filledRow.acr || '-'}</td>
                        <td>${filledRow.acond || '-'}</td>
                        <td style="border-right: 2px solid #000;">${filledRow.asilo || '-'}</td>
                        
                        <td>${filledRow.bmois || '-'}</td>
                        <td>${filledRow.bcr || '-'}</td>
                        <td>${filledRow.bcond || '-'}</td>
                        <td>${filledRow.bsilo || '-'}</td>
                    </tr>`;
                }
            });

            if (hasData) {
                html += `<div style="border: 1px solid #000; padding: 1rem; margin-bottom: 1.5rem; background: #fff; page-break-inside: avoid;">
                    <table class="pdf-table" style="font-size:0.8rem; text-align:center;">
                        <thead>
                            <tr>
                                <th rowspan="2" style="vertical-align:middle; width: 60px;">Time</th>
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
                html += `<p style="font-style: italic; color: #666;">No valid readings filled across shifts.</p>`;
            }
        } else {
            html += `<p style="font-style: italic; color: #666;">No Silo Dumping records filled yet.</p>`;
        }
        
        html += `</div>`;
        // 6. Silo Moisture
        if (siloMoistData.length > 0 && siloMoistData.some(r => r.rows && r.rows.length > 0)) {
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

        }
        html += `</div>`;

        // 7. Department Daily Checklists
        html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>7. Department Daily Checklists (Combined)</h3>`;
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
            html += `<div class="pdf-section" style="page-break-inside: avoid; margin-bottom: 20px;"><h3>Dryer Side Shift Reports</h3>`;
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

        // Approval Block
        if (isApproved) {
            html += `
                <div class="pdf-approval-block" style="border: 2px solid green; padding: 15px; border-radius: 8px;">
                    <h3 style="margin-top:0; border-bottom:1px solid green; padding-bottom:10px; color: green;">Production Manager Approval</h3>
                    <div style="margin-top:15px; font-size:1.1rem; display:flex; align-items:center; gap:0.5rem; color: green; font-weight: bold;">
                        <span>✅ APPROVED BY PRODUCTION MANAGER</span>
                    </div>
                    <div style="margin-top:15px;">
                        <strong>Comments / Remarks:</strong>
                        <div style="border: 1px solid #ddd; background: #f9f9f9; padding: 10px; border-radius: 4px; margin-top:5px; font-style: italic; color: #333;">
                            ${remarks ? remarks : 'Approved with one-click approval.'}
                        </div>
                    </div>
                    <div class="signature-box" style="margin-top:25px;">
                        <div>
                            <div style="font-weight:bold; font-family:'Courier New', monospace; border-bottom:1px solid #000; padding-bottom:5px; text-align:center; width:250px;">Production Manager</div>
                            <div style="margin-top:5px;">Production Manager Signature</div>
                        </div>
                        <div>
                            <div style="border-bottom: 1px solid #000; width:150px; text-align:center; padding-bottom:5px; font-weight:bold;">
                                ${new Date().toLocaleDateString('en-GB')}
                            </div>
                            <div style="margin-top:5px;">Date</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
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
        }

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
                        if (paper) paper.innerHTML = data[0].report_html;
                        if (chk) chk.checked = data[0].is_approved;
                        if (rem) rem.value = data[0].supervisor_remarks || '';
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

        // Bind instant update events
        const chk = document.getElementById('preview-approval-check');
        if (chk) chk.addEventListener('change', updatePreview);
        const rem = document.getElementById('preview-approval-remarks');
        if (rem) rem.addEventListener('input', updatePreview);

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

                // Generate full print HTML with approval info & remarks
                let html = generateCompleteShiftPDF(isApproved, remarks);
                
                // If it was already loaded from Supabase and not modified, we might be overwriting it.
                // But generating a fresh one incorporates any recent changes made in the forms!
                // So always generating fresh on print is correct to capture latest changes.
                
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
                            else if (window.showToast) window.showToast('✓ Combined PDF Report saved to Supabase');
                        });
                    }
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
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFEvents);
    } else {
        initPDFEvents();
    }
})();
