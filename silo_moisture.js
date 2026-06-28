// ─── Silo Moisture Report Module ────────────────────────────────────────────
(() => {
    const LS_SILO_MOISTURE = 'fm_silo_moisture';
    let siloMoistData = JSON.parse(localStorage.getItem(LS_SILO_MOISTURE) || '[]');
    let activeMoistReportId = null;

    const inp = (id, w = '100%') => `<input type="text" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;">`;
    const num = (id, w = '100%') => `<input type="number" step="any" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;">`;
    const btn = (icon, color) => `<button class="btn" style="background:transparent;color:${color};font-size:1.2rem;padding:0;box-shadow:none;">${icon}</button>`;
    
    const getSiloOptionList = () => {
        const list = [];
        for (let i = 1; i <= 8; i++) list.push(`Silo ${i.toString().padStart(2, '0')}`);
        for (let i = 9; i <= 12; i++) list.push(`Silo ${i.toString().padStart(2, '0')}`);
        for (let i = 1; i <= 3; i++) list.push(`Wet Bin ${i.toString().padStart(2, '0')}`);
        for (let i = 1; i <= 2; i++) list.push(`Cooling Bin ${i.toString().padStart(2, '0')}`);
        for (let i = 13; i <= 16; i++) list.push(`Silo ${i.toString().padStart(2, '0')}`);
        return list;
    };
    
    const siloSel = (id) => `<select id="${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">
        <option value="">Select Silo</option>
        ${getSiloOptionList().map(name => `<option value="${name}">${name}</option>`).join('')}
    </select>`;

    const matInp = (id) => `
        <input type="text" id="${id}" list="mat-options-${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;" placeholder="Select or type">
        <datalist id="mat-options-${id}">
            <option value="Maize">
            <option value="Rice">
        </datalist>
    `;

    const saveSiloMoistData = () => {
        localStorage.setItem(LS_SILO_MOISTURE, JSON.stringify(siloMoistData));
    };

    const renderSiloMoistTable = () => {
        const tbody = document.querySelector('#silo-moist-table tbody');
        if (!tbody) return;

        if (siloMoistData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-secondary);">No Silo Moisture Reports yet. Click "Add Report" to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        [...siloMoistData].reverse().forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.date}</td>
                <td><span class="sr-shift-badge ${r.shift === 'Morning' ? 'shift-a' : r.shift === 'Evening' ? 'shift-b' : 'shift-c'}">${r.shift}</span></td>
                <td>👷 ${r.officerName}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editSiloMoist(${r.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteSiloMoist(${r.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Try to trigger global update for shift cards if available
        if (typeof window.renderShiftReports === 'function') {
            window.renderShiftReports();
        }
    };

    window.editSiloMoist = (id) => {
        const r = siloMoistData.find(x => x.id === id);
        if (!r) return;
        activeMoistReportId = id;
        
        document.getElementById('sm-date').value = r.date || '';
        document.getElementById('sm-shift').value = r.shift || 'Morning';
        document.getElementById('sm-officer').value = r.officerName || '';

        const tbody = document.getElementById('sm-rows-tbody');
        tbody.innerHTML = '';
        if (r.rows && r.rows.length > 0) {
            r.rows.forEach(row => addSmRowUI(row));
        } else {
            addSmRowUI();
        }

        document.getElementById('silo-moist-modal').classList.add('show');
    };

    window.deleteSiloMoist = (id) => {
        if (!confirm('Delete this Silo Moisture report?')) return;
        siloMoistData = siloMoistData.filter(x => x.id !== id);
        saveSiloMoistData();
        renderSiloMoistTable();
    };

    const addSmRowUI = (data = {}) => {
        const tbody = document.getElementById('sm-rows-tbody');
        const tr = document.createElement('tr');
        tr.className = 'sm-row';
        
        const rId = Math.random().toString(36).substr(2, 9);
        tr.dataset.rid = rId;

        tr.innerHTML = `
            <td>${siloSel(`sm-silo-${rId}`)}</td>
            <td>${matInp(`sm-mat-${rId}`)}</td>
            <td>${num(`sm-moist-${rId}`)}</td>
            <td>${inp(`sm-rem-${rId}`)}</td>
            <td><div style="cursor:pointer;" onclick="this.closest('tr').remove()">${btn('🗑️', 'var(--danger-color)')}</div></td>
        `;
        tbody.appendChild(tr);

        if (data.silo) document.getElementById(`sm-silo-${rId}`).value = data.silo;
        if (data.material) document.getElementById(`sm-mat-${rId}`).value = data.material;
        if (data.moisture) document.getElementById(`sm-moist-${rId}`).value = data.moisture;
        if (data.remarks) document.getElementById(`sm-rem-${rId}`).value = data.remarks;
    };

    const openSmModal = () => {
        activeMoistReportId = null;
        
        const filterDateInput = document.getElementById('sr-filter-date');
        const filterDate = filterDateInput && filterDateInput.value ? filterDateInput.value : '';
        document.getElementById('sm-date').value = filterDate;
        
        document.getElementById('sm-shift').value = 'Morning';
        document.getElementById('sm-officer').value = '';

        const tbody = document.getElementById('sm-rows-tbody');
        tbody.innerHTML = '';
        addSmRowUI();

        document.getElementById('silo-moist-modal').classList.add('show');
    };

    const closeSmModal = () => {
        document.getElementById('silo-moist-modal').classList.remove('show');
    };

    const saveSmModal = () => {
        const date = document.getElementById('sm-date').value.trim();
        if (!date) return alert('Date is required!');

        const shift = document.getElementById('sm-shift').value;
        const officerName = document.getElementById('sm-officer').value;

        const rows = [];
        document.querySelectorAll('#sm-rows-tbody .sm-row').forEach(tr => {
            const rId = tr.dataset.rid;
            const silo = document.getElementById(`sm-silo-${rId}`).value.trim();
            const material = document.getElementById(`sm-mat-${rId}`).value.trim();
            const moisture = document.getElementById(`sm-moist-${rId}`).value.trim();
            const remarks = document.getElementById(`sm-rem-${rId}`).value.trim();
            
            if (silo || material || moisture) {
                rows.push({ silo, material, moisture, remarks });
            }
        });

        const report = {
            id: activeMoistReportId || Date.now(),
            date,
            shift,
            officerName,
            rows
        };

        if (activeMoistReportId) {
            const idx = siloMoistData.findIndex(x => x.id === activeMoistReportId);
            if (idx !== -1) siloMoistData[idx] = report;
        } else {
            siloMoistData.push(report);
        }

        saveSiloMoistData();
        renderSiloMoistTable();
        closeSmModal();
        if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();

        // Update summary if the added report matches current filter
        const filterDateInput = document.getElementById('sr-filter-date');
        if (filterDateInput && filterDateInput.value) {
            window.updateDailySiloMoistureSummary(filterDateInput.value);
        }
    };

    const initSmEvents = () => {
        const btnAddTop = document.getElementById('btn-add-silo-moist');
        if (btnAddTop) btnAddTop.addEventListener('click', openSmModal);

        const btnAddRow = document.getElementById('btn-add-sm-row');
        if (btnAddRow) btnAddRow.addEventListener('click', () => addSmRowUI());

        const btnSave = document.getElementById('btn-save-sm');
        if (btnSave) btnSave.addEventListener('click', saveSmModal);

        const btnCancel = document.getElementById('btn-cancel-sm');
        if (btnCancel) btnCancel.addEventListener('click', closeSmModal);

        const btnClose1 = document.getElementById('silo-moist-close');
        if (btnClose1) btnClose1.addEventListener('click', closeSmModal);

        const btnSaveFormula = document.getElementById('btn-save-dsms-formula');
        if (btnSaveFormula) {
            btnSaveFormula.addEventListener('click', () => {
                const date = document.getElementById('sr-filter-date').value;
                if (!date) return alert('Please select a date first!');
                const val = document.getElementById('dsms-formula').value;
                if (!val) return alert('Enter a formula moisture value!');
                
                const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
                formulas[date] = parseFloat(val);
                localStorage.setItem('fm_daily_formula_moisture', JSON.stringify(formulas));
                
                window.updateDailySiloMoistureSummary(date);
            });
        }

        renderSiloMoistTable();
    };

    window.updateDailySiloMoistureSummary = (date) => {
        if (!date) return;
        const actualEl = document.getElementById('dsms-actual');
        const countEl = document.getElementById('dsms-count');
        const formulaInp = document.getElementById('dsms-formula');
        const compEl = document.getElementById('dsms-comparison');
        if (!actualEl) return;

        // Load formula if exists
        const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');
        const formulaVal = formulas[date];
        if (formulaVal !== undefined) {
            formulaInp.value = formulaVal;
        } else {
            formulaInp.value = '';
        }

        // Calculate average for the day
        let sum = 0;
        let count = 0;
        siloMoistData.filter(r => r.date === date).forEach(report => {
            if (report.rows) {
                report.rows.forEach(row => {
                    const m = parseFloat(row.moisture);
                    if (!isNaN(m)) {
                        sum += m;
                        count++;
                    }
                });
            }
        });

        if (count === 0) {
            actualEl.innerText = '-- %';
            countEl.innerText = 'Based on 0 readings';
            compEl.innerText = 'No data to compare';
            compEl.style.color = 'var(--text-secondary)';
            renderDifferenceGauge(null);
            return;
        }

        const avg = (sum / count).toFixed(2);
        actualEl.innerText = `${avg} %`;
        countEl.innerText = `Based on ${count} reading${count > 1 ? 's' : ''}`;

        const alarmEl = document.getElementById('dsms-alarm');
        if (formulaVal !== undefined) {
            const diff = parseFloat((avg - formulaVal).toFixed(2));
            const absDiff = Math.abs(diff);
            const sign = diff > 0 ? '+' : '';

            if (absDiff === 0) {
                compEl.innerHTML = `<span style="color:var(--success-color);">&#10003; Match (0.00%)</span>`;
                if (alarmEl) { alarmEl.style.display = 'none'; }
            } else if (absDiff <= 2) {
                const col = diff > 0 ? '#f59e0b' : '#3b82f6';
                compEl.innerHTML = `<span style="color:${col};">${sign}${diff}% (${diff > 0 ? 'Higher' : 'Lower'})</span>`;
                if (alarmEl) { alarmEl.style.display = 'none'; }
            } else {
                compEl.innerHTML = `<span style="color:#ef4444;font-weight:700;">&#9888; ${sign}${diff}% &mdash; Out of Range!</span>`;
                if (alarmEl) { alarmEl.style.display = 'flex'; alarmEl.textContent = `&#9888; ALERT: Difference ${sign}${diff}% exceeds \u00b12% limit!`; alarmEl.innerHTML = `&#9888;&#xFE0F; ALERT: Difference ${sign}${diff}% exceeds &#177;2% limit!`; }
            }
            // Update the gauge
            renderDifferenceGauge(diff);
        } else {
            compEl.innerText = 'Enter formula moisture to compare';
            compEl.style.color = 'var(--text-secondary)';
            if (alarmEl) { alarmEl.style.display = 'none'; }
            renderDifferenceGauge(null);
        }

        // Also refresh the trend chart
        window.renderSiloMoistureTrendChart();
    };

    // ── Trend Chart ────────────────────────────────────────────────────────────
    let trendChartInstance = null;
    let fullChartInstance = null;

    const buildChartData = (limitDays) => {
        const formulas = JSON.parse(localStorage.getItem('fm_daily_formula_moisture') || '{}');

        // Gather all dates that have silo moisture records
        const allDates = [...new Set(siloMoistData.map(r => r.date))].sort();
        const workDates = limitDays ? allDates.slice(-limitDays) : allDates;

        const labels = [];
        const diffValues = [];
        const actualValues = [];
        const formulaValues = [];

        workDates.forEach(date => {
            let sum = 0, count = 0;
            siloMoistData.filter(r => r.date === date).forEach(report => {
                (report.rows || []).forEach(row => {
                    const m = parseFloat(row.moisture);
                    if (!isNaN(m)) { sum += m; count++; }
                });
            });
            if (count === 0) return;
            const avg = parseFloat((sum / count).toFixed(2));
            const formula = formulas[date];
            labels.push(date);
            actualValues.push(avg);
            formulaValues.push(formula !== undefined ? parseFloat(formula) : null);
            diffValues.push(formula !== undefined ? parseFloat((avg - formula).toFixed(2)) : null);
        });

        return { labels, diffValues, actualValues, formulaValues };
    };

    const makeChartConfig = (data, allDates) => ({
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Difference % (Actual - Formula)',
                    data: data.diffValues,
                    borderColor: '#6366f1',
                    backgroundColor: (ctx) => {
                        const chart = ctx.chart;
                        const {ctx: c, chartArea} = chart;
                        if (!chartArea) return 'transparent';
                        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(99,102,241,0.25)');
                        gradient.addColorStop(1, 'rgba(99,102,241,0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: (ctx) => {
                        const v = data.diffValues[ctx.dataIndex];
                        if (v === null) return '#888';
                        if (Math.abs(v) > 2) return '#ef4444';   // red - out of range
                        if (v > 0) return '#f59e0b';              // amber - high but ok
                        if (v < 0) return '#3b82f6';              // blue - low but ok
                        return '#22c55e';                          // green - match
                    },
                    pointStyle: (ctx) => {
                        const v = data.diffValues[ctx.dataIndex];
                        return (v !== null && Math.abs(v) > 2) ? 'rectRot' : 'circle';
                    },
                    pointRadius: (ctx) => {
                        const v = data.diffValues[ctx.dataIndex];
                        return (v !== null && Math.abs(v) > 2) ? 8 : 5;
                    },
                    pointBorderWidth: 2,
                    borderWidth: 2,
                    spanGaps: false,
                    yAxisID: 'yDiff',
                },
                {
                    label: 'Actual Avg %',
                    data: data.actualValues,
                    borderColor: '#f59e0b',
                    borderDash: [4, 3],
                    pointRadius: 3,
                    tension: 0.3,
                    borderWidth: 1.5,
                    fill: false,
                    yAxisID: 'yMoist',
                },
                {
                    label: 'Formula %',
                    data: data.formulaValues,
                    borderColor: '#22c55e',
                    borderDash: [6, 3],
                    pointRadius: 3,
                    tension: 0.3,
                    borderWidth: 1.5,
                    fill: false,
                    yAxisID: 'yMoist',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { font: { size: 11 }, padding: 12 } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.raw;
                            if (v === null) return `${ctx.dataset.label}: N/A`;
                            if (ctx.dataset.label.startsWith('Difference')) {
                                const sign = v > 0 ? '+' : '';
                                return `Difference: ${sign}${v}%`;
                            }
                            return `${ctx.dataset.label}: ${v}%`;
                        }
                    }
                },
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x',
                    },
                    limits: { x: { minRange: 3 } }
                },
                annotation: {
                    annotations: {
                        upperLimit: {
                            type: 'line',
                            yScaleID: 'yDiff',
                            yMin: 2, yMax: 2,
                            borderColor: 'rgba(239,68,68,0.7)',
                            borderWidth: 1.5,
                            borderDash: [6, 4],
                            label: { content: '+2% Limit', display: true, position: 'end', font: { size: 9 }, color: '#ef4444', backgroundColor: 'transparent' }
                        },
                        lowerLimit: {
                            type: 'line',
                            yScaleID: 'yDiff',
                            yMin: -2, yMax: -2,
                            borderColor: 'rgba(239,68,68,0.7)',
                            borderWidth: 1.5,
                            borderDash: [6, 4],
                            label: { content: '-2% Limit', display: true, position: 'end', font: { size: 9 }, color: '#ef4444', backgroundColor: 'transparent' }
                        },
                        zeroLine: {
                            type: 'line',
                            yScaleID: 'yDiff',
                            yMin: 0, yMax: 0,
                            borderColor: 'rgba(34,197,94,0.5)',
                            borderWidth: 1,
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { maxRotation: 45, font: { size: 10 } },
                    grid: { color: 'rgba(128,128,128,0.15)' },
                    min: allDates ? data.labels[Math.max(0, data.labels.length - 7)] : undefined,
                },
                yDiff: {
                    position: 'left',
                    title: { display: true, text: 'Diff %', font: { size: 10 } },
                    grid: { color: 'rgba(128,128,128,0.15)' },
                    afterDataLimits: (scale) => {
                        const abs = Math.max(Math.abs(scale.min), Math.abs(scale.max), 0.5);
                        scale.min = -abs - 0.2;
                        scale.max = abs + 0.2;
                    }
                },
                yMoist: {
                    position: 'right',
                    title: { display: true, text: 'Moisture %', font: { size: 10 } },
                    grid: { drawOnChartArea: false },
                }
            }
        }
    });

    window.renderSiloMoistureTrendChart = () => {
        const canvas = document.getElementById('silo-moist-trend-chart');
        if (!canvas) return;

        const data = buildChartData(null); // all data, chart will show last 7 by default via x min

        if (trendChartInstance) {
            trendChartInstance.data = makeChartConfig(data, true).data;
            trendChartInstance.options = makeChartConfig(data, true).options;
            trendChartInstance.update();
        } else {
            if (typeof Chart === 'undefined') return;
            trendChartInstance = new Chart(canvas, makeChartConfig(data, true));
        }
    };

    const openFullscreenChart = () => {
        document.getElementById('chart-fullscreen-modal').style.display = 'flex';
        const canvas = document.getElementById('silo-moist-trend-chart-full');
        if (!canvas) return;
        const data = buildChartData(null);
        if (fullChartInstance) fullChartInstance.destroy();
        const cfg = makeChartConfig(data, false);
        // Show all dates in fullscreen - remove min
        cfg.options.scales.x.min = undefined;
        fullChartInstance = new Chart(canvas, cfg);
    };

    const closeFullscreenChart = () => {
        document.getElementById('chart-fullscreen-modal').style.display = 'none';
        if (fullChartInstance) { fullChartInstance.destroy(); fullChartInstance = null; }
    };

    // ── Gauge ──────────────────────────────────────────────────────────────────
    let gaugeAnimId = null;
    let gaugeCurrentAngle = 0; // tracks the animated needle position (in radians)

    const renderDifferenceGauge = (diffValue) => {
        const card = document.getElementById('dsms-gauge-card');
        const canvas = document.getElementById('dsms-gauge-canvas');
        const label = document.getElementById('dsms-gauge-label');
        if (!card || !canvas || !label) return;

        if (diffValue === null || diffValue === undefined) {
            card.style.display = 'none';
            return;
        }
        card.style.display = 'block';

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H - 20; // needle pivot near bottom
        const R = Math.min(cx, cy) - 10; // arc radius

        // Gauge range: -5 to +5 %, mapped to 180° arc (π rad left to 0 rad right)
        const MIN_VAL = -5;
        const MAX_VAL = 5;
        const clamped = Math.max(MIN_VAL, Math.min(MAX_VAL, diffValue));

        // Map value → angle: -5→π (left), 0→π/2 (top), +5→0 (right)
        const targetAngle = Math.PI - ((clamped - MIN_VAL) / (MAX_VAL - MIN_VAL)) * Math.PI;

        // Cancel any running animation
        if (gaugeAnimId) cancelAnimationFrame(gaugeAnimId);

        const animDuration = 800; // ms
        const startAngle = gaugeCurrentAngle;
        const startTime = performance.now();

        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

        const drawFrame = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / animDuration, 1);
            const easedT = easeOutCubic(t);
            const angle = startAngle + (targetAngle - startAngle) * easedT;
            gaugeCurrentAngle = angle;

            ctx.clearRect(0, 0, W, H);

            // ── Draw arc zones ──
            const zones = [
                { from: -5, to: -3, color: '#ef4444' },   // far low - red
                { from: -3, to: -2, color: '#f97316' },   // warn low - orange
                { from: -2, to: -0.5, color: '#facc15' }, // mild low - yellow
                { from: -0.5, to: 0.5, color: '#22c55e' },// perfect - green
                { from: 0.5, to: 2, color: '#facc15' },   // mild high - yellow
                { from: 2, to: 3, color: '#f97316' },     // warn high - orange
                { from: 3, to: 5, color: '#ef4444' },     // far high - red
            ];

            zones.forEach(z => {
                const a1 = Math.PI - ((z.from - MIN_VAL) / (MAX_VAL - MIN_VAL)) * Math.PI;
                const a2 = Math.PI - ((z.to - MIN_VAL) / (MAX_VAL - MIN_VAL)) * Math.PI;
                ctx.beginPath();
                ctx.arc(cx, cy, R, Math.min(a1, a2), Math.max(a1, a2));
                ctx.lineWidth = 22;
                ctx.strokeStyle = z.color;
                ctx.globalAlpha = 0.35;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });

            // ── Outer thin arc border ──
            ctx.beginPath();
            ctx.arc(cx, cy, R + 12, Math.PI, 0);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(128,128,128,0.25)';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, R - 12, Math.PI, 0);
            ctx.stroke();

            // ── Tick marks & labels ──
            const ticks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
            ticks.forEach(v => {
                const a = Math.PI - ((v - MIN_VAL) / (MAX_VAL - MIN_VAL)) * Math.PI;
                const isMajor = v % 2 === 0 || v === 0;
                const innerR = R - (isMajor ? 18 : 14);
                const outerR = R + (isMajor ? 18 : 14);

                ctx.beginPath();
                ctx.moveTo(cx + innerR * Math.cos(a), cy - innerR * Math.sin(a));
                ctx.lineTo(cx + outerR * Math.cos(a), cy - outerR * Math.sin(a));
                ctx.lineWidth = isMajor ? 2 : 1;
                ctx.strokeStyle = isMajor ? 'rgba(150,150,150,0.7)' : 'rgba(150,150,150,0.4)';
                ctx.stroke();

                if (isMajor) {
                    const labelR = R + 28;
                    const lx = cx + labelR * Math.cos(a);
                    const ly = cy - labelR * Math.sin(a);
                    ctx.font = '600 11px Inter, system-ui, sans-serif';
                    ctx.fillStyle = (v === -2 || v === 2) ? '#ef4444' : 'rgba(160,160,160,0.9)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((v > 0 ? '+' : '') + v + '%', lx, ly);
                }
            });

            // ── ±2% limit markers ──
            [-2, 2].forEach(v => {
                const a = Math.PI - ((v - MIN_VAL) / (MAX_VAL - MIN_VAL)) * Math.PI;
                ctx.beginPath();
                ctx.arc(cx, cy, R, a - 0.015, a + 0.015);
                ctx.lineWidth = 22;
                ctx.strokeStyle = '#ef4444';
                ctx.globalAlpha = 0.85;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });

            // ── Needle ──
            const needleLen = R - 6;
            const nx = cx + needleLen * Math.cos(angle);
            const ny = cy - needleLen * Math.sin(angle);

            // Needle shadow
            ctx.beginPath();
            ctx.moveTo(cx + 2, cy + 2);
            ctx.lineTo(nx + 2, ny + 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.stroke();

            // Needle body
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.lineWidth = 4;
            const absClamped = Math.abs(clamped);
            const inRange = absClamped <= 2;
            const needleColor = inRange ? '#22c55e' : '#ef4444';
            ctx.strokeStyle = needleColor;
            
            // Add attractive glow
            ctx.shadowColor = needleColor;
            ctx.shadowBlur = 12;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Needle tip dot
            ctx.beginPath();
            ctx.arc(nx, ny, 5, 0, Math.PI * 2);
            ctx.fillStyle = needleColor;
            ctx.fill();
            
            // Reset shadow for pivot
            ctx.shadowBlur = 0;

            // Center pivot circle
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            const pivotGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 8);
            pivotGrad.addColorStop(0, '#e2e8f0');
            pivotGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = pivotGrad;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(100,116,139,0.5)';
            ctx.stroke();

            // ── Center value text ──
            const sign = diffValue > 0 ? '+' : '';
            ctx.font = 'bold 22px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = needleColor;
            ctx.shadowColor = needleColor;
            ctx.shadowBlur = 8;
            ctx.fillText(sign + diffValue.toFixed(2) + '%', cx, cy - R * 0.38);
            ctx.shadowBlur = 0;

            if (t < 1) {
                gaugeAnimId = requestAnimationFrame(drawFrame);
            } else {
                gaugeAnimId = null;
            }
        };

        gaugeAnimId = requestAnimationFrame(drawFrame);

        // Update label
        const absDiff = Math.abs(diffValue);
        if (absDiff > 2) {
            label.textContent = `⚠️ Out of Range! (±2% limit exceeded)`;
            label.style.color = '#ef4444';
            label.style.fontWeight = '700';
        } else if (absDiff <= 0.5) {
            label.textContent = `✅ Perfect match — within ±0.5%`;
            label.style.color = '#22c55e';
            label.style.fontWeight = '600';
        } else {
            label.textContent = `⚡ Within acceptable range (±2%)`;
            label.style.color = '#f59e0b';
            label.style.fontWeight = '600';
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSmEvents();
            setTimeout(window.renderSiloMoistureTrendChart, 500);

            const btnReset = document.getElementById('btn-chart-reset');
            if (btnReset) btnReset.addEventListener('click', () => { if (trendChartInstance) trendChartInstance.resetZoom(); });

            const btnFs = document.getElementById('btn-chart-fullscreen');
            if (btnFs) btnFs.addEventListener('click', openFullscreenChart);

            const btnFsClose = document.getElementById('btn-chart-fullscreen-close');
            if (btnFsClose) btnFsClose.addEventListener('click', closeFullscreenChart);
        });
    } else {
        initSmEvents();
        setTimeout(window.renderSiloMoistureTrendChart, 500);

        const btnReset = document.getElementById('btn-chart-reset');
        if (btnReset) btnReset.addEventListener('click', () => { if (trendChartInstance) trendChartInstance.resetZoom(); });

        const btnFs = document.getElementById('btn-chart-fullscreen');
        if (btnFs) btnFs.addEventListener('click', openFullscreenChart);

        const btnFsClose = document.getElementById('btn-chart-fullscreen-close');
        if (btnFsClose) btnFsClose.addEventListener('click', closeFullscreenChart);
    }

})();
