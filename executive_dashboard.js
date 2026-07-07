// executive_dashboard.js

let execPelletAGaugeChart = null;
let execPelletBGaugeChart = null;

// Register custom needle plugin for Chart.js
const gaugeNeedlePlugin = {
    id: 'gaugeNeedle',
    afterDatasetDraw(chart, args, options) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
        ctx.save();
        
        const needleValue = data.datasets[0].needleValue || 0;
        const maxVal = data.datasets[0].data.reduce((a, b) => a + b, 0);
        
        // Calculate angle (between Math.PI and 2 * Math.PI)
        // needleValue = 0 -> PI, needleValue = maxVal -> 2PI
        let clampedValue = Math.max(0, Math.min(needleValue, maxVal));
        let angle = Math.PI + (clampedValue / maxVal * Math.PI);

        const cx = width / 2 + left;
        const cy = chart._metasets[0].data[0].y; // Get center Y from doughnut arc

        // Draw needle
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -5); // Top of needle base
        ctx.lineTo(height - 30, 0); // Tip of needle
        ctx.lineTo(0, 5); // Bottom of needle base
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        
        // Draw center dot
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
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

    if (execPelletAGaugeChart) execPelletAGaugeChart.destroy();
    if (execPelletBGaugeChart) execPelletBGaugeChart.destroy();

    execPelletAGaugeChart = new Chart(ctxA, gaugeConfig(0, 800));
    execPelletBGaugeChart = new Chart(ctxB, gaugeConfig(0, 1000)); // B target can be higher
}

function updateExecutiveDashboard() {
    // Get filter date or default to today
    const dateInput = document.getElementById('exec-filter-date');
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

    let monthlyAAvg = '--', monthlyBAvg = '--';
    if (monthlyATime > 0) monthlyAAvg = Math.round(monthlyAProd / monthlyATime) + ' Tons/Hr';
    if (monthlyBTime > 0) monthlyBAvg = Math.round(monthlyBProd / monthlyBTime) + ' Tons/Hr';

    document.getElementById('exec-pellet-a-value').textContent = aAvg;
    document.getElementById('exec-pellet-b-value').textContent = bAvg;
    
    const monthlyAEl = document.getElementById('exec-pellet-a-monthly');
    const monthlyBEl = document.getElementById('exec-pellet-b-monthly');
    if (monthlyAEl) monthlyAEl.textContent = monthlyAAvg;
    if (monthlyBEl) monthlyBEl.textContent = monthlyBAvg;
    
    if (execPelletAGaugeChart) {
        execPelletAGaugeChart.data.datasets[0].needleValue = aAvg;
        execPelletAGaugeChart.update();
    }
    if (execPelletBGaugeChart) {
        execPelletBGaugeChart.data.datasets[0].needleValue = bAvg;
        execPelletBGaugeChart.update();
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

    // 3. On Duty Officer
    let officer = '--';
    try {
        const shiftReports = JSON.parse(localStorage.getItem('fmpr_shiftReports') || '[]');
        if (shiftReports.length > 0) {
            officer = shiftReports[shiftReports.length - 1].officerName || 'Unknown';
        }
    } catch(e) {}
    document.getElementById('exec-duty-officer').textContent = officer;

    // 4. Maize Moisture Difference (From Daily Maize Logs)
    let diffStr = '--';
    let statusStr = '';
    try {
        const maizeLogs = JSON.parse(localStorage.getItem('fmpr_maizeLogs') || '[]');
        const targetLogs = maizeLogs.filter(r => parseDateToISO(r.date) === selectedDateStr);
        
        if (targetLogs.length > 0) {
            let totalDiff = 0;
            let count = 0;
            
            targetLogs.forEach(log => {
                const formM = parseFloat(log.formula_moisture);
                if (!isNaN(formM) && log.c_room_un_grind && log.c_room_un_grind.length > 0) {
                    const validReadings = log.c_room_un_grind.map(v => parseFloat(v)).filter(v => !isNaN(v));
                    if (validReadings.length > 0) {
                        const avgRoomM = validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length;
                        const diff = avgRoomM - formM;
                        totalDiff += diff;
                        count++;
                    }
                }
            });

            if (count > 0) {
                const avgDiff = totalDiff / count;
                diffStr = Math.abs(avgDiff).toFixed(2) + '%';
                
                if (avgDiff > 0) {
                    statusStr = '<span style="color:#ef4444;">(Excess ⬇)</span>'; // Higher consumed moisture
                } else if (avgDiff < 0) {
                    statusStr = '<span style="color:#10b981;">(Saving ⬆)</span>'; // Lower consumed moisture
                } else {
                    statusStr = '<span style="color:#94a3b8;">(Neutral)</span>';
                }
            }
        }
    } catch(e) {}
    
    document.getElementById('exec-moisture-diff').textContent = diffStr;
    document.getElementById('exec-moisture-diff-status').innerHTML = statusStr;
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
