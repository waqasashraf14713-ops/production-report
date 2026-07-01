// ─── Pellet Efficiency Report Module ────────────────────────────────────────────
// Version: 1.1.0 - Excel Style Redesign
(() => {
try {
    const LS_PELLET_EFFICIENCY = 'fm_pellet_efficiency';
    let pelletEffData = [];
    try {
        pelletEffData = JSON.parse(localStorage.getItem(LS_PELLET_EFFICIENCY) || '[]');
    } catch (e) {
        console.error("Failed to parse pellet efficiency data from localStorage:", e);
    }
    let activePeReportId = null;
    let productionChartInstance = null;
    let efficiencyChartInstance = null;
    let sbClient = null;

    const inp = (id, w = '100%') => `<input type="text" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">`;
    const num = (id, w = '100%', extra = '') => `<input type="number" step="any" id="${id}" ${extra} style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">`;
    
    const pmOptionList = ['A Pellet', 'B Pellet'];
    
    const initSupabase = () => {
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl');
        const sbKey = localStorage.getItem('fmpr_supabaseKey');
        const sbDisabled = localStorage.getItem('fmpr_supabaseDisabled') === 'true';
        if (sbUrl && sbKey && !sbDisabled && typeof supabase !== 'undefined') {
            try {
                const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
                sbClient = supabase.createClient(cleanUrl, sbKey);
            } catch (e) {
                console.error('Pellet efficiency supabase init error:', e);
            }
        }
    };

    const parseDateToISO = (dateStr) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
            const month = months[parts[1]] || '01';
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    };

    const formatISOToLocale = (isoStr) => {
        if (!isoStr) return '';
        const parts = isoStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const monthNum = parts[1];
            const day = parseInt(parts[2]).toString();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = months[parseInt(monthNum) - 1] || 'Jan';
            return `${day}-${monthName}-${year.substring(2)}`;
        }
        return isoStr;
    };

    const getDayOfWeek = (dateStr) => {
        let dateObj;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            dateObj = new Date(dateStr);
        } else {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
                const day = parseInt(parts[0]);
                const month = months[parts[1]] || 0;
                const year = parseInt('20' + parts[2]);
                dateObj = new Date(year, month, day);
            }
        }
        if (!dateObj || isNaN(dateObj.getTime())) return '';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dateObj.getDay()];
    };

    const addPeRowUI = (row = {}) => {
        const tbody = document.getElementById('pe-rows-tbody');
        const index = tbody.children.length;
        const tr = document.createElement('tr');
        
        const mill = row.mill || (index === 0 ? 'A Pellet' : 'B Pellet');
        const prod = parseFloat(row.production) || 0;
        const runTime = parseFloat(row.runTime) || 0;
        
        const avg = runTime > 0 ? Math.round(prod / runTime) : 0;
        const target = mill === 'A Pellet' ? 600 : 800;
        const eff = avg > 0 ? Math.round((avg / target) * 100) : 0;
        const tonHrs = runTime > 0 ? Math.round(prod * 0.05 / runTime) : 0;

        tr.innerHTML = `
            <td>
                <select id="pe-mill-${index}" onchange="window.calcPeRow(${index})" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);font-weight:600;cursor:pointer;">
                    <option value="A Pellet" ${mill === 'A Pellet' ? 'selected' : ''}>A Pellet</option>
                    <option value="B Pellet" ${mill === 'B Pellet' ? 'selected' : ''}>B Pellet</option>
                </select>
            </td>
            <td>${num(`pe-prod-${index}`, '100%', `value="${row.production || ''}" oninput="window.calcPeRow(${index})"`)}</td>
            <td>${num(`pe-run-time-${index}`, '100%', `value="${row.runTime || ''}" oninput="window.calcPeRow(${index})"`)}</td>
            <td><input type="text" id="pe-average-${index}" readonly style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;" value="${avg || ''}"></td>
            <td><input type="text" id="pe-efficiency-${index}" readonly style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;" value="${eff ? eff + '%' : ''}"></td>
            <td><input type="text" id="pe-tonhrs-${index}" readonly style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;" value="${tonHrs || ''}"></td>
            <td>${inp(`pe-remarks-${index}`, '100%')}</td>
        `;
        
        tbody.appendChild(tr);
        if (row.remarks) {
            document.getElementById(`pe-remarks-${index}`).value = row.remarks;
        }
    };

    window.calcPeRow = (index) => {
        const mill = document.getElementById(`pe-mill-${index}`).value;
        const prod = parseFloat(document.getElementById(`pe-prod-${index}`).value) || 0;
        const runTime = parseFloat(document.getElementById(`pe-run-time-${index}`).value) || 0;
        
        const avgEl = document.getElementById(`pe-average-${index}`);
        const effEl = document.getElementById(`pe-efficiency-${index}`);
        const tonHrsEl = document.getElementById(`pe-tonhrs-${index}`);
        
        const avg = runTime > 0 ? Math.round(prod / runTime) : 0;
        const target = mill === 'A Pellet' ? 600 : 800;
        const eff = avg > 0 ? Math.round((avg / target) * 100) : 0;
        const tonHrs = runTime > 0 ? Math.round(prod * 0.05 / runTime) : 0;
        
        if (avgEl) avgEl.value = avg || '';
        if (effEl) effEl.value = eff ? eff + '%' : '';
        if (tonHrsEl) tonHrsEl.value = tonHrs || '';
    };

    const renderPeTable = () => {
        const tbody = document.querySelector('#pellet-efficiency-table tbody');
        const tfoot = document.getElementById('pellet-efficiency-tfoot');
        if (!tbody) return;

        if (pelletEffData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary);">No Pellet Efficiency Records yet. Click "Add Pellet Report" to create one.</td></tr>`;
            if (tfoot) tfoot.innerHTML = '';
            return;
        }

        tbody.innerHTML = '';
        
        let totalProduction = 0;
        let totalRunTime = 0;
        let totalAverage = 0;
        let totalEfficiencySum = 0;
        let totalTonHrsSum = 0;
        let rowCount = 0;
        
        // Sort by date ascending to render chronologically like the Excel sheet
        const sortedReports = [...pelletEffData].sort((a, b) => {
            return new Date(parseDateToISO(a.date)) - new Date(parseDateToISO(b.date));
        });

        sortedReports.forEach(r => {
            const dayName = getDayOfWeek(r.date);
            const isSunday = dayName === 'Sun';

            r.rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--card-border)';
                
                const mill = row.mill || 'A Pellet';
                const prod = parseFloat(row.production) || 0;
                const runTime = parseFloat(row.runTime) || 0;
                
                const avg = runTime > 0 ? Math.round(prod / runTime) : 0;
                const target = mill === 'A Pellet' ? 600 : 800;
                const eff = avg > 0 ? Math.round((avg / target) * 100) : 0;
                const tonHrs = runTime > 0 ? Math.round(prod * 0.05 / runTime) : 0;

                totalProduction += prod;
                totalRunTime += runTime;
                totalAverage += avg;
                totalEfficiencySum += eff;
                totalTonHrsSum += tonHrs;
                rowCount++;

                const formattedProd = prod.toLocaleString();
                const pelletBadgeColor = mill === 'A Pellet' ? '#f59e0b' : '#10b981';
                
                const effBarColor = '#3b82f6';
                const tonHrsBarColor = '#db2777';

                tr.innerHTML = `
                    <td>${r.date}</td>
                    <td style="${isSunday ? 'background:#ef4444; color:white; font-weight:bold; border-radius:4px; text-align:center;' : ''}">${dayName}</td>
                    <td>
                        <span style="background:${pelletBadgeColor}; color:white; padding:0.25rem 0.6rem; border-radius:4px; font-weight:700; font-size:0.75rem; display:inline-block; min-width:70px; text-align:center;">
                           ${mill}
                        </span>
                    </td>
                    <td style="font-weight:600; color:#3b82f6;">${formattedProd}</td>
                    <td>${runTime}</td>
                    <td style="font-weight:600;">${avg}</td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; min-width:110px;">
                            <span style="font-weight:700; min-width:35px; text-align:left;">${eff}%</span>
                            <div style="flex:1; height:12px; background:var(--card-border); border-radius:2px; overflow:hidden; min-width:50px;">
                                <div style="width:${Math.min(eff, 100)}%; background:${effBarColor}; height:100%;"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; min-width:110px;">
                            <span style="font-weight:700; min-width:25px; text-align:left;">${tonHrs}</span>
                            <div style="flex:1; height:12px; background:var(--card-border); border-radius:2px; overflow:hidden; min-width:50px;">
                                <div style="width:${Math.min((tonHrs / 40) * 100, 100)}%; background:${tonHrsBarColor}; height:100%;"></div>
                            </div>
                        </div>
                    </td>
                    <td style="font-style:italic; color:var(--text-secondary); text-align:left;">${row.remarks || '-'}</td>
                    <td class="no-print">
                        <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editPelletEff(${r.id})">Edit</button>
                        <button class="btn btn-danger" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="deletePelletEff(${r.id})">Del</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });

        // Render Footer Summary row (Totals & Averages)
        if (tfoot && rowCount > 0) {
            const avgEff = Math.round(totalEfficiencySum / rowCount);
            const avgTonHrs = Math.round(totalTonHrsSum / rowCount);
            const avgBagsHr = Math.round(totalAverage / rowCount);

            tfoot.innerHTML = `
                <tr style="background:var(--card-bg); color:var(--text-primary); font-weight:bold; border-top:2px solid #cbd5e1;">
                    <td colspan="2" style="padding:0.6rem; text-align:center;">TOTALS / AVERAGES</td>
                    <td>Count: ${rowCount}</td>
                    <td style="color:#3b82f6;">${totalProduction.toLocaleString()}</td>
                    <td>${parseFloat(totalRunTime.toFixed(2))}</td>
                    <td>${avgBagsHr}</td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                            <span>${avgEff}%</span>
                            <div style="width:50px; height:12px; background:#e2e8f0; border-radius:2px; overflow:hidden;">
                                <div style="width:${Math.min(avgEff, 100)}%; background:#3b82f6; height:100%;"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                            <span>${avgTonHrs}</span>
                            <div style="width:50px; height:12px; background:#e2e8f0; border-radius:2px; overflow:hidden;">
                                <div style="width:${Math.min((avgTonHrs / 40) * 100, 100)}%; background:#db2777; height:100%;"></div>
                            </div>
                        </div>
                    </td>
                    <td colspan="2"></td>
                </tr>
            `;
        } else if (tfoot) {
            tfoot.innerHTML = '';
        }

        // Calculate separate averages for gauges
        let sumEffA = 0, countA = 0;
        let sumEffB = 0, countB = 0;
        sortedReports.forEach(r => {
            r.rows.forEach(row => {
                const mill = row.mill || 'A Pellet';
                const prod = parseFloat(row.production) || 0;
                const runTime = parseFloat(row.runTime) || 0;
                const avg = runTime > 0 ? Math.round(prod / runTime) : 0;
                const target = mill === 'A Pellet' ? 600 : 800;
                const eff = avg > 0 ? Math.round((avg / target) * 100) : 0;

                if (mill === 'A Pellet') {
                    sumEffA += eff;
                    countA++;
                } else if (mill === 'B Pellet') {
                    sumEffB += eff;
                    countB++;
                }
            });
        });
        const avgEffA = countA > 0 ? (sumEffA / countA) : 0;
        const avgEffB = countB > 0 ? (sumEffB / countB) : 0;

        // Render Gauges
        renderPeGauge('a', avgEffA);
        renderPeGauge('b', avgEffB);

        renderCharts();
    };

    window.editPelletEff = (id) => {
        const r = pelletEffData.find(x => x.id === id);
        if (!r) return;
        activePeReportId = id;
        
        document.getElementById('pe-date').value = r.date || '';

        const tbody = document.getElementById('pe-rows-tbody');
        tbody.innerHTML = '';
        if (r.rows && r.rows.length > 0) {
            r.rows.forEach(row => addPeRowUI(row));
        } else {
            pmOptionList.forEach(mill => addPeRowUI({ mill }));
        }

        document.getElementById('pellet-efficiency-modal').classList.add('show');
    };

    window.deletePelletEff = async (id) => {
        if (!confirm('Delete this Pellet Efficiency record?')) return;
        pelletEffData = pelletEffData.filter(x => x.id !== id);
        savePeData();
        renderPeTable();

        initSupabase();
        if (sbClient) {
            try {
                const { error } = await sbClient.from('pellet_efficiency').delete().eq('id', id);
                if (error) throw error;
                if (window.showToast) window.showToast('✓ Deleted from Supabase');
            } catch (err) {
                console.error('Failed to delete from Supabase:', err);
            }
        }
    };

    const renderCharts = () => {
        const ctxProduction = document.getElementById('pellet-throughput-chart');
        const ctxEfficiency = document.getElementById('pellet-energy-chart');
        if (!ctxProduction || !ctxEfficiency) return;

        const sortedData = [...pelletEffData].sort((a, b) => {
            const dateA = new Date(parseDateToISO(a.date));
            const dateB = new Date(parseDateToISO(b.date));
            return dateA - dateB;
        });

        const chartData = sortedData.slice(-15);
        const labels = chartData.map(r => r.date);

        const productions = chartData.map(r => {
            return r.rows.reduce((acc, row) => acc + (parseFloat(row.production) || 0), 0);
        });

        const efficiencies = chartData.map(r => {
            const sumEff = r.rows.reduce((acc, row) => {
                const prod = parseFloat(row.production) || 0;
                const runTime = parseFloat(row.runTime) || 0;
                const avg = runTime > 0 ? Math.round(prod / runTime) : 0;
                const target = row.mill === 'A Pellet' ? 600 : 800;
                return acc + (avg > 0 ? Math.round((avg / target) * 100) : 0);
            }, 0);
            return r.rows.length > 0 ? Math.round(sumEff / r.rows.length) : 0;
        });

        if (productionChartInstance) productionChartInstance.destroy();
        if (efficiencyChartInstance) efficiencyChartInstance.destroy();

        const isDark = document.body.classList.contains('dark-mode') || 
                       getComputedStyle(document.body).getPropertyValue('--bg-primary').trim() === '#0f172a';

        const textColor = isDark ? '#f8fafc' : '#334155';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        productionChartInstance = new Chart(ctxProduction, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Production (Bags)',
                    data: productions,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: textColor }, grid: { display: false } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
                }
            }
        });

        efficiencyChartInstance = new Chart(ctxEfficiency, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Efficiency %',
                    data: efficiencies,
                    borderColor: 'rgba(236, 72, 153, 1)',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(236, 72, 153, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: textColor }, grid: { display: false } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
                }
            }
        });
    };

    const initPeEvents = () => {
        const btnAdd = document.getElementById('btn-add-pellet-efficiency');
        const modal = document.getElementById('pellet-efficiency-modal');
        const btnClose = document.getElementById('pellet-efficiency-close');
        const btnCancel = document.getElementById('btn-cancel-pe');
        const btnSave = document.getElementById('btn-save-pe');

        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                activePeReportId = null;
                const today = new Date();
                document.getElementById('pe-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
                
                const tbody = document.getElementById('pe-rows-tbody');
                tbody.innerHTML = '';
                pmOptionList.forEach(mill => addPeRowUI({ mill }));

                modal.classList.add('show');
            });
        }

        const closeModal = () => modal.classList.remove('show');
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const date = document.getElementById('pe-date').value.trim();
                const shift = 'Morning';
                const officerName = '';

                if (!date) return alert('Please enter Date.');

                const rows = [];
                const tbody = document.getElementById('pe-rows-tbody');
                const rowCount = tbody.children.length;

                for (let i = 0; i < rowCount; i++) {
                    const mill = document.getElementById(`pe-mill-${i}`).value;
                    const runTime = parseFloat(document.getElementById(`pe-run-time-${i}`).value) || 0;
                    const production = parseFloat(document.getElementById(`pe-prod-${i}`).value) || 0;
                    const remarks = document.getElementById(`pe-remarks-${i}`).value;

                    if (runTime > 0 || production > 0) {
                        rows.push({ mill, runTime, production, remarks });
                    }
                }

                if (rows.length === 0) {
                    return alert('Please enter data for at least one Pellet Mill.');
                }

                const report = {
                    id: activePeReportId || Date.now(),
                    date,
                    shift,
                    officerName,
                    rows
                };

                if (activePeReportId) {
                    const idx = pelletEffData.findIndex(x => x.id === activePeReportId);
                    if (idx !== -1) {
                        pelletEffData[idx] = report;
                    }
                } else {
                    pelletEffData.push(report);
                }

                savePeData();
                renderPeTable();
                closeModal();

                // Save to Supabase
                initSupabase();
                if (sbClient) {
                    try {
                        const dbRecord = {
                            id: report.id,
                            date: parseDateToISO(report.date),
                            shift: report.shift,
                            officer_name: report.officerName,
                            rows: report.rows
                        };
                        const { error } = await sbClient.from('pellet_efficiency').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert('✓ Pellet Efficiency Report saved to Supabase successfully!');
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        const errorMsg = err.message || err.details || JSON.stringify(err);
                        if (window.showToast) window.showToast(`✗ Supabase Error: ${errorMsg}`);
                        alert(`✗ Supabase Save Error:\n${errorMsg}\n\nPlease check if your table exists and RLS is disabled.`);
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally (Supabase not configured)');
                    alert('✓ Saved locally (Supabase not configured or offline).');
                }
            });
        }

        const navPe = document.getElementById('nav-pellet-efficiency');
        if (navPe) {
            navPe.addEventListener('click', () => {
                setTimeout(renderCharts, 150);
            });
        }
    };

    const syncWithSupabase = async () => {
        initSupabase();
        if (sbClient) {
            try {
                const { data, error } = await sbClient.from('pellet_efficiency').select('*').order('date', { ascending: true });
                if (!error && data) {
                    pelletEffData = data.map(r => ({
                        id: r.id,
                        date: formatISOToLocale(r.date),
                        shift: r.shift,
                        officerName: r.officer_name,
                        rows: r.rows
                    }));
                    savePeData();
                    renderPeTable();
                } else {
                    renderPeTable();
                }
            } catch (err) {
                console.error('Failed to sync pellet efficiency with Supabase:', err);
                renderPeTable();
            }
        } else {
            renderPeTable();
        }
    };

    let gaugeAnimA = null;
    let gaugeCurrentA = 0;
    let gaugeAnimB = null;
    let gaugeCurrentB = 0;

    const renderPeGauge = (type, value) => {
        const canvas = document.getElementById(`pe-gauge-canvas-${type}`);
        const label = document.getElementById(`pe-gauge-label-${type}`);
        if (!canvas || !label) return;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H - 20; 
        const R = Math.min(cx, cy) - 10; 

        const MIN_VAL = 0;
        const MAX_VAL = 120;
        const clamped = Math.max(MIN_VAL, Math.min(MAX_VAL, value));

        const targetAngle = Math.PI - (clamped / MAX_VAL) * Math.PI;

        let startAngle = type === 'a' ? gaugeCurrentA : gaugeCurrentB;
        const startTime = performance.now();
        const animDuration = 800; // ms
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

        const drawFrame = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / animDuration, 1);
            const easedT = easeOutCubic(t);
            const angle = startAngle + (targetAngle - startAngle) * easedT;

            if (type === 'a') gaugeCurrentA = angle;
            else gaugeCurrentB = angle;

            ctx.clearRect(0, 0, W, H);

            // Draw arc zones
            const zones = [
                { from: 0, to: 60, color: '#ef4444' },    // below 60 - red
                { from: 60, to: 80, color: '#f59e0b' },   // 60 to 80 - yellow/orange
                { from: 80, to: 120, color: '#10b981' }   // 80 and above - green
            ];

            zones.forEach(z => {
                const a1 = Math.PI - (z.from / MAX_VAL) * Math.PI;
                const a2 = Math.PI - (z.to / MAX_VAL) * Math.PI;
                ctx.beginPath();
                ctx.arc(cx, cy, R, Math.min(a1, a2), Math.max(a1, a2));
                ctx.lineWidth = 20;
                ctx.strokeStyle = z.color;
                ctx.globalAlpha = 0.35;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });

            // Outer thin borders
            ctx.beginPath();
            ctx.arc(cx, cy, R + 10, Math.PI, 0);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(128,128,128,0.2)';
            ctx.stroke();

            // Ticks
            const ticks = [0, 20, 40, 60, 80, 100, 120];
            ticks.forEach(v => {
                const a = Math.PI - (v / MAX_VAL) * Math.PI;
                const innerR = R - 12;
                const outerR = R + 10;

                ctx.beginPath();
                ctx.moveTo(cx + innerR * Math.cos(a), cy - innerR * Math.sin(a));
                ctx.lineTo(cx + outerR * Math.cos(a), cy - outerR * Math.sin(a));
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(150,150,150,0.5)';
                ctx.stroke();

                // Tick labels
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelR = R - 22;
                ctx.fillText(v + '%', cx + labelR * Math.cos(a), cy - labelR * Math.sin(a));
            });

            // Determine needle color based on value
            let needleColor = '#f59e0b'; // orange/yellow (60-80)
            if (value >= 80) {
                needleColor = '#10b981'; // green (80+)
            } else if (value < 60) {
                needleColor = '#ef4444'; // red (<60)
            }

            // Needle
            ctx.beginPath();
            ctx.moveTo(cx - 6 * Math.sin(angle), cy - 6 * Math.cos(angle));
            ctx.lineTo(cx + R * Math.cos(angle), cy - R * Math.sin(angle));
            ctx.lineTo(cx + 6 * Math.sin(angle), cy + 6 * Math.cos(angle));
            ctx.closePath();
            ctx.fillStyle = needleColor;
            ctx.fill();

            // Pivot center circle
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
            ctx.fillStyle = needleColor;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            if (t < 1) {
                if (type === 'a') gaugeAnimA = requestAnimationFrame(drawFrame);
                else gaugeAnimB = requestAnimationFrame(drawFrame);
            }
        };

        if (type === 'a') {
            if (gaugeAnimA) cancelAnimationFrame(gaugeAnimA);
            gaugeAnimA = requestAnimationFrame(drawFrame);
        } else {
            if (gaugeAnimB) cancelAnimationFrame(gaugeAnimB);
            gaugeAnimB = requestAnimationFrame(drawFrame);
        }

        label.textContent = `${Math.round(value)}%`;
    };
    const savePeData = () => {
        localStorage.setItem(LS_PELLET_EFFICIENCY, JSON.stringify(pelletEffData));
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            initPeEvents();
            await syncWithSupabase();
        });
    } else {
        initPeEvents();
        syncWithSupabase();
    }

} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('pellet_efficiency.js', err);
    } else {
        console.error('pellet_efficiency.js error:', err);
    }
}
})();
