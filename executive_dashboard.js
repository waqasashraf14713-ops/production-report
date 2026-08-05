// executive_dashboard.js

let execPelletAGaugeChart = null;
let execPelletBGaugeChart = null;

// Register custom needle plugin for Chart.js
const gaugeNeedlePlugin = {
    id: 'gaugeNeedle',
    afterDatasetDraw(chart, args, options) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
        ctx.save();
        
        const needleValue = data.datasets[0].needleValue;
        const needleValues = Array.isArray(data.datasets[0].needleValues) ? data.datasets[0].needleValues : (needleValue !== undefined ? [{value: needleValue, color: '#0f172a'}] : []);
        const maxVal = data.datasets[0].data.reduce((a, b) => a + b, 0);
        
        const cx = width / 2 + left;
        const cy_meta = chart._metasets && chart._metasets[0] && chart._metasets[0].data && chart._metasets[0].data[0];
        if (!cy_meta) return;
        const cy = cy_meta.y; // Get center Y from doughnut arc
        
        const outerRadius = chart._metasets[0].data[0].outerRadius;
        const innerRadius = chart._metasets[0].data[0].innerRadius;

        // Draw scale divisions (text ticks)
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const tickValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
        const textRadius = innerRadius - 16; // Place text inside the arc
        
        tickValues.forEach(val => {
            if (val > maxVal) return;
            const tickAngle = Math.PI + (val / maxVal * Math.PI);
            const tx = cx + Math.cos(tickAngle) * textRadius;
            const ty = cy + Math.sin(tickAngle) * textRadius;
            ctx.fillText(val, tx, ty);
        });

        // Draw needles
        needleValues.forEach((needle, index) => {
            const val = typeof needle === 'object' ? needle.value : needle;
            const color = typeof needle === 'object' ? (needle.color || '#0f172a') : '#0f172a';
            const label = typeof needle === 'object' ? needle.label : '';

            let clampedValue = Math.max(0, Math.min(val, maxVal));
            let angle = Math.PI + (clampedValue / maxVal * Math.PI);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.beginPath();
            
            // Adjust needle shape for multiple needles to make them distinguishable
            const needleWidth = index === 0 ? 4 : 3;
            const needleLengthOffset = index === 0 ? 8 : 15;

            ctx.moveTo(0, -needleWidth); 
            ctx.lineTo(outerRadius - needleLengthOffset, 0); 
            ctx.lineTo(0, needleWidth); 
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw label at tip if provided
            if (label) {
                ctx.restore(); // restore to draw text unrotated
                ctx.save();
                const tipRadius = outerRadius - needleLengthOffset + 12;
                const tx = cx + Math.cos(angle) * tipRadius;
                const ty = cy + Math.sin(angle) * tipRadius;
                
                // Draw badge background
                ctx.fillStyle = color;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(tx - 10, ty - 8, 20, 16, 4);
                } else {
                    ctx.rect(tx - 10, ty - 8, 20, 16);
                }
                ctx.fill();

                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, tx, ty);
            } else {
                ctx.restore();
            }
        });
        
        // Draw center dot
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.restore();
    }
};

