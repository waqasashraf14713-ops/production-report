// ─── Silo Filling and Discharge Performa Module ──────────────────────────────
(() => {
try {
    const LS_SILO_LOGS = 'fm_silo_logs';
    let siloLogs = [];
    try {
        siloLogs = JSON.parse(localStorage.getItem(LS_SILO_LOGS) || '[]');
    } catch(e) {
        console.error("Failed to parse silo logs:", e);
    }
    let activeLogId = null;
    let sbClient = null;

    let currentHistorySilo = null;
    let currentHistoryOperation = null;

    const initSupabase = () => {
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl');
        const sbKey = localStorage.getItem('fmpr_supabaseKey');
        const sbDisabled = localStorage.getItem('fmpr_supabaseDisabled') === 'true';
        if (sbUrl && sbKey && !sbDisabled && typeof supabase !== 'undefined') {
            try {
                const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
                sbClient = supabase.createClient(cleanUrl, sbKey);
            } catch (e) {
                console.error('Silo performa Supabase init error:', e);
            }
        }
    };

    const saveSiloLogs = () => {
        localStorage.setItem(LS_SILO_LOGS, JSON.stringify(siloLogs));
    };

    // Helper to generate the exact HTML table rows with a separate Sr No column (RTL ordered: Sr No, Section, Description, Yes, No)
    const generateInspectionRowsHTML = (insp, renderTickFn) => {
        return `
            <!-- Silo Top -->
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">1</td>
                <td rowspan="4" style="text-align:center;font-weight:bold;vertical-align:middle;border:1px solid #000;background:#f8fafc;">Silo Top</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو ٹاپ کی ائیر ٹائٹنس کو صاف کیا گیا ہے اور کھلا (Open) تو نہیں۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">2</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">اوپر دیکھو کہ ائیر ٹائٹنس کی کوئی بولٹ کھلی تو نہیں ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top2, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">3</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">تمام بلور کو چلا کر دیکھیں کہ ہوا کا دباؤ درست ہے اور کوئی مٹی وغیرہ تو نہیں ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top3, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top3, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">4</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">فلنگ (Filling) سے پہلے والو کو آپریٹ کر کے دیکھ لیں۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top4, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top4, false)}</td>
            </tr>

            <!-- Silo Bottom -->
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">5</td>
                <td rowspan="12" style="text-align:center;font-weight:bold;vertical-align:middle;border:1px solid #000;background:#f8fafc;">Silo Bottom</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر ائیر ڈکٹس (Aeration Ducts) کو صاف کیا گیا ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">6</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود تمام ہینڈل اور ڈسچارج گیٹ ko ٹیسٹ کیا گیا ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot2, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">7</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود تمام وینٹیلیشن ٹرینچز (Ventilation Trenches) کو صاف کیا گیا ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot3, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot3, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">8</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود تمام وینٹیلیشن ٹرینچ شیٹس (Ventilation Trench Sheets) کو اچھی طرح صاف اور فٹ کیا گیا ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot4, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot4, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">9</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر فرش کے ساتھ پلیٹس والا جوڑ ٹھیک ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot5, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot5, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">10</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود سوئپر کنویئر فلیکسیبل ہے اور اپنی جگہ پر ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot6, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot6, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">11</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے باہر شیٹس والا جوڑ ٹھیک ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot7, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot7, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">12</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے تمام ڈسچارج گیٹس کو مکمل بند کیا گیا ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot8, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot8, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">13</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے تمام ڈسچارج گیٹس لاک (SEAL) ہیں؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot9, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot9, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">14</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کی مشین (Entrance) کا دروازہ اچھی طرح سے بند ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot10, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot10, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">15</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سردیوں میں گرین کا درجہ حرارت 16 ڈگری سے زیادہ سائلو میں نہیں ہونا چاہیے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot11, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot11, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">16</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">گرمیوں میں گرین کا درجہ حرارت 14 ڈگری سے زیادہ سائلو میں نہیں ہونا چاہیے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot12, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot12, false)}</td>
            </tr>
        `;
    };

    const generateLabRowsHTML = (insp, renderTickFn) => {
        return `
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">1</td>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;background:#f8fafc;">Lab Check</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلوز میں کوئی پرانا بیج یا اکسیڑا (Old Grain / Infestation) موجود نہیں ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">2</td>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;background:#f8fafc;">Fumigation</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">کیا سائلو کو فیومیگیٹ (Fumigate) کرنے کی ضرورت ہے؟</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab2, false)}</td>
            </tr>
        `;
    };

    // Print Silo Inspection Report as beautiful paper
    window.printSiloInspection = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return alert('Record not found.');

        const insp = log.inspection || {};
        const sealNo = log.sealNo || '';
        const date = log.date || '';
        const siloNo = log.siloNumber ? log.siloNumber.replace('Silo ', '') : '';
        const material = log.material || '';
        const officer = log.supervisor || ''; // officer name (mapped to supervisor)
        const operator = log.operator || '';  // operator name
        const shift = log.shift || 'A';
        const remarks = log.remarks || '';

        const renderTick = (val, expectTrue = true) => {
            if (expectTrue) {
                return val ? '<span style="font-family:Arial,sans-serif;font-size:1.25rem;color:#16a34a;">✔</span>' : '';
            } else {
                return !val ? '<span style="font-family:Arial,sans-serif;font-size:1.25rem;color:#dc2626;">✔</span>' : '';
            }
        };

        const printWindow = window.open('', '_blank', 'width=900,height=950');
        printWindow.document.write(`
            <html>
            <head>
                <title>Silo Inspection Report - Silo ${siloNo}</title>
                <link href="https://cdn.jsdelivr.net/npm/jameel-noori@1.1.2/jameel-noori.min.css" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif;
                        direction: rtl;
                        text-align: right;
                        padding: 30px;
                        background: #fff;
                        color: #000;
                        margin: 0;
                    }
                    .header-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .header-table td {
                        border: none;
                        padding: 5px;
                        font-size: 1.2rem;
                    }
                    .title-block {
                        text-align: center;
                        font-weight: bold;
                        border: 2px solid #000 !important;
                        padding: 12px !important;
                        border-radius: 4px;
                    }
                    .meta-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .meta-table td {
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 1.25rem;
                        text-align: right;
                    }
                    .main-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .main-table th, .main-table td {
                        border: 1px solid #000;
                        padding: 8px 10px;
                        font-size: 1.2rem;
                        vertical-align: middle;
                    }
                    .main-table th {
                        background: #f1f5f9;
                        text-align: center;
                        font-weight: bold;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body onload="window.print();">
                <table class="header-table">
                    <tr>
                        <td style="width:30%; font-weight:bold;">سیل نمبر: <span style="font-family:Arial,sans-serif;font-size:1.15rem;border-bottom:1px solid #000;padding:0 5px;">${sealNo}</span></td>
                        <td class="title-block" style="width:40%;">
                            <div style="font-size:1.6rem;font-weight:bold;">سائلو انسپکشن رپورٹ - سٹیل سائلوز (Steel Silo)</div>
                            <div style="font-size:1.25rem;margin-top:5px;color:#475569;">(فلنگ سے پہلے انسپکشن پرفارما)</div>
                        </td>
                        <td style="width:30%; text-align:left; font-weight:bold;">تاریخ: <span style="border-bottom:1px solid #000;padding:0 5px;">${date}</span></td>
                    </tr>
                </table>

                <table class="meta-table">
                    <tr>
                        <td style="width:20%;"><strong>سائلو نمبر:</strong> <span style="font-family:Arial,sans-serif;">${siloNo}</span></td>
                        <td style="width:20%;"><strong>مٹیریل:</strong> ${material}</td>
                        <td style="width:20%;"><strong>شفٹ:</strong> ${shift}</td>
                        <td style="width:20%;"><strong>آفیسر کا نام:</strong> ${officer}</td>
                        <td style="width:20%;"><strong>آپریٹر کا نام:</strong> ${operator}</td>
                    </tr>
                </table>

                <table class="main-table">
                    <thead>
                        <tr style="background:#f2f2f2;">
                            <th style="width:8%; text-align:center;">Sr. No</th>
                            <th style="width:12%; text-align:center;">حصہ</th>
                            <th style="width:64%; text-align:right; padding-right:12px;">نکات اور اہم چیک لسٹ (پروڈکشن ڈیپارٹمنٹ)</th>
                            <th style="width:8%; text-align:center;">ہاں</th>
                            <th style="width:8%; text-align:center;">نہیں</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateInspectionRowsHTML(insp, renderTick)}
                    </tbody>
                </table>

                <div style="font-size:1.2rem;margin-bottom:25px;font-weight:bold;margin-top:15px;">
                    ریمارکس پروڈکشن آفیسر: <span style="font-weight:normal;border-bottom:1px dashed #000;display:inline-block;width:75%;padding-right:10px;">${remarks || 'کوئی ریمارکس درج نہیں ہیں۔'}</span>
                </div>

                <div style="font-size:1.3rem;font-weight:bold;margin-top:20px;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:5px;">لیبارٹری ریمارکس (Lab Remarks)</div>
                <table class="main-table">
                    <thead>
                        <tr style="background:#f2f2f2;">
                            <th style="width:8%; text-align:center;">Sr. No</th>
                            <th style="width:12%; text-align:center;">حصہ</th>
                            <th style="width:64%; text-align:right; padding-right:12px;">ٹیسٹ کی تفصیل</th>
                            <th style="width:8%; text-align:center;">ہاں</th>
                            <th style="width:8%; text-align:center;">نہیں</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateLabRowsHTML(insp, renderTick)}
                    </tbody>
                </table>

                <div class="footer-block" style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 1.2rem; font-weight:bold;">
                    <div style="width: 30%; text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 40px;">دستخط پلانٹ آپریٹر</div>
                    <div style="width: 30%; text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 40px;">دستخط پروڈکشن آفیسر</div>
                    <div style="width: 30%; text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 40px;">دستخط پروڈکشن مینیجر</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Full screen view of the report
    let currentlyViewingLogId = null;
    window.viewSiloInspection = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return alert('Record not found.');
        currentlyViewingLogId = id;

        const insp = log.inspection || {};
        const sealNo = log.sealNo || '';
        const date = log.date || '';
        const siloNo = log.siloNumber ? log.siloNumber.replace('Silo ', '') : '';
        const material = log.material || '';
        const officer = log.supervisor || ''; // officer name (mapped to supervisor field)
        const operator = log.operator || '';  // operator name
        const shift = log.shift || 'A';
        const remarks = log.remarks || '';

        const renderTick = (val, expectTrue = true) => {
            if (expectTrue) {
                return val ? '<span style="color:#16a34a;font-family:Arial,sans-serif;font-size:1.3rem;">✔</span>' : '';
            } else {
                return !val ? '<span style="color:#dc2626;font-family:Arial,sans-serif;font-size:1.3rem;">✔</span>' : '';
            }
        };

        const container = document.getElementById('silo-view-report-content');
        container.innerHTML = `
            <div style="border: 2px solid #cbd5e1; padding: 2.5rem; border-radius: 8px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <!-- Header Info -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:3px double #cbd5e1; padding-bottom:1.25rem;">
                    <div style="font-size:1.25rem;font-weight:bold;">سیل نمبر: <span style="color:#2563eb;font-family:sans-serif;border-bottom:1px solid #94a3b8;padding:0 8px;">${sealNo}</span></div>
                    <div style="text-align:center;">
                        <h2 style="font-size:1.85rem; color:#1e3a8a; margin:0; font-weight:bold;">سائلو انسپکشن رپورٹ - سٹیل سائلوز (Steel Silo)</h2>
                        <span style="font-size:1.15rem;color:#475569;font-weight:600;">(فلنگ سے پہلے انسپکشن پرفارما)</span>
                    </div>
                    <div style="font-size:1.25rem;font-weight:bold;">تاریخ: <span style="border-bottom:1px solid #94a3b8;padding:0 8px;">${date}</span></div>
                </div>

                <!-- Meta Row -->
                <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 1.25rem; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:1.25rem; margin-bottom:2rem; font-size:1.15rem;">
                    <div><strong>سائلو نمبر:</strong> <span style="color:#2563eb;font-family:sans-serif;font-weight:bold;margin-right:5px;">${siloNo}</span></div>
                    <div><strong>مٹیریل:</strong> <span style="color:#1e293b;font-weight:bold;margin-right:5px;">${material}</span></div>
                    <div><strong>شفٹ:</strong> <span style="color:#1e293b;font-weight:bold;margin-right:5px;">${shift}</span></div>
                    <div><strong>آفیسر کا نام:</strong> <span style="color:#1e293b;font-weight:bold;margin-right:5px;">${officer}</span></div>
                    <div><strong>آپریٹر کا نام:</strong> <span style="color:#1e293b;font-weight:bold;margin-right:5px;">${operator}</span></div>
                </div>

                <!-- Main Checklist Table -->
                <table class="report-table" style="width:100%; border-collapse:collapse; margin-bottom:2rem; font-size:1.15rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#1e293b; font-weight:700;">
                            <th style="width:8%; border:1px solid #cbd5e1; padding:0.75rem; text-align:center;">Sr. No</th>
                            <th style="width:12%; border:1px solid #cbd5e1; padding:0.75rem; text-align:center;">حصہ</th>
                            <th style="width:64%; border:1px solid #cbd5e1; padding:0.75rem; text-align:right; padding-right:1rem;">نکات اور اہم چیک لسٹ (پروڈکشن ڈیپارٹمنٹ)</th>
                            <th style="width:8%; border:1px solid #cbd5e1; padding:0.75rem; text-align:center;">ہاں</th>
                            <th style="width:8%; border:1px solid #cbd5e1; padding:0.75rem; text-align:center;">نہیں</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateInspectionRowsHTML(insp, renderTick)}
                    </tbody>
                </table>

                <div style="font-size:1.2rem; margin-bottom:2rem; font-weight:bold; border-bottom:1px dashed #cbd5e1; padding-bottom:1.25rem;">
                    ریمارکس پروڈکشن آفیسر: <span style="font-weight:normal; color:#334155; padding-right:10px; border-bottom:1px solid #94a3b8; display:inline-block; width:70%;">${remarks || 'کوئی ریمارکس درج نہیں ہیں۔'}</span>
                </div>

                <!-- Lab Remarks Header -->
                <h3 style="font-size:1.4rem; color:#b91c1c; border-bottom:2px solid #fecaca; padding-bottom:0.5rem; margin-bottom:1.25rem; font-weight:bold;">لیبارٹری ریمارکس (Lab Remarks)</h3>
                <table class="report-table" style="width:100%; border-collapse:collapse; margin-bottom:2.5rem; font-size:1.15rem;">
                    <thead>
                        <tr style="background:#fef2f2; color:#991b1b; font-weight:700;">
                            <th style="width:8%; border:1px solid #fecaca; padding:0.75rem; text-align:center;">Sr. No</th>
                            <th style="width:12%; border:1px solid #fecaca; padding:0.75rem; text-align:center;">حصہ</th>
                            <th style="width:64%; border:1px solid #fecaca; padding:0.75rem; text-align:right; padding-right:1rem;">ٹیسٹ کی تفصیل</th>
                            <th style="width:8%; border:1px solid #fecaca; padding:0.75rem; text-align:center;">ہاں</th>
                            <th style="width:8%; border:1px solid #fecaca; padding:0.75rem; text-align:center;">نہیں</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateLabRowsHTML(insp, renderTick)}
                    </tbody>
                </table>

                <!-- Signatures -->
                <div style="display:flex; justify-content:space-between; margin-top:4rem; border-top:1px solid #cbd5e1; padding-top:2rem; font-size:1.2rem; font-weight:bold; color:#475569;">
                    <div style="text-align:center; width:30%; border-top:1px dashed #94a3b8; padding-top:0.75rem;">دستخط پلانٹ آپریٹر</div>
                    <div style="text-align:center; width:30%; border-top:1px dashed #94a3b8; padding-top:0.75rem;">دستخط پروڈکشن آفیسر</div>
                    <div style="text-align:center; width:30%; border-top:1px dashed #94a3b8; padding-top:0.75rem;">دستخط پروڈکشن مینیجر</div>
                </div>
            </div>
        `;

        document.getElementById('silo-history-modal').classList.remove('show');
        document.getElementById('silo-report-view-modal').classList.add('show');
    };

    const renderTableMarkup = (logsList) => {
        if (logsList.length === 0) {
            return `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
                    <div style="font-size:1.1rem;font-weight:600;">No records found.</div>
                </div>`;
        }

        let rows = '';
        [...logsList].reverse().forEach(log => {
            const hasInspection = log.inspection ? '✓ Yes' : '-';
            const printBtn = log.operation === 'Filling' ? `<button class="btn btn-primary" style="padding:0.2rem 0.4rem; font-size:0.75rem; background:#8b5cf6; border-color:#8b5cf6;" onclick="printSiloInspection(${log.id})">🖨️ Print</button>` : '';
            rows += `
                <tr style="border-bottom:1px solid var(--card-border);">
                    <td style="font-weight:600;">${log.date}</td>
                    <td>${log.shift || 'A'}</td>
                    <td style="font-weight:700;">${log.siloNumber}</td>
                    <td style="font-weight:700;color:${log.operation === 'Filling'?'#10b981':'#ef4444'};">${log.operation}</td>
                    <td>${log.material}</td>
                    <td>${log.moisture ? log.moisture + '%' : '-'}</td>
                    <td style="font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                    <td>${log.temperature ? log.temperature + '°C' : '-'}</td>
                    <td>${log.operator || '-'}</td>
                    <td>${log.sealNo || '-'}</td>
                    <td>${hasInspection}</td>
                    <td class="no-print" style="display:flex;gap:0.25rem;">
                        <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editSiloLog(${log.id})">✏️ Edit</button>
                        ${printBtn}
                        <button class="btn btn-danger" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="deleteSiloLog(${log.id})">🗑 Del</button>
                    </td>
                </tr>
            `;
        });

        return `
            <div class="table-responsive">
                <table class="report-table" style="font-size:0.9rem;width:100%;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#334155; font-weight:700;">
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Silo No</th>
                            <th>Operation</th>
                            <th>Material</th>
                            <th>Moisture %</th>
                            <th>Net Qty (T)</th>
                            <th>Temp (°C)</th>
                            <th>Performed By</th>
                            <th>Seal No</th>
                            <th>Inspected</th>
                            <th class="no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderSiloPerformaDashboard = () => {
        const grid = document.getElementById('silo-performas-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 1; i <= 16; i++) {
            const siloName = `Silo ${i}`;
            
            const fillingsCount = siloLogs.filter(l => l.siloNumber === siloName && l.operation === 'Filling').length;
            const dischargeCount = siloLogs.filter(l => l.siloNumber === siloName && l.operation === 'Discharging').length;

            const card = document.createElement('div');
            card.style = `
                background: #ffffff;
                border: 1px solid var(--card-border);
                border-radius: 10px;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            `;
            card.className = 'silo-performa-card';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:0.5rem;margin-bottom:0.25rem;">
                    <span style="font-weight:800;font-size:1.1rem;color:#1e293b;">🏭 Silo ${i}</span>
                    <span style="font-size:0.7rem;background:#f1f5f9;color:#475569;padding:0.15rem 0.4rem;border-radius:3px;font-weight:600;">Status: Active</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn btn-secondary" onclick="window.openSiloHistory('Silo ${i}', 'Filling')" style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.75rem;font-size:0.8rem;background:#ecfdf5;border-color:#a7f3d0;color:#065f46;font-weight:700;">
                        <span>📥 Filling Performa</span>
                        <span style="background:#10b981;color:#fff;font-size:0.7rem;padding:0.1rem 0.35rem;border-radius:10px;">${fillingsCount}</span>
                    </button>
                    <button class="btn btn-secondary" onclick="window.openSiloHistory('Silo ${i}', 'Discharging')" style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.75rem;font-size:0.8rem;background:#fef2f2;border-color:#fecaca;color:#991b1b;font-weight:700;">
                        <span>📤 Discharge Performa</span>
                        <span style="background:#ef4444;color:#fff;font-size:0.7rem;padding:0.1rem 0.35rem;border-radius:10px;">${dischargeCount}</span>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        }
    };

    window.openSiloHistory = (siloNum, operationType) => {
        currentHistorySilo = siloNum;
        currentHistoryOperation = operationType;

        const modal = document.getElementById('silo-history-modal');
        const titleEl = document.getElementById('sh-modal-title');
        const subtitleEl = document.getElementById('sh-modal-subtitle');
        const tableContainer = document.getElementById('sh-table-container');

        if (!modal || !titleEl || !tableContainer) return;

        titleEl.textContent = `${siloNum} - ${operationType === 'Filling' ? 'Filling (Stock In)' : 'Discharge (Stock Out)'} Performa History`;
        subtitleEl.textContent = `List of recorded entries for ${siloNum}`;

        renderHistoryTable();
        modal.classList.add('show');
    };

    window.approveSiloLog = async (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return;
        if (!log.inspection) log.inspection = {};
        log.inspection.managerApproved = true;
        saveSiloLogs();
        renderHistoryTable();
        renderSiloPerformaDashboard();

        initSupabase();
        if (sbClient) {
            try {
                const dbRecord = {
                    id: log.id,
                    date: log.date.includes('-') && log.date.split('-').length === 3 ? `${log.date.split('-')[2]}-${log.date.split('-')[1] === 'Jan'?'01':log.date.split('-')[1] === 'Feb'?'02':log.date.split('-')[1] === 'Mar'?'03':log.date.split('-')[1] === 'Apr'?'04':log.date.split('-')[1] === 'May'?'05':log.date.split('-')[1] === 'Jun'?'06':log.date.split('-')[1] === 'Jul'?'07':log.date.split('-')[1] === 'Aug'?'08':log.date.split('-')[1] === 'Sep'?'09':log.date.split('-')[1] === 'Oct'?'10':log.date.split('-')[1] === 'Nov'?'11':'12'}-${log.date.split('-')[0].padStart(2,'0')}` : new Date().toISOString().split('T')[0],
                    shift: log.shift,
                    silo_number: log.siloNumber,
                    operation_type: log.operation,
                    material_name: log.material,
                    moisture: log.moisture,
                    net_qty: log.netQty,
                    temperature: log.temperature,
                    performed_by: log.operator,
                    remarks: log.remarks,
                    seal_no: log.sealNo,
                    supervisor: log.supervisor,
                    inspection: log.inspection
                };
                const { error } = await sbClient.from('silo_logs').upsert([dbRecord]);
                if (error) throw error;
                if (window.showToast) window.showToast('✓ Approved in Supabase');
            } catch (err) {
                console.error('Failed to approve in Supabase:', err);
            }
        }
    };

    const renderHistoryTable = () => {
        const tableContainer = document.getElementById('sh-table-container');
        if (!tableContainer) return;

        const filteredLogs = siloLogs.filter(l => l.siloNumber === currentHistorySilo && l.operation === currentHistoryOperation);

        if (filteredLogs.length === 0) {
            tableContainer.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
                    <div style="font-size:1.1rem;font-weight:600;">No performa logs found for ${currentHistorySilo} (${currentHistoryOperation}).</div>
                    <div style="font-size:0.85rem;margin-top:0.25rem;">Click "➕ Add Log Entry" to create a new record.</div>
                </div>`;
            return;
        }

        let headersMarkup = '';
        let rows = '';

        if (currentHistoryOperation === 'Filling') {
            headersMarkup = `
                <tr style="background:#e2e8f0; color:#334155; font-weight:700; text-align:left;">
                    <th style="padding:0.5rem;">Date</th>
                    <th style="padding:0.5rem;">Shift</th>
                    <th style="padding:0.5rem;">Material</th>
                    <th style="padding:0.5rem;">Officer Name</th>
                    <th style="padding:0.5rem;">Operator Name</th>
                    <th style="padding:0.5rem;">Inspected</th>
                    <th style="padding:0.5rem;">Manager Approval</th>
                    <th class="no-print" style="padding:0.5rem;">Actions</th>
                </tr>
            `;

            [...filteredLogs].reverse().forEach(log => {
                const hasInspection = log.inspection ? '✓ Yes' : '-';
                const viewBtn = `<button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#10b981;border-color:#10b981;color:#fff;" onclick="viewSiloInspection(${log.id})">👁️ View</button>`;
                const printBtn = `<button class="btn btn-primary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#8b5cf6;border-color:#8b5cf6;" onclick="printSiloInspection(${log.id})">🖨️ Print</button>`;

                const isApproved = log.inspection && log.inspection.managerApproved;
                const approvalCell = isApproved 
                    ? `<span style="color:#10b981;font-weight:800;font-size:0.8rem;">🟢 Approved</span>`
                    : `<button class="btn" style="padding:0.15rem 0.4rem; font-size:0.72rem; background:#f59e0b; border:none; color:#fff; border-radius:4px; font-weight:700; cursor:pointer;" onclick="approveSiloLog(${log.id})">⚡ Approve</button>`;

                rows += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="font-weight:600;padding:0.5rem;">${log.date}</td>
                        <td style="padding:0.5rem;">${log.shift || 'A'}</td>
                        <td style="padding:0.5rem;font-weight:600;">${log.material}</td>
                        <td style="padding:0.5rem;">${log.supervisor || '-'}</td> <!-- stores officer name -->
                        <td style="padding:0.5rem;">${log.operator || '-'}</td>  <!-- stores operator name -->
                        <td style="padding:0.5rem;font-weight:700;color:#4f46e5;">${hasInspection}</td>
                        <td style="padding:0.5rem;vertical-align:middle;">${approvalCell}</td>
                        <td class="no-print" style="padding:0.5rem;display:flex;gap:0.2rem;">
                            <button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;" onclick="window.editSiloLog(${log.id})">✏️ Edit</button>
                            ${viewBtn}
                            ${printBtn}
                            <button class="btn btn-danger" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#ef4444;" onclick="window.deleteSiloLog(${log.id})">🗑 Del</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            headersMarkup = `
                <tr style="background:#e2e8f0; color:#334155; font-weight:700; text-align:left;">
                    <th style="padding:0.5rem;">Date</th>
                    <th style="padding:0.5rem;">Shift</th>
                    <th style="padding:0.5rem;">Material</th>
                    <th style="padding:0.5rem;">Moisture</th>
                    <th style="padding:0.5rem;">Net Qty (T)</th>
                    <th style="padding:0.5rem;">Temp</th>
                    <th style="padding:0.5rem;">Performed By</th>
                    <th class="no-print" style="padding:0.5rem;">Actions</th>
                </tr>
            `;

            [...filteredLogs].reverse().forEach(log => {
                rows += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="font-weight:600;padding:0.5rem;">${log.date}</td>
                        <td style="padding:0.5rem;">${log.shift || 'A'}</td>
                        <td style="padding:0.5rem;font-weight:600;">${log.material}</td>
                        <td style="padding:0.5rem;font-weight:700;">${log.moisture ? log.moisture + '%' : '-'}</td>
                        <td style="padding:0.5rem;font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                        <td style="padding:0.5rem;">${log.temperature ? log.temperature + '°C' : '-'}</td>
                        <td style="padding:0.5rem;">${log.operator || '-'}</td>
                        <td class="no-print" style="padding:0.5rem;display:flex;gap:0.2rem;">
                            <button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;" onclick="window.editSiloLog(${log.id})">✏️ Edit</button>
                            <button class="btn btn-danger" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#ef4444;" onclick="window.deleteSiloLog(${log.id})">🗑 Del</button>
                        </td>
                    </tr>
                `;
            });
        }

        tableContainer.innerHTML = `
            <table class="report-table" style="font-size:0.8rem;width:100%;border-collapse:collapse;background:#ffffff;">
                <thead>
                    ${headersMarkup}
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    window.openSiloLogModal = (operationType, siloNum) => {
        activeLogId = null;
        document.getElementById('silo-log-modal-title').textContent = `New Silo ${siloNum} - ${operationType} Performa`;
        const today = new Date();
        document.getElementById('sl-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
        document.getElementById('sl-modal-shift').value = 'A';
        
        document.getElementById('sl-modal-silo').value = siloNum || 'Silo 1';
        
        const operationSelect = document.getElementById('sl-modal-operation');
        operationSelect.value = operationType;

        document.getElementById('sl-modal-seal-no').value = '';
        document.getElementById('sl-modal-officer').value = 'M. Zubair';
        document.getElementById('sl-modal-operator').value = 'Zubair';

        // Reset radio buttons to default "no"
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`sl-chk-top${i}-no`).checked = true;
            document.getElementById(`sl-chk-top${i}-yes`).checked = false;
        }
        for (let i = 1; i <= 12; i++) {
            document.getElementById(`sl-chk-bot${i}-no`).checked = true;
            document.getElementById(`sl-chk-bot${i}-yes`).checked = false;
        }
        for (let i = 1; i <= 2; i++) {
            document.getElementById(`sl-chk-lab${i}-no`).checked = true;
            document.getElementById(`sl-chk-lab${i}-yes`).checked = false;
        }

        const modalCard = document.getElementById('silo-log-modal-card');
        const sealGroup = document.getElementById('fg-seal-no');
        const officerGroup = document.getElementById('fg-officer');
        const inspectionSection = document.getElementById('sl-modal-inspection-section-direct');
        const hiddenFieldsWrapper = document.getElementById('sl-modal-hidden-fields');

        if (operationType === 'Filling') {
            if (modalCard) modalCard.style.maxWidth = '900px';
            if (sealGroup) sealGroup.style.display = 'block';
            if (officerGroup) officerGroup.style.display = 'block';
            if (inspectionSection) inspectionSection.style.display = 'block';
            if (hiddenFieldsWrapper) hiddenFieldsWrapper.style.display = 'none';
        } else {
            if (modalCard) modalCard.style.maxWidth = '550px';
            if (sealGroup) sealGroup.style.display = 'none';
            if (officerGroup) officerGroup.style.display = 'none';
            if (inspectionSection) inspectionSection.style.display = 'none';
            if (hiddenFieldsWrapper) hiddenFieldsWrapper.style.display = 'grid';
        }

        document.getElementById('sl-modal-material').value = 'Maize';
        document.getElementById('sl-modal-moisture').value = '';
        document.getElementById('sl-modal-net-wt').value = '';
        document.getElementById('sl-modal-temp').value = '';
        document.getElementById('sl-modal-remarks').value = '';

        document.getElementById('silo-log-modal').classList.add('show');
    };

    window.editSiloLog = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return;
        activeLogId = id;

        document.getElementById('silo-log-modal-title').textContent = `Edit Silo ${log.siloNumber} - ${log.operation} Performa`;
        document.getElementById('sl-modal-date').value = log.date || '';
        document.getElementById('sl-modal-shift').value = log.shift || 'A';
        document.getElementById('sl-modal-silo').value = log.siloNumber || 'Silo 1';
        
        const operationSelect = document.getElementById('sl-modal-operation');
        operationSelect.value = log.operation || 'Filling';

        const modalCard = document.getElementById('silo-log-modal-card');
        const sealGroup = document.getElementById('fg-seal-no');
        const officerGroup = document.getElementById('fg-officer');
        const inspectionSection = document.getElementById('sl-modal-inspection-section-direct');
        const hiddenFieldsWrapper = document.getElementById('sl-modal-hidden-fields');

        if (log.operation === 'Filling') {
            if (modalCard) modalCard.style.maxWidth = '900px';
            if (sealGroup) sealGroup.style.display = 'block';
            if (officerGroup) officerGroup.style.display = 'block';
            if (inspectionSection) inspectionSection.style.display = 'block';
            if (hiddenFieldsWrapper) hiddenFieldsWrapper.style.display = 'none';

            document.getElementById('sl-modal-seal-no').value = log.sealNo || '';
            document.getElementById('sl-modal-officer').value = log.supervisor || 'M. Zubair'; // mapped supervisor field stores Officer Name

            const insp = log.inspection || {};
            for (let i = 1; i <= 4; i++) {
                const checked = !!insp[`top${i}`];
                document.getElementById(`sl-chk-top${i}-yes`).checked = checked;
                document.getElementById(`sl-chk-top${i}-no`).checked = !checked;
            }
            for (let i = 1; i <= 12; i++) {
                const checked = !!insp[`bot${i}`];
                document.getElementById(`sl-chk-bot${i}-yes`).checked = checked;
                document.getElementById(`sl-chk-bot${i}-no`).checked = !checked;
            }
            for (let i = 1; i <= 2; i++) {
                const checked = !!insp[`lab${i}`];
                document.getElementById(`sl-chk-lab${i}-yes`).checked = checked;
                document.getElementById(`sl-chk-lab${i}-no`).checked = !checked;
            }
        } else {
            if (modalCard) modalCard.style.maxWidth = '550px';
            if (sealGroup) sealGroup.style.display = 'none';
            if (officerGroup) officerGroup.style.display = 'none';
            if (inspectionSection) inspectionSection.style.display = 'none';
            if (hiddenFieldsWrapper) hiddenFieldsWrapper.style.display = 'grid';
        }

        document.getElementById('sl-modal-material').value = log.material || '';
        document.getElementById('sl-modal-moisture').value = log.moisture !== undefined ? log.moisture : '';
        document.getElementById('sl-modal-net-wt').value = log.netQty !== undefined ? log.netQty : '';
        document.getElementById('sl-modal-temp').value = log.temperature !== undefined ? log.temperature : '';
        document.getElementById('sl-modal-operator').value = log.operator || 'Zubair';
        document.getElementById('sl-modal-remarks').value = log.remarks || '';

        document.getElementById('silo-history-modal').classList.remove('show');
        document.getElementById('silo-log-modal').classList.add('show');
    };

    window.deleteSiloLog = async (id) => {
        if (!confirm('Delete this Silo Performa record?')) return;
        siloLogs = siloLogs.filter(x => x.id !== id);
        saveSiloLogs();
        renderHistoryTable();
        renderSiloPerformaDashboard();

        initSupabase();
        if (sbClient) {
            try {
                const { error } = await sbClient.from('silo_logs').delete().eq('id', id);
                if (error) throw error;
                if (window.showToast) window.showToast('✓ Deleted from Supabase');
            } catch (err) {
                console.error('Failed to delete from Supabase:', err);
            }
        }
    };

    const initSiloEvents = () => {
        const modal = document.getElementById('silo-log-modal');
        const btnClose = document.getElementById('silo-log-modal-close');
        const btnCancel = document.getElementById('btn-cancel-silo-log');
        const btnSave = document.getElementById('btn-save-silo-log');

        const navPerforma = document.getElementById('nav-silo-performa');

        const historyModal = document.getElementById('silo-history-modal');
        const historyClose = document.getElementById('sh-modal-close');
        const historyAdd = document.getElementById('sh-btn-add-entry');

        // View Report Modal hooks
        const viewModal = document.getElementById('silo-report-view-modal');
        const viewClose = document.getElementById('silo-report-view-close');
        const viewCloseBtn = document.getElementById('silo-report-view-close-btn');
        const viewPrintBtn = document.getElementById('silo-report-view-print-btn');

        if (viewClose) {
            viewClose.addEventListener('click', () => {
                viewModal.classList.remove('show');
                if (currentHistorySilo && currentHistoryOperation) {
                    historyModal.classList.add('show');
                }
            });
        }
        if (viewCloseBtn) {
            viewCloseBtn.addEventListener('click', () => {
                viewModal.classList.remove('show');
                if (currentHistorySilo && currentHistoryOperation) {
                    historyModal.classList.add('show');
                }
            });
        }
        if (viewPrintBtn) {
            viewPrintBtn.addEventListener('click', () => {
                if (currentlyViewingLogId) {
                    window.printSiloInspection(currentlyViewingLogId);
                }
            });
        }

        if (navPerforma) {
            navPerforma.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navPerforma.classList.add('active');
                
                document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
                document.getElementById('view-silo-performa').style.display = 'block';
                
                renderSiloPerformaDashboard();
            });
        }

        if (historyClose) {
            historyClose.addEventListener('click', () => {
                historyModal.classList.remove('show');
                renderSiloPerformaDashboard();
            });
        }

        if (historyAdd) {
            historyAdd.addEventListener('click', () => {
                window.openSiloLogModal(currentHistoryOperation, currentHistorySilo);
            });
        }

        const closeModal = () => {
            modal.classList.remove('show');
            if (currentHistorySilo && currentHistoryOperation) {
                renderHistoryTable();
                historyModal.classList.add('show');
            }
        };
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const date = document.getElementById('sl-modal-date').value.trim();
                const shift = document.getElementById('sl-modal-shift').value;
                const siloNumber = document.getElementById('sl-modal-silo').value;
                const operation = document.getElementById('sl-modal-operation').value;
                const material = document.getElementById('sl-modal-material').value.trim();
                
                // Fields that may be hidden: set default if hidden
                const moisture = (operation === 'Filling') ? 0 : (parseFloat(document.getElementById('sl-modal-moisture').value) || 0);
                const netQty = (operation === 'Filling') ? 0 : (parseFloat(document.getElementById('sl-modal-net-wt').value) || 0);
                const temperature = (operation === 'Filling') ? 0 : (parseFloat(document.getElementById('sl-modal-temp').value) || 0);
                const operator = document.getElementById('sl-modal-operator').value; // operator select value
                
                const remarks = document.getElementById('sl-modal-remarks').value.trim();

                if (!date) return alert('Please enter Date.');
                if (!material) return alert('Please enter Material Name.');

                let sealNo = '';
                let supervisor = ''; // stores Officer Name
                let inspection = null;

                if (operation === 'Filling') {
                    sealNo = document.getElementById('sl-modal-seal-no').value.trim();
                    supervisor = document.getElementById('sl-modal-officer').value; // Officer Name select value mapped to supervisor column
                    
                    // Maintain existing approval state if editing
                    let prevApproval = false;
                    if (activeLogId) {
                        const existing = siloLogs.find(x => x.id === activeLogId);
                        if (existing && existing.inspection && existing.inspection.managerApproved) {
                            prevApproval = true;
                        }
                    }

                    inspection = {
                        top1: document.getElementById('sl-chk-top1-yes').checked,
                        top2: document.getElementById('sl-chk-top2-yes').checked,
                        top3: document.getElementById('sl-chk-top3-yes').checked,
                        top4: document.getElementById('sl-chk-top4-yes').checked,
                        bot1: document.getElementById('sl-chk-bot1-yes').checked,
                        bot2: document.getElementById('sl-chk-bot2-yes').checked,
                        bot3: document.getElementById('sl-chk-bot3-yes').checked,
                        bot4: document.getElementById('sl-chk-bot4-yes').checked,
                        bot5: document.getElementById('sl-chk-bot5-yes').checked,
                        bot6: document.getElementById('sl-chk-bot6-yes').checked,
                        bot7: document.getElementById('sl-chk-bot7-yes').checked,
                        bot8: document.getElementById('sl-chk-bot8-yes').checked,
                        bot9: document.getElementById('sl-chk-bot9-yes').checked,
                        bot10: document.getElementById('sl-chk-bot10-yes').checked,
                        bot11: document.getElementById('sl-chk-bot11-yes').checked,
                        bot12: document.getElementById('sl-chk-bot12-yes').checked,
                        lab1: document.getElementById('sl-chk-lab1-yes').checked,
                        lab2: document.getElementById('sl-chk-lab2-yes').checked,
                        managerApproved: prevApproval
                    };
                }

                const log = {
                    id: activeLogId || Date.now(),
                    date, shift, siloNumber, operation, material, moisture,
                    netQty, temperature, operator, remarks,
                    sealNo, supervisor, inspection
                };

                if (activeLogId) {
                    const idx = siloLogs.findIndex(x => x.id === activeLogId);
                    if (idx !== -1) siloLogs[idx] = log;
                } else {
                    siloLogs.push(log);
                }

                saveSiloLogs();
                closeModal();
                renderSiloPerformaDashboard();

                initSupabase();
                if (sbClient) {
                    try {
                        const dbRecord = {
                            id: log.id,
                            date: date.includes('-') && date.split('-').length === 3 ? `${date.split('-')[2]}-${date.split('-')[1] === 'Jan'?'01':date.split('-')[1] === 'Feb'?'02':date.split('-')[1] === 'Mar'?'03':date.split('-')[1] === 'Apr'?'04':date.split('-')[1] === 'May'?'05':date.split('-')[1] === 'Jun'?'06':date.split('-')[1] === 'Jul'?'07':date.split('-')[1] === 'Aug'?'08':date.split('-')[1] === 'Sep'?'09':date.split('-')[1] === 'Oct'?'10':date.split('-')[1] === 'Nov'?'11':'12'}-${date.split('-')[0].padStart(2,'0')}` : new Date().toISOString().split('T')[0],
                            shift: log.shift,
                            silo_number: log.siloNumber,
                            operation_type: log.operation,
                            material_name: log.material,
                            moisture: log.moisture,
                            net_qty: log.netQty,
                            temperature: log.temperature,
                            performed_by: log.operator,
                            remarks: log.remarks,
                            seal_no: log.sealNo,
                            supervisor: log.supervisor,
                            inspection: log.inspection
                        };

                        const { error } = await sbClient.from('silo_logs').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert(`✓ Silo ${log.operation} Performa saved to Supabase successfully!`);
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        if (window.showToast) window.showToast('✗ Supabase Save Error');
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally');
                    alert('✓ Saved locally.');
                }
            });
        }
    };

    const syncWithSupabase = async () => {
        initSupabase();
        if (sbClient) {
            try {
                const { data, error } = await sbClient.from('silo_logs').select('*').order('date', { ascending: false });
                if (!error && data) {
                    siloLogs = data.map(r => {
                        const parts = r.date.split('-');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const localeDate = parts.length === 3 ? `${parseInt(parts[2])}-${months[parseInt(parts[1]) - 1]}-${parts[0]}` : r.date;
                        return {
                            id: r.id,
                            date: localeDate,
                            shift: r.shift,
                            siloNumber: r.silo_number,
                            operation: r.operation_type,
                            material: r.material_name,
                            moisture: r.moisture || 0,
                            netQty: r.net_qty || 0,
                            temperature: r.temperature || 0,
                            operator: r.performed_by,
                            remarks: r.remarks,
                            sealNo: r.seal_no,
                            supervisor: r.supervisor,
                            inspection: r.inspection
                        };
                    });
                    saveSiloLogs();
                }
            } catch (err) {
                console.error('Failed to sync silo logs with Supabase:', err);
            }
        }
        renderSiloPerformaDashboard();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            initSiloEvents();
            await syncWithSupabase();
        });
    } else {
        initSiloEvents();
        syncWithSupabase();
    }

} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('silo_performa.js', err);
    } else {
        console.error('silo_performa.js error:', err);
    }
}
})();
