// ─── Pellet Efficiency Report Module ────────────────────────────────────────────
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
    let throughputChartInstance = null;
    let energyChartInstance = null;
    let sbClient = null;

    const inp = (id, w = '100%') => `<input type="text" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">`;
    const num = (id, w = '100%', extra = '') => `<input type="number" step="any" id="${id}" ${extra} style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">`;
    
    const pmOptionList = ['Pellet Mill A', 'Pellet Mill B', 'Pellet Mill C', 'Pellet Mill D'];
    
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
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIdx = parseInt(parts[1]) - 1;
            const month = months[monthIdx] || 'Jan';
            const day = parseInt(parts[2]).toString();
            return `${day}-${month}-${year}`;
        }
        return isoStr;
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
                }
            } catch (err) {
                console.error('Failed to sync pellet efficiency with Supabase:', err);
            }
        }
    };

    const savePeData = () => {
        localStorage.setItem(LS_PELLET_EFFICIENCY, JSON.stringify(pelletEffData));
    };

    const calculateRowMetrics = (index) => {
        const runTimeVal = parseFloat(document.getElementById(`pe-run-time-${index}`).value) || 0;
        const prodVal = parseFloat(document.getElementById(`pe-prod-${index}`).value) || 0;
        const energyVal = parseFloat(document.getElementById(`pe-energy-${index}`).value) || 0;

        const throughputEl = document.getElementById(`pe-throughput-${index}`);
        const specEnergyEl = document.getElementById(`pe-spec-energy-${index}`);

        if (runTimeVal > 0 && prodVal > 0) {
            throughputEl.value = (prodVal / runTimeVal).toFixed(2);
        } else {
            throughputEl.value = '';
        }

        if (prodVal > 0 && energyVal > 0) {
            specEnergyEl.value = (energyVal / prodVal).toFixed(2);
        } else {
            specEnergyEl.value = '';
        }
    };

    const addPeRowUI = (row = {}) => {
        const tbody = document.getElementById('pe-rows-tbody');
        const index = tbody.children.length;
        const tr = document.createElement('tr');
        
        const millOptions = pmOptionList.map(name => `<option value="${name}" ${row.mill === name ? 'selected' : ''}>${name}</option>`).join('');
        
        tr.innerHTML = `
            <td>
                <select id="pe-mill-${index}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);">
                    ${millOptions}
                </select>
            </td>
            <td>${num(`pe-run-time-${index}`, '100%', `value="${row.runTime || ''}" oninput="window.calcPeRow(${index})"`)}</td>
            <td>${num(`pe-prod-${index}`, '100%', `value="${row.production || ''}" oninput="window.calcPeRow(${index})"`)}</td>
            <td>${num(`pe-energy-${index}`, '100%', `value="${row.energy || ''}" oninput="window.calcPeRow(${index})"`)}</td>
            <td><input type="text" id="pe-throughput-${index}" readonly style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:rgba(0,0,0,0.05);color:var(--text-secondary);" value="${row.throughput || ''}"></td>
            <td><input type="text" id="pe-spec-energy-${index}" readonly style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:rgba(0,0,0,0.05);color:var(--text-secondary);" value="${row.specificEnergy || ''}"></td>
            <td>${num(`pe-pdi-${index}`, '100%', `value="${row.pdi || ''}"`)}</td>
            <td>${num(`pe-temp-${index}`, '100%', `value="${row.temperature || ''}"`)}</td>
            <td>${inp(`pe-remarks-${index}`, '100%')}</td>
        `;
        
        tbody.appendChild(tr);
        if (row.remarks) {
            document.getElementById(`pe-remarks-${index}`).value = row.remarks;
        }
    };

    window.calcPeRow = (index) => {
        calculateRowMetrics(index);
    };

    const renderPeTable = () => {
        const tbody = document.querySelector('#pellet-efficiency-table tbody');
        if (!tbody) return;

        if (pelletEffData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary);">No Pellet Efficiency Records yet. Click "Add Pellet Report" to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        [...pelletEffData].reverse().forEach(r => {
            const tr = document.createElement('tr');
            
            const prodSummary = r.rows.reduce((acc, row) => acc + (parseFloat(row.production) || 0), 0).toFixed(1);
            const hrsSummary = r.rows.reduce((acc, row) => acc + (parseFloat(row.runTime) || 0), 0).toFixed(1);
            const avgThroughput = hrsSummary > 0 ? (prodSummary / hrsSummary).toFixed(2) : '0';
            const totalEnergy = r.rows.reduce((acc, row) => acc + (parseFloat(row.energy) || 0), 0);
            const avgSpecEnergy = prodSummary > 0 ? (totalEnergy / prodSummary).toFixed(2) : '0';
            const avgPdi = (r.rows.reduce((acc, row) => acc + (parseFloat(row.pdi) || 0), 0) / r.rows.length).toFixed(1);

            tr.innerHTML = `
                <td>${r.date}</td>
                <td><span class="sr-shift-badge ${r.shift === 'Morning' ? 'shift-a' : r.shift === 'Evening' ? 'shift-b' : 'shift-c'}">${r.shift}</span></td>
                <td>👷 ${r.officerName}</td>
                <td style="font-size:0.85rem;line-height:1.2;">${r.rows.map(row => row.mill).join(', ')}</td>
                <td>${prodSummary}</td>
                <td>${hrsSummary}</td>
                <td><strong>${avgThroughput}</strong></td>
                <td>${avgSpecEnergy}</td>
                <td>${avgPdi}%</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editPelletEff(${r.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deletePelletEff(${r.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderCharts();
    };

    window.editPelletEff = (id) => {
        const r = pelletEffData.find(x => x.id === id);
        if (!r) return;
        activePeReportId = id;
        
        document.getElementById('pe-date').value = r.date || '';
        document.getElementById('pe-shift').value = r.shift || 'Morning';
        document.getElementById('pe-officer').value = r.officerName || '';

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
        const ctxThroughput = document.getElementById('pellet-throughput-chart');
        const ctxEnergy = document.getElementById('pellet-energy-chart');
        if (!ctxThroughput || !ctxEnergy) return;

        const sortedData = [...pelletEffData].sort((a, b) => {
            const dateA = new Date(parseDateToISO(a.date));
            const dateB = new Date(parseDateToISO(b.date));
            return dateA - dateB;
        });

        const chartData = sortedData.slice(-10);
        const labels = chartData.map(r => `${r.date} (${r.shift})`);

        const throughputs = chartData.map(r => {
            const prod = r.rows.reduce((acc, row) => acc + (parseFloat(row.production) || 0), 0);
            const hrs = r.rows.reduce((acc, row) => acc + (parseFloat(row.runTime) || 0), 0);
            return hrs > 0 ? parseFloat((prod / hrs).toFixed(2)) : 0;
        });

        const energies = chartData.map(r => {
            const prod = r.rows.reduce((acc, row) => acc + (parseFloat(row.production) || 0), 0);
            const totalEnergy = r.rows.reduce((acc, row) => acc + (parseFloat(row.energy) || 0), 0);
            return prod > 0 ? parseFloat((totalEnergy / prod).toFixed(2)) : 0;
        });

        if (throughputChartInstance) throughputChartInstance.destroy();
        if (energyChartInstance) energyChartInstance.destroy();

        const isDark = document.body.classList.contains('dark-mode') || 
                       getComputedStyle(document.body).getPropertyValue('--bg-primary').trim() === '#0f172a';

        const textColor = isDark ? '#f8fafc' : '#334155';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        throughputChartInstance = new Chart(ctxThroughput, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Throughput (T/Hr)',
                    data: throughputs,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 6
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

        energyChartInstance = new Chart(ctxEnergy, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Specific Energy (kWh/T)',
                    data: energies,
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(245, 158, 11, 1)'
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
                document.getElementById('pe-shift').value = 'Morning';
                document.getElementById('pe-officer').value = '';
                
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
                const shift = document.getElementById('pe-shift').value;
                const officerName = document.getElementById('pe-officer').value;

                if (!date) return alert('Please enter Date.');
                if (!officerName) return alert('Please select Production Officer.');

                const rows = [];
                const tbody = document.getElementById('pe-rows-tbody');
                const rowCount = tbody.children.length;

                for (let i = 0; i < rowCount; i++) {
                    const mill = document.getElementById(`pe-mill-${i}`).value;
                    const runTime = parseFloat(document.getElementById(`pe-run-time-${i}`).value) || 0;
                    const production = parseFloat(document.getElementById(`pe-prod-${i}`).value) || 0;
                    const energy = parseFloat(document.getElementById(`pe-energy-${i}`).value) || 0;
                    const throughput = parseFloat(document.getElementById(`pe-throughput-${i}`).value) || 0;
                    const specificEnergy = parseFloat(document.getElementById(`pe-spec-energy-${i}`).value) || 0;
                    const pdi = parseFloat(document.getElementById(`pe-pdi-${i}`).value) || 0;
                    const temperature = parseFloat(document.getElementById(`pe-temp-${i}`).value) || 0;
                    const remarks = document.getElementById(`pe-remarks-${i}`).value;

                    if (runTime > 0 || production > 0 || energy > 0 || pdi > 0) {
                        rows.push({ mill, runTime, production, energy, throughput, specificEnergy, pdi, temperature, remarks });
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
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        if (window.showToast) window.showToast('✓ Saved locally (Supabase offline)');
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally');
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