function initExecutiveGauges() {
    if (!document.getElementById('exec-pellet-a-gauge')) return;

    // Register plugin if not already registered globally
    Chart.register(gaugeNeedlePlugin);

    const gaugeConfig = (val, max) => ({
        type: 'doughnut',
        data: {
            labels: ['Low', 'Good', 'Excellent'],
            datasets: [{
                data: [max*0.5, max*0.3, max*0.2], // Thresholds
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                needleValue: val,
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            rotation: 270,
            circumference: 180,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });

    const ctxA = document.getElementById('exec-pellet-a-gauge').getContext('2d');
    const ctxB = document.getElementById('exec-pellet-b-gauge').getContext('2d');
    const ctxMonthly = document.getElementById('exec-monthly-avg-gauge') ? document.getElementById('exec-monthly-avg-gauge').getContext('2d') : null;

    if (execPelletAGaugeChart) execPelletAGaugeChart.destroy();
    if (execPelletBGaugeChart) execPelletBGaugeChart.destroy();
    if (window.execMonthlyAvgGaugeChart) window.execMonthlyAvgGaugeChart.destroy();

    execPelletAGaugeChart = new Chart(ctxA, gaugeConfig(0, 110));
    execPelletBGaugeChart = new Chart(ctxB, gaugeConfig(0, 110));
    if (ctxMonthly) {
        window.execMonthlyAvgGaugeChart = new Chart(ctxMonthly, gaugeConfig(0, 110));
    }
}

function updateExecutiveDashboard() {
    // Get filter date or default to today
    const dateInput = document.getElementById('exec-filter-date');
    if (!dateInput) return;
    if (!dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
    const selectedDateStr = dateInput.value; // YYYY-MM-DD
    const selectedMonthStr = selectedDateStr.substring(0, 7); // YYYY-MM

    // Helper to parse dates like DD-MMM or YYYY-MM-DD into YYYY-MM-DD
    const parseDateToISO = (dateStr) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            let year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            let month = months[parts[1]] || '01';
            let day = parts[0].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    }

    let pelletReports = [];
    try {
        pelletReports = JSON.parse(localStorage.getItem('fm_pellet_efficiency') || '[]');
    } catch(e) {}
    
    // 1. Pellet Averages (Daily and Monthly)
    let dailyAProd = 0, dailyATime = 0, dailyBProd = 0, dailyBTime = 0;
    let monthlyAProd = 0, monthlyATime = 0, monthlyBProd = 0, monthlyBTime = 0;

    let targetDailyReport = null;

    pelletReports.forEach(report => {
        const isoDate = parseDateToISO(report.date);
        const isDaily = isoDate === selectedDateStr;
        const isMonthly = isoDate.startsWith(selectedMonthStr);
        
        if (isDaily) targetDailyReport = report;

        report.rows.forEach(r => {
            const prod = parseFloat(r.production) || 0;
            const time = parseFloat(r.runTime) || 0;
            
            if (r.mill === 'A Pellet') {
                if (isDaily) { dailyAProd += prod; dailyATime += time; }
                if (isMonthly) { monthlyAProd += prod; monthlyATime += time; }
            } else if (r.mill === 'B Pellet') {
                if (isDaily) { dailyBProd += prod; dailyBTime += time; }
                if (isMonthly) { monthlyBProd += prod; monthlyBTime += time; }
            }
        });
    });

    let aAvg = 0, bAvg = 0;
    if (dailyATime > 0) aAvg = Math.round(dailyAProd / dailyATime);
    if (dailyBTime > 0) bAvg = Math.round(dailyBProd / dailyBTime);

    let aEff = 0, bEff = 0;
    if (aAvg > 0) aEff = Math.round((aAvg / 600) * 100);
    if (bAvg > 0) bEff = Math.round((bAvg / 800) * 100);

    let monthlyAEff = '--', monthlyBEff = '--';
    let monthlyAAvg = '--', monthlyBAvg = '--';
    if (monthlyATime > 0) {
        monthlyAAvg = Math.round(monthlyAProd / monthlyATime);
        monthlyAEff = Math.round((monthlyAAvg / 600) * 100) + '%';
    }
    if (monthlyBTime > 0) {
        monthlyBAvg = Math.round(monthlyBProd / monthlyBTime);
        monthlyBEff = Math.round((monthlyBAvg / 800) * 100) + '%';
    }

    document.getElementById('exec-pellet-a-value').textContent = aEff > 0 ? (aEff + '%') : '--';
    document.getElementById('exec-pellet-b-value').textContent = bEff > 0 ? (bEff + '%') : '--';
    
    // Set Daily Averages
    const aAvgEl = document.getElementById('exec-pellet-a-avg-val');
    const bAvgEl = document.getElementById('exec-pellet-b-avg-val');
    if (aAvgEl) aAvgEl.textContent = aAvg > 0 ? (aAvg + ' Tons/Hr') : '-- Tons/Hr';
    if (bAvgEl) bAvgEl.textContent = bAvg > 0 ? (bAvg + ' Tons/Hr') : '-- Tons/Hr';

    // Set Monthly Efficiencies
    const monthlyAEl = document.getElementById('exec-pellet-a-monthly');
    const monthlyBEl = document.getElementById('exec-pellet-b-monthly');
    if (monthlyAEl) monthlyAEl.textContent = monthlyAEff;
    if (monthlyBEl) monthlyBEl.textContent = monthlyBEff;
    
    if (execPelletAGaugeChart) {
        execPelletAGaugeChart.data.datasets[0].needleValue = aEff > 0 ? aEff : 0;
        execPelletAGaugeChart.update();
    }
    if (execPelletBGaugeChart) {
        execPelletBGaugeChart.data.datasets[0].needleValue = bEff > 0 ? bEff : 0;
        execPelletBGaugeChart.update();
    }
    
    if (window.execMonthlyAvgGaugeChart) {
        window.execMonthlyAvgGaugeChart.data.datasets[0].needleValues = [
            { value: parseFloat(monthlyAEff) || 0, color: '#3b82f6', label: 'A' },
            { value: parseFloat(monthlyBEff) || 0, color: '#10b981', label: 'B' }
        ];
        window.execMonthlyAvgGaugeChart.update();
    }

    // 2. Unit Per Bag
    // Mock logic: Use the target daily report if exists, else fallback
    let unitPerBag = '--';
    if (targetDailyReport) {
        let totalProd = 0;
        let totalRuntime = 0;
        targetDailyReport.rows.forEach(r => {
            totalProd += parseFloat(r.production) || 0;
            totalRuntime += parseFloat(r.runTime) || 0;
        });
        if (totalProd > 0) {
            unitPerBag = ((totalRuntime * 250) / totalProd).toFixed(2);
        }
    } else if (pelletReports.length > 0) {
        // Fallback to latest
        const latest = pelletReports[pelletReports.length - 1];
        let totalProd = 0;
        let totalRuntime = 0;
        latest.rows.forEach(r => {
            totalProd += parseFloat(r.production) || 0;
            totalRuntime += parseFloat(r.runTime) || 0;
        });
        if (totalProd > 0) {
            unitPerBag = ((totalRuntime * 250) / totalProd).toFixed(2);
        }
    }

    document.getElementById('exec-unit-per-bag').textContent = unitPerBag;

    // 3. On Duty Officer (Dynamic by time)
    let officer = window.getDefaultOfficer ? window.getDefaultOfficer(true) : '--';
    document.getElementById('exec-duty-officer').textContent = officer;

    // 4. Maize Moisture Difference (From Daily Maize Logs)
    let diffStr = '--';
    let statusStr = '';
    try {
        const siloMoistDataAll = JSON.parse(localStorage.getItem('fm_silo_moisture') || '[]');
        const targetMoistData = siloMoistDataAll.filter(r => {
            let rd = r.date;
            try {
                const parts = r.date.split('-');
                if(parts.length===3) {
                    const mName = parts[1];
                    const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
                    rd = `${parts[2]}-${months[mName]}-${parts[0].padStart(2,'0')}`;
                }
            } catch(e){}
            return rd === selectedDateStr || r.date === document.getElementById('exec-filter-date').value;
        });

        let sum = 0, count = 0;
        targetMoistData.forEach(r => {
            (r.rows || []).forEach(row => {
                const mat = (row.material || '').trim().toLowerCase();
                if (mat !== 'maize') return;
                const m = parseFloat(row.ctrlMoisture);
                if (!isNaN(m)) { sum += m; count++; }
            });
        });

        if (count > 0) {
            const avg = sum / count;
            const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
            // Try to match by the exact string format used in the filter
            const filterStr = document.getElementById('exec-filter-date').value;
            // Also try formatting to dd-MMM-yyyy as saved by silo moisture
            const parts = filterStr.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dateFmt = parts.length === 3 ? `${parseInt(parts[2])}-${months[parseInt(parts[1]) - 1]}-${parts[0]}` : filterStr;
            
            let formulaVal = formulas[dateFmt] !== undefined ? formulas[dateFmt] : formulas[filterStr];
            
            if (formulaVal === undefined) {
                const globalVal = localStorage.getItem('fm_global_formula_moisture');
                if (globalVal !== null && globalVal !== '') {
                    formulaVal = parseFloat(globalVal);
                }
            }

            if (formulaVal !== undefined) {
                const diff = avg - formulaVal;
                diffStr = Math.abs(diff).toFixed(2) + '%';
                
                if (diff > 0) {
                    statusStr = '<span style="color:#ef4444;">(Out of Range ⬇)</span>'; 
                } else if (diff < 0) {
                    statusStr = '<span style="color:#10b981;">(Match / Saving ⬆)</span>';
                } else {
                    statusStr = '<span style="color:#10b981;">(Match)</span>';
                }
                
                // Add sign if requested:
                diffStr = (diff > 0 ? '+' : (diff < 0 ? '-' : '')) + diffStr;
            } else {
                diffStr = 'Formula N/A';
            }
        } else {
            diffStr = 'No Data';
        }
    } catch(e) {
        console.error("Moisture diff error:", e);
    }
    
    document.getElementById('exec-moisture-diff').textContent = diffStr;
    document.getElementById('exec-moisture-diff-status').innerHTML = statusStr;

    // 5. Total Batches (From Less/Excess Logs)
    let totalBatches = '--';
    let lastUpdatedStr = '';
    try {
        const lessExcessLogs = JSON.parse(localStorage.getItem('fmpr_lessExcessLogs') || '[]');
        const targetReports = lessExcessLogs.filter(r => {
            return parseDateToISO(r.date) === selectedDateStr || r.date === selectedDateStr;
        });
        
        if (targetReports.length > 0) {
            totalBatches = targetReports.reduce((sum, r) => sum + (parseFloat(r.batches) || 0), 0);
            
            // Try to extract latest time from IDs (which are usually Date.now() timestamps)
            const validIds = targetReports.map(r => parseInt(r.id)).filter(id => !isNaN(id) && id > 1000000000000);
            if (validIds.length > 0) {
                const latestId = Math.max(...validIds);
                lastUpdatedStr = 'Updated: ' + new Date(latestId).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
                lastUpdatedStr = 'Updated: ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        }
    } catch(e) {}
    
    const batchesEl = document.getElementById('exec-total-batches');
    const batchesTimeEl = document.getElementById('exec-total-batches-time');
    if (batchesEl) batchesEl.textContent = totalBatches;
    if (batchesTimeEl) batchesTimeEl.textContent = lastUpdatedStr;
}

// Hook into navigation clicks
document.addEventListener('DOMContentLoaded', () => {
    initExecutiveGauges();
    updateExecutiveDashboard();

    // Auto update when clicking on the nav item
    const navBtn = document.getElementById('nav-executive-dashboard');
    if (navBtn) {
        navBtn.addEventListener('click', () => {
            setTimeout(updateExecutiveDashboard, 100);
        });
    }

    // Auto update when date is changed
    const dateInput = document.getElementById('exec-filter-date');
    if (dateInput) {
        flatpickr(dateInput, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            defaultDate: "today",
            onChange: function() {
                updateExecutiveDashboard();
            }
        });
    }
});

let execDailyTrendChart = null;
let execMonthlyTrendChart = null;

function initExecutiveTrendCharts() {
    const dailyCtx = document.getElementById('exec-daily-trend-chart');
    const monthlyCtx = document.getElementById('exec-monthly-trend-chart');
    if (!dailyCtx || !monthlyCtx) return;

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Tons/Hr' } }
        }
    };

    if (execDailyTrendChart) execDailyTrendChart.destroy();
    execDailyTrendChart = new Chart(dailyCtx.getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: false } } }
    });

    if (execMonthlyTrendChart) execMonthlyTrendChart.destroy();
    execMonthlyTrendChart = new Chart(monthlyCtx.getContext('2d'), {
        type: 'bar', // Using bar chart for monthly trend
        data: { labels: [], datasets: [] },
        options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: false } } }
    });
}

