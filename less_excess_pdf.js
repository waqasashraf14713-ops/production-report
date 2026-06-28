(function() {
    function generateLessExcessPDF() {
        const dateInput = document.getElementById('le-filter-date');
        const selectedDate = dateInput ? dateInput.value.trim() : '';

        if (!selectedDate) {
            alert('Please select a date first to generate the PDF.');
            return;
        }

        // Fetch logs for the selected date
        const allLogs = JSON.parse(localStorage.getItem('fmpr_lessExcessLogs') || '[]');
        
        // Calculate overall average dynamically forward
        const feedTotals = {};
        allLogs.forEach(log => {
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

        // Convert YYYY-MM-DD to d-MMM
        let formattedDate = selectedDate;
        const parts = selectedDate.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            const monthIndex = parseInt(parts[1], 10) - 1;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (monthIndex >= 0 && monthIndex < 12) {
                formattedDate = day + '-' + months[monthIndex];
            }
        }

        const leLogs = allLogs.filter(r => r.date === formattedDate);

        if (leLogs.length === 0) {
            alert('No Less/Excess logs found for the selected date: ' + formattedDate);
            return;
        }

        // Sort by shift (A, B, C)
        leLogs.sort((a, b) => (a.shift || '').localeCompare(b.shift || ''));

        let html = `
            <div class="pdf-report-header">
                <h1>Daily Less / Excess Report</h1>
                <p>Date: ${selectedDate}</p>
            </div>
        `;

        // Group by shift/officer
        const groups = {};
        leLogs.forEach(log => {
            const key = `${log.shift} - ${log.officerName}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });

        // Initialize overall totals
        let totalBatches = 0;
        let totalProdBags = 0;
        let totalExpectedBags = 0;

        Object.keys(groups).forEach(key => {
            const logs = groups[key];
            const [shift, officer] = key.split(' - ');
            
            html += `
                <div class="pdf-section">
                    <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">
                        Shift: ${shift} | Officer: ${officer}
                    </h3>
                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Shift</th>
                                <th>Officer Name</th>
                                <th>Feed Name</th>
                                <th>Batches</th>
                                <th>Prod. Bags</th>
                                <th>Difference</th>
                                <th>Percentage</th>
                                <th>Overall Avg Less/Excess</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let shiftExpected = 0;
            let shiftProd = 0;

            logs.forEach(log => {
                const expected = (log.batches || 0) * 100;
                const prod = log.productionBags || 0;
                const diff = prod - expected;
                const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                const pct = expected > 0 ? ((diff / expected) * 100).toFixed(2) + '%' : '0.00%';
                const pctStr = diff > 0 ? `+${pct}` : `${pct}`;
                
                shiftExpected += expected;
                shiftProd += prod;

                totalBatches += (log.batches || 0);
                totalProdBags += prod;
                totalExpectedBags += expected;

                html += `
                    <tr>
                        <td>${log.date || '-'}</td>
                        <td>${log.shift || '-'}</td>
                        <td>${log.officerName || '-'}</td>
                        <td>${log.feedName || '-'}</td>
                        <td>${log.batches || '0'}</td>
                        <td>${prod.toLocaleString()}</td>
                        <td style="font-weight:bold; color:${diff >= 0 ? '#15803d' : '#b91c1c'};">${diffStr}</td>
                        <td style="font-weight:bold; color:${diff >= 0 ? '#15803d' : '#b91c1c'};">${pctStr}</td>
                        <td style="font-weight:bold; color:${log._overallPct.startsWith('+') ? '#15803d' : log._overallPct.startsWith('-') ? '#b91c1c' : '#475569'};">${log._overallPct}</td>
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
                            <td>-</td>
                            <td>-</td>
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

        // Add Daily Overall Summary
        const overallDiff = totalProdBags - totalExpectedBags;
        const overallDiffStr = overallDiff > 0 ? `+${overallDiff}` : `${overallDiff}`;
        const overallPct = totalExpectedBags > 0 ? ((overallDiff / totalExpectedBags) * 100).toFixed(2) + '%' : '0.00%';
        const overallPctStr = overallDiff > 0 ? `+${overallPct}` : `${overallPct}`;

        html += `
            <div class="pdf-section" style="margin-top:20px; border:2px solid #000; padding:15px; background-color:#f8fafc; page-break-inside:avoid;">
                <h3 style="margin-top:0; border-bottom:1px solid #000; padding-bottom:8px; font-size:14px;">Daily Overall Summary (All Shifts Combined)</h3>
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                    <thead>
                        <tr style="background-color:#e5e7eb;">
                            <th style="padding:6px; border:1px solid #000; text-align:left;">Overall Batches</th>
                            <th style="padding:6px; border:1px solid #000; text-align:left;">Overall Production</th>
                            <th style="padding:6px; border:1px solid #000; text-align:left;">Overall Avg Less/Excess</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:6px; border:1px solid #000; font-size:14px; font-weight:bold;">${totalBatches}</td>
                            <td style="padding:6px; border:1px solid #000; font-size:14px; font-weight:bold;">${totalProdBags.toLocaleString()} Bags</td>
                            <td style="padding:6px; border:1px solid #000; font-size:14px; font-weight:bold; color:${overallDiff >= 0 ? '#15803d' : '#b91c1c'};">${overallPctStr} (${overallDiffStr} Bags)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        // Add Approval Block
        html += `
            <div class="pdf-approval-block" style="margin-top:40px; border:2px solid #000; padding:15px; page-break-inside:avoid;">
                <h3 style="margin-top:0; border-bottom:1px solid #000; padding-bottom:8px; font-size:14px;">Production Manager Approval</h3>
                <div style="margin-top:15px;">
                    <strong>Comments / Remarks:</strong>
                    <div style="border-bottom: 1px dotted #999; height: 25px; margin-top:8px;"></div>
                    <div style="border-bottom: 1px dotted #999; height: 25px;"></div>
                </div>
                <div class="signature-box" style="display:flex; justify-content:space-between; margin-top:30px;">
                    <div>
                        <div class="signature-line" style="border-bottom:1px solid #000; width:200px; margin-bottom:5px;"></div>
                        <div style="font-size:12px;">Production Manager Signature</div>
                    </div>
                    <div>
                        <div class="signature-line" style="border-bottom:1px solid #000; width:120px; margin-bottom:5px;"></div>
                        <div style="font-size:12px;">Date</div>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('less-excess-print-container');
        if (container) {
            container.innerHTML = html;
        }

        // Trigger print
        document.body.classList.add('printing-le-pdf');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-le-pdf');
            }, 1000);
        }, 300);
    }

    const initLEPDFEvents = () => {
        const btn = document.getElementById('btn-generate-le-pdf');
        if (btn) {
            btn.addEventListener('click', generateLessExcessPDF);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLEPDFEvents);
    } else {
        initLEPDFEvents();
    }
})();