// Call init for trend charts in DOMContentLoaded hook
document.addEventListener('DOMContentLoaded', () => {
    initExecutiveTrendCharts();
});

// We need to inject the trend chart update at the end of updateExecutiveDashboard
const originalUpdateExec = updateExecutiveDashboard;
window.updateExecutiveDashboard = function() {
    // 1. Call original metrics logic
    originalUpdateExec();

    // 2. Fetch data again for trend charts
    const dateInput = document.getElementById('exec-filter-date');
    const selectedDateStr = dateInput.value; // YYYY-MM-DD
    if(!selectedDateStr) return;

    const selectedYearStr = selectedDateStr.substring(0, 4);
    const selectedMonthStr = selectedDateStr.substring(0, 7);

    // Helper
    const parseDateToISO = (dateStr) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            let year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            let month = months[parts[1]] || '01';
            let day = parts[0].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    }

    let pelletReports = [];
    try { pelletReports = JSON.parse(localStorage.getItem('fm_pellet_efficiency') || '[]'); } catch(e) {}

    // Accumulators
    let dailyA = {}, dailyB = {};
    let monthlyA = {}, monthlyB = {};

    pelletReports.forEach(report => {
        const iso = parseDateToISO(report.date);
        if(!iso) return;
        const mm = iso.substring(0, 7);
        const yy = iso.substring(0, 4);

        if (!dailyA[iso]) dailyA[iso] = { p: 0, t: 0 };
        if (!dailyB[iso]) dailyB[iso] = { p: 0, t: 0 };
        if (!monthlyA[mm]) monthlyA[mm] = { p: 0, t: 0 };
        if (!monthlyB[mm]) monthlyB[mm] = { p: 0, t: 0 };

        report.rows.forEach(r => {
            const prod = parseFloat(r.production) || 0;
            const time = parseFloat(r.runTime) || 0;
            if (r.mill === 'A Pellet') {
                if (mm === selectedMonthStr) { dailyA[iso].p += prod; dailyA[iso].t += time; }
                if (yy === selectedYearStr) { monthlyA[mm].p += prod; monthlyA[mm].t += time; }
            } else if (r.mill === 'B Pellet') {
                if (mm === selectedMonthStr) { dailyB[iso].p += prod; dailyB[iso].t += time; }
                if (yy === selectedYearStr) { monthlyB[mm].p += prod; monthlyB[mm].t += time; }
            }
        });
    });

    // Build Daily Chart Data (Sort days of the selected month)
    const dailyKeys = Object.keys(dailyA).filter(k => k.startsWith(selectedMonthStr)).sort();
    const dLabels = [], dAData = [], dBData = [];
    dailyKeys.forEach(k => {
        dLabels.push(k.substring(8)); // just the day '01', '02'
        const aAvg = dailyA[k].t > 0 ? Math.round(dailyA[k].p / dailyA[k].t) : 0;
        const bAvg = dailyB[k].t > 0 ? Math.round(dailyB[k].p / dailyB[k].t) : 0;
        dAData.push(aAvg);
        dBData.push(bAvg);
    });

    if (execDailyTrendChart) {
        execDailyTrendChart.data.labels = dLabels;
        execDailyTrendChart.data.datasets = [
            { label: 'A Pellet', data: dAData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
            { label: 'B Pellet', data: dBData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 }
        ];
        execDailyTrendChart.update();
    }

    // Build Monthly Chart Data (Sort months of the selected year)
    const monthlyKeys = Object.keys(monthlyA).filter(k => k.startsWith(selectedYearStr)).sort();
    const mLabels = [], mAData = [], mBData = [];
    const monthNames = { '01':'Jan', '02':'Feb', '03':'Mar', '04':'Apr', '05':'May', '06':'Jun', '07':'Jul', '08':'Aug', '09':'Sep', '10':'Oct', '11':'Nov', '12':'Dec' };
    
    monthlyKeys.forEach(k => {
        const mPart = k.substring(5, 7);
        mLabels.push(monthNames[mPart] || mPart);
        const aAvg = monthlyA[k].t > 0 ? Math.round(monthlyA[k].p / monthlyA[k].t) : 0;
        const bAvg = monthlyB[k].t > 0 ? Math.round(monthlyB[k].p / monthlyB[k].t) : 0;
        mAData.push(aAvg);
        mBData.push(bAvg);
    });

    if (execMonthlyTrendChart) {
        execMonthlyTrendChart.data.labels = mLabels;
        execMonthlyTrendChart.data.datasets = [
            { label: 'A Pellet', data: mAData, backgroundColor: '#3b82f6', borderRadius: 4 },
            { label: 'B Pellet', data: mBData, backgroundColor: '#10b981', borderRadius: 4 }
        ];
        execMonthlyTrendChart.update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#exec-filter-date", {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            onChange: function(selectedDates, dateStr, instance) {
                if(typeof updateExecutiveDashboard === 'function') {
                    updateExecutiveDashboard();
                }
            }
        });
    }
});
