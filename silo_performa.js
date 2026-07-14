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
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl') || (window.env && window.env.SUPABASE_URL) || '';
        const sbKey = localStorage.getItem('fmpr_supabaseKey') || (window.env && window.env.SUPABASE_KEY) || '';
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

    const formatDateToDb = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            const day = parts[0].padStart(2, '0');
            const monthStr = parts[1].toLowerCase().replace('.', '');
            const year = parts[2];
            const months = {
                jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
            };
            const month = months[monthStr.substring(0, 3)] || '12';
            return `${year}-${month}-${day}`;
        }
        return new Date().toISOString().split('T')[0];
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
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو ٹاپ کی ایکسٹرا ڈسٹ کو صاف کیا گیا ہے اور کھلی (Open) ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">2</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">لیڈر (سیڑھی) کے قریب کسی قسم کی کوئی لوز جالی تو نہیں ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top2, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">3</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">تمام ٹاپ کورز کے اندر کی سائیڈ، ڈسچارج اور ایلیویٹر کے شُوٹ والی جگہوں کو صاف کیا گیا ہے، تاکہ پرانا میٹریل اس میں موجود نہیں ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top3, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top3, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">4</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">فلنگ (Filling) سے پہلے ٹاپ کے سنٹر والے گیٹ کو آپریٹ کر کے چیک کیا ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top4, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.top4, false)}</td>
            </tr>

            <!-- Silo Bottom -->
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">5</td>
                <td rowspan="12" style="text-align:center;font-weight:bold;vertical-align:middle;border:1px solid #000;background:#f8fafc;">Silo Bottom</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو میں کوئی پرانا میٹریل ایکسٹرا موجود نہیں ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">6</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو فین کی (Aeration Ducts) ڈکٹس اور ڈسچارج کیسٹس کو صاف کیا گیا ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot2, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">7</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود تمام (Ventilation Trunches) کو صاف کیا گیا ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot3, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot3, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">8</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود تمام دراز شیٹس (Ventilation Trunch Sheets) بالکل صاف اور فٹ کیا گیا ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot4, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot4, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">9</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر موجود سوئپر کور ٹھیک ہے اور اپنی جگہ (درمیان والا) پر فٹ ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot5, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot5, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">10</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے اندر فرش کے ساتھ شیٹیں والا گولا ٹھیک ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot6, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot6, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">11</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے باہر شیٹیں والا گولا ٹھیک ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot7, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot7, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">12</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے تمام ڈسچارجنگ کیسٹس کو مکمل بند کیا گیا ہے۔</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot8, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot8, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">13</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کے تمام ڈسچارج گیٹس لاک (SEAL) ہیں</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot9, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot9, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">14</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو کی مین (Entrance) ونڈو کو اچھی طرح سے بند کیا گیا ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot10, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot10, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">15</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سردیوں میں گرین کا موئسچر 16% سے زیادہ سائلو میں نہیں ڈالنا ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot11, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot11, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">16</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">گرمیوں میں گرین کا موئسچر 14% سے زیادہ سائلو میں نہیں ڈالنا ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot12, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.bot12, false)}</td>
            </tr>
        `;
    };

    const generateLabRowsHTML = (insp, renderTickFn) => {
        return `
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">1</td>
                <td rowspan="2" style="text-align:center;font-weight:bold;border:1px solid #000;background:#f8fafc;">Lab</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">سائلو میں کوئی پرانا میٹریل ایکسٹرا موجود نہیں ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab1, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab1, false)}</td>
            </tr>
            <tr>
                <td style="text-align:center;font-weight:bold;border:1px solid #000;">2</td>
                <td style="border:1px solid #000;padding:8px 12px;text-align:right;">کیا سائلو فیومیگیٹ کرنے کی ضرورت ہے</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab2, true)}</td>
                <td style="text-align:center;border:1px solid #000;font-weight:bold;width:80px;">${renderTickFn(insp.lab2, false)}</td>
            </tr>
        `;
    };

    function getSiloTitleUrdu(siloNoStr) {
        const match = String(siloNoStr).match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num >= 1 && num <= 8) return "سائلو انسپکشن رپورٹ - کنکریٹ سائلوز (Concrete Silo)";
        }
        return "سائلو انسپکشن رپورٹ - سٹیل سائلوز (Steel Silo)";
    }
    
    function getSiloShortTitleUrdu(siloNoStr) {
        const match = String(siloNoStr).match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num >= 1 && num <= 8) return "سائلو انسپکشن رپورٹ (Concrete Silo)";
        }
        return "سائلو انسپکشن رپورٹ (Steel Silo)";
    }

    function getSiloModalInspectionTitle(siloNoStr) {
        const match = String(siloNoStr).match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num >= 1 && num <= 8) return "سائلو انسپکشن رپورٹ (Concrete Silo) - فلنگ سے پہلے";
        }
        return "سائلو انسپکشن رپورٹ (Steel Silo) - فلنگ سے پہلے";
    }

    // ─── Helper: generate beautiful print HTML ──────────────────────────────
    const buildSiloReportHTML = (log) => {
        const insp = log.inspection || {};
        const sealNo    = log.sealNo      || '';
        const date      = log.date        || '';
        const siloNo    = log.siloNumber  ? log.siloNumber.replace('Silo ', '') : '';
        const material  = log.material    || '';
        const officer   = log.supervisor  || '';
        const operator  = log.operator    || '';
        const shift     = log.shift       || 'A';
        const remarksProd = log.remarksProd || log.remarks || '';
        const remarksLab  = log.remarksLab  || '';
        const siloType  = (parseInt(siloNo) >= 1 && parseInt(siloNo) <= 8) ? 'کنکریٹ سائلوز (Concrete Silo)' : 'سٹیل سائلوز (Steel Silo)';

        const statusIcon = (val) => val
            ? '<span style="font-family:Arial,sans-serif;font-size:1.4rem;color:#16a34a;font-weight:bold;">✔</span>'
            : '<span style="font-family:Arial,sans-serif;font-size:1.4rem;color:#dc2626;font-weight:bold;">✘</span>';

        const row = (sr, desc, yesVal, noVal) => {
            // Determine actual status based on yesVal/noVal logic from original
            const isPassed = (noVal !== undefined) ? yesVal : yesVal;
            return `
            <tr class="urdu-text">
                <td style="text-align:center;border:1px solid #000;padding:5px 3px;font-family:Arial,sans-serif;font-size:1.1rem;font-weight:bold;">${sr}</td>
                <td class="urdu-text" style="border:1px solid #000;padding:8px 12px;text-align:right;font-size:1.25rem;line-height:1.8;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">${desc}</td>
                <td style="text-align:center;border:1px solid #000;padding:5px 3px;">${statusIcon(isPassed)}</td>
            </tr>`;
        };

        return `
        <div class="urdu-text" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Urdu Typesetting',serif;direction:rtl;text-align:right;padding:10px 32px 28px 32px;background:#fff;color:#000;max-width:820px;margin:0 auto;line-height:1.8;">

            <!-- Header -->
            <div style="border:2px solid #000;text-align:center;margin-bottom:20px;direction:ltr;background:#f8fafc;padding:16px 16px;">
                <div style="font-size:2.2rem;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;margin-bottom:2px;color:#0f172a;">سائلو انسپکشن رپورٹ</div>
                <div style="font-size:1.6rem;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;color:#334155;">(فلنگ سے پہلے)</div>
            </div>

            <!-- META INFO TABLE -->
            <table style="width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:0;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;table-layout:fixed;">
                <tr style="background:#f1f5f9;">
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;width:33.33%;"><strong>تاریخ:</strong> <span style="font-family:Arial,sans-serif;margin-right:8px;direction:ltr;display:inline-block;font-size:1.15rem;font-weight:bold;">${date}</span></td>
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;width:33.33%;"><strong>آفیسر کا نام:</strong> <span style="margin-right:8px;font-size:1.2rem;">${officer}</span></td>
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;width:33.33%;"><strong>آپریٹر کا نام:</strong> <span style="margin-right:8px;font-size:1.2rem;">${operator}</span></td>
                </tr>
            </table>
            <table style="width:100%;border-collapse:collapse;margin-top:0;margin-bottom:20px;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;table-layout:fixed;">
                <tr style="background:#f1f5f9;">
                    <td style="border:1px solid #000;border-top:none;padding:10px 14px;font-size:1.3rem;text-align:right;width:25%;"><strong>سائلو نمبر:</strong> <span style="font-family:Arial,sans-serif;font-weight:bold;margin-right:8px;font-size:1.15rem;">${siloNo}</span></td>
                    <td style="border:1px solid #000;border-top:none;padding:10px 14px;font-size:1.3rem;text-align:right;width:25%;"><strong>شفٹ:</strong> <span style="font-family:Arial,sans-serif;font-weight:bold;margin-right:8px;font-size:1.15rem;">${shift}</span></td>
                    <td style="border:1px solid #000;border-top:none;padding:10px 14px;font-size:1.3rem;text-align:right;width:25%;"><strong>میٹریل:</strong> <span style="margin-right:8px;font-size:1.2rem;">${material}</span></td>
                    <td style="border:1px solid #000;border-top:none;padding:10px 14px;font-size:1.3rem;text-align:right;width:25%;direction:ltr;text-align:left;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <strong style="font-family:Arial,sans-serif;font-size:1.1rem;">Seal #:</strong>
                            <span style="font-family:Arial,sans-serif;font-size:1.15rem;font-weight:bold;">${(sealNo || '').toString().split(',').map(s=>s.trim()).filter(s => s !== '').join(', ') || '-'}</span>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- COLUMN HEADER -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
                <thead>
                    <tr style="background:#e2e8f0;font-weight:bold;">
                        <th style="border:1px solid #000;padding:10px 4px;text-align:center;width:10%;font-size:1.15rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">نمبر</th>
                        <th style="border:1px solid #000;padding:10px 10px;text-align:center;font-size:1.25rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">مضمون (وجہ چیک لسٹ کی اہمیت اور ہدایت)</th>
                        <th style="border:1px solid #000;padding:10px 4px;text-align:center;width:15%;font-size:1.15rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">سٹیٹس</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- ── SILO TOP (4 rows) ── -->
                    <!-- section label row for Silo Top -->
                    <tr><td colspan="3" style="background:#dbeafe;border:1px solid #000;padding:6px 10px;text-align:center;font-size:1.2rem;font-weight:bold;color:#1e40af;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">▼ سائلو ٹاپ (Silo Top) — نیچے والے 4 نکات</td></tr>
                    ${row(1, 'سائلو ٹاپ کی ایکسٹرا ڈسٹ کو صاف کیا گیا ہے اور کھلی (Open) ہے۔', insp.top1, !insp.top1)}
                    ${row(2, 'لیڈر (سیڑھی) کے قریب کسی قسم کی کوئی لوز جالی تو نہیں ہے۔', insp.top2, !insp.top2)}
                    ${row(3, 'تمام ٹاپ کورز کے اندر کی سائیڈ، ڈسچارج اور ایلیویٹر کے شُوٹ والی جگہوں کو صاف کیا گیا ہے، تاکہ پرانا میٹریل اس میں موجود نہ ہو۔', insp.top3, !insp.top3)}
                    ${row(4, 'فلنگ (Filling) سے پہلے ٹاپ کے سنٹر والے گیٹ کو آپریٹ کر کے چیک کیا ہے۔', insp.top4, !insp.top4)}

                    <!-- ── SILO BOTTOM (12 rows) ── -->
                    <!-- section label row for Silo Bottom -->
                    <tr><td colspan="3" style="background:#dcfce7;border:1px solid #000;padding:6px 10px;text-align:center;font-size:1.2rem;font-weight:bold;color:#14532d;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">▼ سائلو باٹم (Silo Bottom) — نیچے والے 12 نکات</td></tr>
                    ${row(5,  'سائلو میں کوئی پرانا میٹریل ایکسٹرا موجود نہیں ہے۔', insp.bot1, !insp.bot1)}
                    ${row(6,  'سائلو فین کی (Aeration Ducts) ڈکٹس اور ڈسچارج کیسٹس کو صاف کیا گیا ہے۔', insp.bot2, !insp.bot2)}
                    ${row(7,  'سائلو کے اندر موجود تمام (Ventilation Trunches) کو صاف کیا گیا ہے۔', insp.bot3, !insp.bot3)}
                    ${row(8,  'سائلو کے اندر موجود تمام دراز شیٹس (Ventilation Trunch Sheets) بالکل صاف اور فٹ کی گئی ہیں۔', insp.bot4, !insp.bot4)}
                    ${row(9,  'سائلو کے اندر سوئپر کور ٹھیک ہے اور اپنی جگہ (درمیان والا) پر فٹ ہے۔', insp.bot5, !insp.bot5)}
                    ${row(10, 'سائلو کے اندر فرش کے ساتھ شیٹیں والا گولا ٹھیک ہے۔', insp.bot6, !insp.bot6)}
                    ${row(11, 'سائلو کے باہر شیٹیں والا گولا ٹھیک ہے۔', insp.bot7, !insp.bot7)}
                    ${row(12, 'سائلو کے تمام ڈسچارجنگ کیسٹس کو مکمل بند کیا گیا ہے۔', insp.bot8, !insp.bot8)}
                    ${row(13, 'سائلو کے تمام ڈسچارج گیٹس لاک (SEAL) ہیں۔', insp.bot9, !insp.bot9)}
                    ${row(14, 'سائلو کی مین (Entrance) ونڈو کو اچھی طرح سے بند کیا گیا ہے۔', insp.bot10, !insp.bot10)}
                    ${row(15, 'سردیوں میں گرین کا موئسچر 16% سے زیادہ سائلو میں نہیں ڈالنا ہے۔', insp.bot11, !insp.bot11)}
                    ${row(16, 'گرمیوں میں گرین کا موئسچر 14% سے زیادہ سائلو میں نہیں ڈالنا ہے۔', insp.bot12, !insp.bot12)}
                </tbody>
            </table>

            <!-- PRODUCTION OFFICER REMARKS -->
            <div style="border:1px solid #000;padding:8px 12px;margin-top:8px;font-size:1.1rem;">
                <strong>ریمارکس پروڈکشن آفیسر:</strong>
                <span style="display:inline-block;min-width:70%;border-bottom:1px dashed #000;margin-right:8px;padding-right:6px;font-weight:normal;">${remarksProd || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
            </div>

            <!-- LAB SECTION -->
            <div style="margin-top:10px;">
                <div style="background:#fef2f2;border:1px solid #fecaca;padding:5px 10px;font-size:1.15rem;font-weight:bold;color:#991b1b;text-align:center;">لیبارٹری ریمارکس (Lab Checks)</div>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#fef2f2;font-weight:bold;">
                            <th style="border:1px solid #000;padding:10px 4px;text-align:center;width:10%;font-size:1.15rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">نمبر</th>
                            <th style="border:1px solid #000;padding:10px 10px;text-align:center;font-size:1.25rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">ٹیسٹ کی تفصیل</th>
                            <th style="border:1px solid #000;padding:10px 4px;text-align:center;width:15%;font-size:1.15rem;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">سٹیٹس</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${row(1, 'سائلو میں کوئی پرانا میٹریل ایکسٹرا موجود نہیں ہے۔', insp.lab1, !insp.lab1)}
                        ${row(2, 'کیا سائلو فیومیگیٹ کرنے کی ضرورت ہے؟', insp.lab2, !insp.lab2)}
                    </tbody>
                </table>
            </div>

            <!-- LAB REMARKS -->
            <div style="border:1px solid #000;padding:8px 12px;margin-top:6px;font-size:1.1rem;">
                <strong>ریمارکس لیبارٹری:</strong>
                <span style="display:inline-block;min-width:72%;border-bottom:1px dashed #000;margin-right:8px;padding-right:6px;font-weight:normal;">${remarksLab || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
            </div>

            <!-- SIGNATURE BLOCKS -->
            <div style="display:flex;justify-content:space-between;margin-top:40px;padding-top:10px;font-size:1.15rem;font-weight:bold;text-align:center;">
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">دستخط پروڈکشن مینیجر</div>
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">دستخط پروڈکشن آفیسر</div>
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">دستخط پلانٹ آپریٹر</div>
            </div>
        </div>`;
    };

    const buildSiloFumigationReportHTML = (log) => {
        const fum = log.fumigationData || {};
        const siloNo = log.siloNumber ? log.siloNumber.replace('Silo ', '') : '';
        const date = log.date || '';

        const renderTick = (val) => val ? '<span style="font-family:Arial,sans-serif;font-size:1.1rem;color:#16a34a;font-weight:bold;">✔</span>' : '<span style="font-family:Arial,sans-serif;font-size:0.9rem;color:#cbd5e1;">-</span>';
        const renderCross = (val) => (!val) ? '<span style="font-family:Arial,sans-serif;font-size:1.1rem;color:#dc2626;font-weight:bold;">X</span>' : '<span style="font-family:Arial,sans-serif;font-size:0.9rem;color:#cbd5e1;">-</span>';

        return `
        <div style="font-family:'Arial',sans-serif;direction:ltr;padding:28px 32px;background:#fff;color:#000;max-width:820px;margin:0 auto;height:100%;display:flex;flex-direction:column;">
            <div style="text-align:center;margin-bottom:20px;position:relative;">
                <h1 style="font-size:1.6rem;font-weight:bold;margin:10px 0;letter-spacing:1px;display:inline-block;">Silo Fumigation Performa</h1>
            </div>
            <div style="display:flex;border:2px solid #000;margin-bottom:15px;font-weight:bold;font-size:1.1rem;">
                <div style="width:50%;padding:8px 12px;border-right:2px solid #000;">Date: ${date}</div>
                <div style="width:50%;padding:8px 12px;text-align:center;">Silo# ${siloNo}</div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:15px;border:2px solid #000;">
                <thead>
                    <tr style="background:#e2e8f0;font-weight:bold;">
                        <th style="border:1px solid #000;padding:8px;width:8%;">Sr#</th>
                        <th style="border:1px solid #000;padding:8px;width:52%;">Check Points</th>
                        <th style="border:1px solid #000;padding:8px;width:20%;">YES=✓</th>
                        <th style="border:1px solid #000;padding:8px;width:20%;">NO=X</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">1</td>
                        <td style="border:1px solid #000;padding:8px;">All Silo Discharge Gates are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;text-align:center;">
                                <tr><td style="border:1px solid #000;padding:4px;">G1</td><td style="border:1px solid #000;padding:4px;">G2</td><td style="border:1px solid #000;padding:4px;">G3</td><td style="border:1px solid #000;padding:4px;">G4</td><td style="border:1px solid #000;padding:4px;">G5</td><td style="border:1px solid #000;padding:4px;">G6</td><td style="border:1px solid #000;padding:4px;">G7</td><td style="border:1px solid #000;padding:4px;">G8</td></tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g1)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g2)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g3)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g4)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g5)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g6)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g7)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.g8)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">2</td>
                        <td style="border:1px solid #000;padding:8px;">Silo's Enterance Windows are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;text-align:center;">
                                <tr><td style="border:1px solid #000;padding:4px;">Upper Window</td><td style="border:1px solid #000;padding:4px;">Lower Window</td></tr>
                                <tr><td style="border:1px solid #000;padding:4px;">${renderTick(fum.uw)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.lw)}</td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">3</td>
                        <td style="border:1px solid #000;padding:8px;">Silo's Fan Air Ducts are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;text-align:center;">
                                <tr><td style="border:1px solid #000;padding:4px;">Fan I</td><td style="border:1px solid #000;padding:4px;">Fan II</td></tr>
                                <tr><td style="border:1px solid #000;padding:4px;">${renderTick(fum.fan1)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.fan2)}</td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">4</td>
                        <td style="border:1px solid #000;padding:8px;">Air Discharge Ducts at Silo Top are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;text-align:center;">
                                <tr><td style="border:1px solid #000;padding:4px;">D1</td><td style="border:1px solid #000;padding:4px;">D2</td><td style="border:1px solid #000;padding:4px;">D3</td><td style="border:1px solid #000;padding:4px;">D4</td><td style="border:1px solid #000;padding:4px;">D5</td><td style="border:1px solid #000;padding:4px;">D6</td><td style="border:1px solid #000;padding:4px;">D7</td><td style="border:1px solid #000;padding:4px;">D8</td></tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.d1)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.d2)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.d3)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.d4)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.d5)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.d6)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.d7)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.d8)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">5</td>
                        <td style="border:1px solid #000;padding:8px;">Temperature Cable Inspection Windows are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;text-align:center;">
                                <tr><td style="border:1px solid #000;padding:4px;">C1</td><td style="border:1px solid #000;padding:4px;">C2</td><td style="border:1px solid #000;padding:4px;">C3</td><td style="border:1px solid #000;padding:4px;">C4</td><td style="border:1px solid #000;padding:4px;">C5</td><td style="border:1px solid #000;padding:4px;">C6</td><td style="border:1px solid #000;padding:4px;">C7</td><td style="border:1px solid #000;padding:4px;">C8</td></tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.c1)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.c2)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.c3)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.c4)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.c5)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.c6)}</td>
                                    <td style="border:1px solid #000;padding:4px;">${renderTick(fum.c7)}</td><td style="border:1px solid #000;padding:4px;">${renderTick(fum.c8)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">6</td>
                        <td style="border:1px solid #000;padding:8px;">Silo Filling Chutes(C) & Sampling Windows(W) are Seal.</td>
                        <td style="border:1px solid #000;padding:0;text-align:center;" colspan="2">
                            <table style="width:100%;border-collapse:collapse;font-size:0.75rem;text-align:center;">
                                <tr>
                                    <td style="border:1px solid #000;padding:2px;">17.2C</td><td style="border:1px solid #000;padding:2px;">17.2W</td><td style="border:1px solid #000;padding:2px;">S#1,3,4,6,7,5,7</td>
                                    <td style="border:1px solid #000;padding:2px;">17.1C</td><td style="border:1px solid #000;padding:2px;">17.1W</td><td style="border:1px solid #000;padding:2px;">S#2,3,5,6,8</td>
                                    <td style="border:1px solid #000;padding:2px;">17.3C</td><td style="border:1px solid #000;padding:2px;">17.W</td>
                                </tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:2px;">${renderTick(fum['172c'])}</td><td style="border:1px solid #000;padding:2px;">${renderTick(fum['172w'])}</td><td style="border:1px solid #000;padding:2px;">${renderTick(fum.s1)}</td>
                                    <td style="border:1px solid #000;padding:2px;">${renderTick(fum['171c'])}</td><td style="border:1px solid #000;padding:2px;">${renderTick(fum['171w'])}</td><td style="border:1px solid #000;padding:2px;">${renderTick(fum.s2)}</td>
                                    <td style="border:1px solid #000;padding:2px;">${renderTick(fum['173c'])}</td><td style="border:1px solid #000;padding:2px;">${renderTick(fum['17w'])}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;">7</td>
                        <td style="border:1px solid #000;padding:8px;">Silo Top Main Hole is Seal.</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;">${renderTick(fum.mainhole)}</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;">${renderCross(fum.mainhole)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display:flex;align-items:center;margin-bottom:15px;">
                <div style="width:120px;font-size:0.9rem;text-align:center;">Phosphine<br>(PPM)</div>
                <div style="flex:1;display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:5px;">
                    <div style="text-align:center;width:60px;border:1px solid #000;height:24px;line-height:24px;">${fum.ppm48 || ''}</div>
                    <div style="text-align:center;width:60px;border:1px solid #000;height:24px;line-height:24px;">${fum.ppm72 || ''}</div>
                    <div style="text-align:center;width:60px;border:1px solid #000;height:24px;line-height:24px;">${fum.ppm120 || ''}</div>
                    <div style="text-align:center;width:60px;border:1px solid #000;height:24px;line-height:24px;">${fum.ppm168 || ''}</div>
                    <div style="text-align:center;width:60px;border:1px solid #000;height:24px;line-height:24px;">${fum.ppm216 || ''}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;margin-bottom:25px;font-size:0.9rem;">
                <div style="width:120px;text-align:center;">Time Collapse<br>(Hr)</div>
                <div style="flex:1;display:flex;justify-content:space-between;">
                    <div style="text-align:center;width:60px;">48</div>
                    <div style="text-align:center;width:60px;">72</div>
                    <div style="text-align:center;width:60px;">120</div>
                    <div style="text-align:center;width:60px;">168</div>
                    <div style="text-align:center;width:60px;">216</div>
                </div>
            </div>

            <table style="width:100%;border-collapse:collapse;border:2px solid #000;text-align:center;font-weight:bold;font-size:0.95rem;">
                <thead>
                    <tr style="background:#e2e8f0;">
                        <th style="border:1px solid #000;padding:6px;">SiloStatus</th>
                        <th style="border:1px solid #000;padding:6px;" colspan="2">FULL</th>
                        <th style="border:1px solid #000;padding:6px;" colspan="2">EMPTY</th>
                    </tr>
                    <tr style="background:#e2e8f0;">
                        <th style="border:1px solid #000;padding:6px;">Dosing Site</th>
                        <th style="border:1px solid #000;padding:6px;">Stand. Qty</th>
                        <th style="border:1px solid #000;padding:6px;">Actual Qty</th>
                        <th style="border:1px solid #000;padding:6px;">Stand. Qty</th>
                        <th style="border:1px solid #000;padding:6px;">Actual Qty</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000;padding:6px;">Fan I</td>
                        <td style="border:1px solid #000;padding:6px;">2</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyFull_fan1 || ''}</td>
                        <td style="border:1px solid #000;padding:6px;vertical-align:middle;" rowspan="3">8</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyEmpty_fan1 || ''}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:6px;">Fan II</td>
                        <td style="border:1px solid #000;padding:6px;">2</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyFull_fan2 || ''}</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyEmpty_fan2 || ''}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:6px;">Silo Top</td>
                        <td style="border:1px solid #000;padding:6px;">4</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyFull_top || ''}</td>
                        <td style="border:1px solid #000;padding:6px;">${fum.qtyEmpty_top || ''}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:40px;font-size:1.1rem;font-weight:bold;text-align:center;">
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">Lab Inspector</div>
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">Plant Operator</div>
                <div style="width:30%;border-top:1.5px dashed #000;padding-top:8px;">Production Officer</div>
            </div>
        </div>`;
    };

    const buildSiloDischargeReportHTML = (log) => {
        const disInsp = log.dischargeInspection || {};
        const gates = log.gates || {};
        const siloNo = log.siloNumber ? log.siloNumber.replace('Silo ', '') : '';
        const date = log.date || '';
        const material = log.material || 'Maize';
        const mechDept = disInsp.mechDept || '';
        const operator = log.operator || '';

        const tick = (val) => val
            ? '<span style="font-family:Arial,sans-serif;font-size:1.1rem;color:#16a34a;font-weight:bold;">✔</span>'
            : '<span style="font-family:Arial,sans-serif;font-size:0.9rem;color:#cbd5e1;">-</span>';

        return `
        <div class="urdu-text" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Urdu Typesetting',serif;direction:rtl;text-align:right;padding:10px 32px 28px 32px;background:#fff;color:#000;max-width:820px;margin:0 auto;line-height:1.8;">

            <!-- Header -->
            <div style="border:2px solid #000;text-align:center;margin-bottom:20px;direction:ltr;background:#f8fafc;padding:16px 16px;">
                <div style="font-size:2.2rem;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;margin-bottom:2px;color:#0f172a;">سائلو ڈسچارج پرفارمہ</div>
                <div style="font-size:1.6rem;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;color:#334155;">(کنکریٹ سائلو)</div>
            </div>

            <!-- Metadata Table -->
            <table style="width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:20px;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;table-layout:fixed;">
                <tr style="background:#f1f5f9;">
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;"><strong>سائلو نمبر:</strong> <span style="font-family:Arial,sans-serif;font-weight:bold;margin-right:8px;font-size:1.15rem;">${siloNo}</span></td>
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;"><strong>ڈسچارج میٹریل:</strong> <span style="font-family:Arial,sans-serif;margin-right:8px;font-size:1.15rem;">${material}</span></td>
                    <td style="border:1px solid #000;padding:10px 14px;font-size:1.3rem;text-align:right;"><strong>تاریخ:</strong> <span style="font-family:Arial,sans-serif;margin-right:8px;direction:ltr;display:inline-block;font-size:1.15rem;font-weight:bold;">${date}</span></td>
                </tr>
            </table>


            <!-- Gates Table -->
            <div style="margin:0 auto 20px auto;width:100%; direction:rtl;">
                <table style="width:100%;border-collapse:collapse;border:2px solid #000;text-align:center; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:1.2rem;">
                    <thead>
                        <tr>
                            <th colspan="9" style="border:1px solid #000;padding:6px;background:#f1f5f9;font-weight:bold;">گیٹس نمبر</th>
                        </tr>
                        <tr>
                            <th style="border:1px solid #000;padding:6px;width:15%;"></th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 1</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 2</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 3</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 4</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 5</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 6</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 7</th>
                            <th style="border:1px solid #000;padding:6px;font-family:Arial;">🔒 8</th>
                        </tr>
                    </thead>
                    <tbody style="font-family:Arial,sans-serif;">
                        <tr>
                            <td style="border:1px solid #000;padding:8px;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">سیل نمبر</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal1 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal2 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal3 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal4 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal5 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal6 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal7 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.seal8 || ''}</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000;padding:8px;font-weight:bold;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">گیٹ اوپن</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open1 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open2 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open3 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open4 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open5 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open6 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open7 || ''}</td>
                            <td style="border:1px solid #000;padding:8px;">${gates.open8 || ''}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Urdu Inspection Table -->
            <table style="width:100%;border-collapse:collapse;border:2px solid #000;margin-bottom:30px;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:1.2rem;">
                <thead>
                    <tr>
                        <th style="border:1px solid #000;padding:8px;text-align:right;">مندرجہ ذیل نکات کو یقینی بنائیں: (پروڈکشن ڈیپائرٹمنٹ)</th>
                        <th style="border:1px solid #000;padding:8px;text-align:center;width:20%;">پلانٹ آپریٹر</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:right;">کیاسائلو کے سینٹر گیٹ سے مٹیریل آنا مکمل بند ہو گیا ہے؟</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-family:Arial,sans-serif;">${tick(disInsp.dis1)}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:right;">سائلو کے سینٹر ڈسچارج گیٹ کو راڈ سے چیک کرلیا گیا ہے؟</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-family:Arial,sans-serif;">${tick(disInsp.dis2)}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:right;">سائیلوز رپورٹ کے مطابق مٹیریل کا بیلینس کتنا ہے</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-family:Arial,sans-serif;font-weight:bold;">${disInsp.balance || ''}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;text-align:right;">سائلو کے ٹاپ ونڈو سے ٹارچ لائٹ سے چیک کیا ہے۔</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center;font-family:Arial,sans-serif;">${tick(disInsp.dis4)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Signatures -->
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;margin-bottom:20px;font-size:1.2rem;font-weight:bold;text-align:center;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
                <div style="flex:1; margin:0 10px;">
                    <div style="border-bottom:2px solid #000;min-height:30px;padding-bottom:5px;font-family:Arial,sans-serif;font-size:1rem;">${operator}</div>
                    <div style="margin-top:8px;">پلانٹ آپریٹر</div>
                </div>
                <div style="flex:1; margin:0 10px;">
                    <div style="border-bottom:2px solid #000;min-height:30px;padding-bottom:5px;font-family:Arial,sans-serif;font-size:1rem;">${mechDept}</div>
                    <div style="margin-top:8px;">مکینیکل ڈیپارٹمنٹ</div>
                </div>
                <div style="flex:1; margin:0 10px;">
                    <div style="border-bottom:2px solid #000;min-height:30px;padding-bottom:5px;"></div>
                    <div style="margin-top:8px;">پروڈکشن آفیسر</div>
                </div>
                <div style="flex:1; margin:0 10px;">
                    <div style="border-bottom:2px solid #000;min-height:30px;padding-bottom:5px;"></div>
                    <div style="margin-top:8px;">پروڈکشن مینیجر</div>
                </div>
            </div>

            <!-- Footer Document Control -->
            <table style="width:100%;border-collapse:collapse;border:2px solid #000;text-align:center;font-weight:bold;font-size:0.9rem;background:#dbeafe;">
                <tbody>
                    <tr>
                        <td style="border:1px solid #000;padding:8px;width:10%;">Document<br>Control<br>Guide</td>
                        <td style="border:1px solid #000;padding:8px;">Creator</td>
                        <td style="border:1px solid #000;padding:8px;">Control<br>Room</td>
                        <td style="border:1px solid #000;padding:8px;">Recorder</td>
                        <td style="border:1px solid #000;padding:8px;">Control<br>Room</td>
                        <td style="border:1px solid #000;padding:8px;">Record<br>Retention</td>
                        <td style="border:1px solid #000;padding:8px;">Silo End</td>
                        <td style="border:1px solid #000;padding:8px;">Final<br>Storage</td>
                        <td style="border:1px solid #000;padding:8px;">Boiler</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    };

    // Print Silo Inspection Report as beautiful paper
    window.printSiloInspection = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return alert('Record not found.');

        const log2 = siloLogs.find(x => x.id === id);
        if (!log2) return alert('Record not found.');
        const siloNo2 = log2.siloNumber ? log2.siloNumber.replace('Silo ', '') : '';
        const printWindow = window.open('', '_blank', 'width=920,height=1000');
        
        let reportHTML = '';
        if (log2.operation === 'Discharging') {
            reportHTML = buildSiloDischargeReportHTML(log2);
        } else if (log2.operation === 'Silo Fumigation') {
            reportHTML = buildSiloFumigationReportHTML(log2);
        } else {
            reportHTML = buildSiloReportHTML(log2);
        }

        printWindow.document.write(`
            <html><head>
                <meta charset="UTF-8">
                <title>Silo ${siloNo2} ${log2.operation} Report</title>
                <link href="https://cdn.jsdelivr.net/npm/jameel-noori@1.1.2/jameel-noori.min.css" rel="stylesheet">
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: 'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; direction:rtl; text-align:right; padding:24px 28px; background:#fff; color:#000; margin:0; font-size:1rem; }
                    @media print { body { padding:16px 20px; } .no-print { display:none; } }
                </style>
            </head>
            <body onload="window.print();">
                ${reportHTML}
            </body></html>
        `);
        printWindow.document.close();
    };



    // Full screen view of the report
    let currentlyViewingLogId = null;
    window.viewSiloInspection = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return alert('Record not found.');
        currentlyViewingLogId = id;
        
        const siloNo = log.siloNumber ? log.siloNumber.replace('Silo ', '') : '';
        const viewTitle = document.getElementById('silo-report-view-title');
        if (viewTitle) viewTitle.textContent = getSiloShortTitleUrdu(siloNo);

        const insp = log.inspection || {};
        const sealNo = log.sealNo || '';
        const date = log.date || '';
        const material = log.material || 'Maize';
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
        if (!container) return;
        
        if (log.operation === 'Discharging') {
            container.innerHTML = buildSiloDischargeReportHTML(log);
        } else if (log.operation === 'Silo Fumigation') {
            container.innerHTML = buildSiloFumigationReportHTML(log);
        } else {
            container.innerHTML = buildSiloReportHTML(log);
        }

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
            const printBtn = (log.operation === 'Filling' || log.operation === 'Discharging' || log.operation === 'Silo Fumigation')
                ? `<button class="btn btn-primary" style="padding:0.2rem 0.4rem; font-size:0.75rem; background:#8b5cf6; border-color:#8b5cf6;" onclick="printSiloInspection(${log.id})">🖨️ Print</button>` 
                : '';
            rows += `
                <tr style="border-bottom:1px solid var(--card-border);">
                    <td style="font-weight:600;">${log.date}</td>
                    <td>${log.shift || 'A'}</td>
                    <td style="font-weight:700;">${log.siloNumber}</td>
                    <td style="font-weight:700;color:${log.operation === 'Filling'?'#10b981':'#ef4444'};">${log.operation}</td>
                    <td>${log.material}</td>
                    <td style="font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
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
                            <th>Net Qty (T)</th>
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
        window.renderSiloPerformaDashboard = renderSiloPerformaDashboard;
        const grid = document.getElementById('silo-performas-grid');
        if (!grid) return;
        grid.innerHTML = '';

        try {
            const logs = Array.isArray(siloLogs) ? siloLogs : [];
            for (let i = 1; i <= 16; i++) {
                const siloName = `Silo ${i}`;
                
                const fillingsCount = logs.filter(l => l && l.siloNumber === siloName && l.operation === 'Filling').length;
                const dischargeCount = logs.filter(l => l && l.siloNumber === siloName && l.operation === 'Discharging').length;
                const fumigationCount = logs.filter(l => l && l.siloNumber === siloName && l.operation === 'Silo Fumigation').length;

                const card = document.createElement('div');
                card.style.cssText = `
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
                        <span style="font-size:0.7rem;background:#dcfce7;color:#166534;padding:0.15rem 0.4rem;border-radius:3px;font-weight:600;">Status: OK</span>
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
                        <button class="btn btn-secondary" onclick="window.openSiloHistory('Silo ${i}', 'Silo Fumigation')" style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.75rem;font-size:0.8rem;background:#fffbeb;border-color:#fde68a;color:#92400e;font-weight:700;">
                            <span>💨 Silo Fumigation</span>
                            <span style="background:#d97706;color:#fff;font-size:0.7rem;padding:0.1rem 0.35rem;border-radius:10px;">${fumigationCount}</span>
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        } catch (err) {
            grid.innerHTML = '<div style="color:red;padding:2rem;grid-column:1/-1;">Error rendering dashboard: ' + err.message + '</div>';
            console.error(err);
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

        titleEl.textContent = `${siloNum} - ${operationType === 'Filling' ? 'Filling (Stock In)' : (operationType === 'Discharging' ? 'Discharge (Stock Out)' : operationType)} Performa History`;
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
                    date: formatDateToDb(log.date),
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
                    inspection: {
                        ...(log.inspection || {}),
                        remarksProd: log.remarksProd,
                        remarksLab: log.remarksLab
                    }
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
                        <td class="no-print" style="padding:0.5rem;display:flex;gap:0.2rem;flex-wrap:wrap;">
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
                    <th style="padding:0.5rem;">Net Qty (T)</th>
                    <th style="padding:0.5rem;">Performed By</th>
                    <th class="no-print" style="padding:0.5rem;">Actions</th>
                </tr>
            `;

            [...filteredLogs].reverse().forEach(log => {
                const viewBtn = `<button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#10b981;border-color:#10b981;color:#fff;" onclick="viewSiloInspection(${log.id})">👁️ View</button>`;
                const printBtn = `<button class="btn btn-primary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#8b5cf6;border-color:#8b5cf6;" onclick="printSiloInspection(${log.id})">🖨️ Print</button>`;

                rows += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="font-weight:600;padding:0.5rem;">${log.date}</td>
                        <td style="padding:0.5rem;">${log.shift || 'A'}</td>
                        <td style="padding:0.5rem;font-weight:600;">${log.material}</td>
                        <td style="padding:0.5rem;font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                        <td style="padding:0.5rem;">${log.operator || '-'}</td>
                        <td class="no-print" style="padding:0.5rem;display:flex;gap:0.2rem;flex-wrap:wrap;">
                            <button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;" onclick="window.editSiloLog(${log.id})">✏️ Edit</button>
                            ${viewBtn}
                            ${printBtn}
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

    const toggleSiloLogSections = (operation) => {
        const sealGroup = document.getElementById('fg-seal-no');
        const officerGroup = document.getElementById('fg-officer');
        const mechDeptGroup = document.getElementById('fg-mech-dept');
        const inspectionSection = document.getElementById('sl-modal-inspection-section-direct');
        const dischargeSection = document.getElementById('sl-modal-discharge-section-direct');
        const fumigationSection = document.getElementById('sl-modal-fumigation-section');
        const hiddenFieldsWrapper = document.getElementById('sl-modal-hidden-fields');
        const materialInput = document.getElementById('sl-modal-material');

        if (operation === 'Filling') {
            if (sealGroup) sealGroup.style.display = 'block';
            if (officerGroup) officerGroup.style.display = 'block';
            if (mechDeptGroup) mechDeptGroup.style.display = 'none';
            if (inspectionSection) inspectionSection.style.display = 'block';
            if (dischargeSection) dischargeSection.style.display = 'none';
            if (fumigationSection) fumigationSection.style.display = 'none';
            if (materialInput) materialInput.readOnly = false;
        } else if (operation === 'Discharging') {
            if (sealGroup) sealGroup.style.display = 'none';
            if (officerGroup) officerGroup.style.display = 'none';
            if (mechDeptGroup) mechDeptGroup.style.display = 'block';
            if (inspectionSection) inspectionSection.style.display = 'none';
            if (dischargeSection) dischargeSection.style.display = 'block';
            if (fumigationSection) fumigationSection.style.display = 'none';
            if (materialInput) materialInput.readOnly = true;
        } else if (operation === 'Silo Fumigation') {
            if (sealGroup) sealGroup.style.display = 'none';
            if (officerGroup) officerGroup.style.display = 'none';
            if (mechDeptGroup) mechDeptGroup.style.display = 'none';
            if (inspectionSection) inspectionSection.style.display = 'none';
            if (dischargeSection) dischargeSection.style.display = 'none';
            if (fumigationSection) fumigationSection.style.display = 'block';
            if (materialInput) materialInput.readOnly = true;
        } else {
            if (sealGroup) sealGroup.style.display = 'none';
            if (officerGroup) officerGroup.style.display = 'none';
            if (inspectionSection) inspectionSection.style.display = 'none';
            if (dischargeSection) dischargeSection.style.display = 'none';
            if (fumigationSection) fumigationSection.style.display = 'none';
        }
        
        if (hiddenFieldsWrapper) hiddenFieldsWrapper.style.display = 'none';
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
        for (let i = 1; i <= 8; i++) {
            const sealInput = document.getElementById(`sl-modal-seal-${i}`);
            if (sealInput) sealInput.value = '';
        }
        document.getElementById('sl-modal-officer').value = window.getDefaultOfficer(true);
        document.getElementById('sl-modal-operator').value = window.getDefaultOfficer(false);

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

        if (modalCard) {
            modalCard.style.maxWidth = '100%';
            modalCard.style.width = '100%';
            modalCard.style.height = '100vh';
            modalCard.style.maxHeight = '100vh';
            modalCard.style.borderRadius = '0';
            modalCard.style.margin = '0';
        }
        const modalOverlay = document.getElementById('silo-log-modal');
        if (modalOverlay) {
            modalOverlay.style.padding = '0';
        }

        toggleSiloLogSections(operationType);

        let defaultMaterial = 'Maize';
        if (operationType === 'Discharging') {
            const lastFillingLog = siloLogs.slice().reverse().find(l => l.siloNumber === siloNum && l.operation === 'Filling');
            if (lastFillingLog && lastFillingLog.material) {
                defaultMaterial = lastFillingLog.material;
            }
        }
        document.getElementById('sl-modal-material').value = defaultMaterial;
        document.getElementById('sl-modal-moisture').value = '';
        document.getElementById('sl-modal-net-wt').value = '';
        document.getElementById('sl-modal-temp').value = '';
        document.getElementById('sl-modal-remarks-prod').value = '';
        document.getElementById('sl-modal-remarks-lab').value = '';
        document.getElementById('sl-modal-remarks').value = '';

        const inspTitle = document.getElementById('sl-modal-inspection-title');
        if (inspTitle) inspTitle.textContent = getSiloModalInspectionTitle(siloNum);

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
        const dischargeSection = document.getElementById('sl-modal-discharge-section-direct');
        const fumigationSection = document.getElementById('sl-modal-fumigation-section');
        const hiddenFieldsWrapper = document.getElementById('sl-modal-hidden-fields');

        if (modalCard) {
            modalCard.style.maxWidth = '100%';
            modalCard.style.width = '100%';
            modalCard.style.height = '100vh';
            modalCard.style.maxHeight = '100vh';
            modalCard.style.borderRadius = '0';
            modalCard.style.margin = '0';
        }
        const modalOverlay = document.getElementById('silo-log-modal');
        if (modalOverlay) {
            modalOverlay.style.padding = '0';
        }

        toggleSiloLogSections(log.operation);

        if (log.operation === 'Filling') {            const savedSeals = log.sealNo ? log.sealNo.split(',').map(s => s.trim()) : [];
            for (let i = 1; i <= 8; i++) {
                document.getElementById(`sl-modal-seal-${i}`).value = savedSeals[i - 1] || '';
            }
            document.getElementById('sl-modal-officer').value = log.supervisor || window.getDefaultOfficer(true);

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
        } else if (log.operation === 'Discharging') {
            const disInsp = log.dischargeInspection || {};
            document.getElementById('sl-modal-mech-dept').value = disInsp.mechDept || '';
            document.getElementById('sl-dis-balance').value = disInsp.balance || '';

            document.getElementById('sl-chk-dis1-yes').checked = !!disInsp.dis1;
            document.getElementById('sl-chk-dis1-no').checked = !disInsp.dis1;
            document.getElementById('sl-chk-dis2-yes').checked = !!disInsp.dis2;
            document.getElementById('sl-chk-dis2-no').checked = !disInsp.dis2;
            document.getElementById('sl-chk-dis4-yes').checked = !!disInsp.dis4;
            document.getElementById('sl-chk-dis4-no').checked = !disInsp.dis4;

            const gates = log.gates || {};
            [1,2,3,4,5,6,7,8].forEach(num => {
                document.getElementById(`sl-dis-seal-${num}`).value = gates[`seal${num}`] || '';
                document.getElementById(`sl-dis-gate-${num}`).value = gates[`open${num}`] || '';
            });
        }

        document.getElementById('sl-modal-material').value = log.material || '';
        document.getElementById('sl-modal-moisture').value = log.moisture !== undefined ? log.moisture : '';
        document.getElementById('sl-modal-net-wt').value = log.netQty !== undefined ? log.netQty : '';
        document.getElementById('sl-modal-temp').value = log.temperature !== undefined ? log.temperature : '';
        document.getElementById('sl-modal-operator').value = log.operator || window.getDefaultOfficer(false);
        document.getElementById('sl-modal-remarks-prod').value = log.remarksProd || '';
        document.getElementById('sl-modal-remarks-lab').value = log.remarksLab || '';
        document.getElementById('sl-modal-remarks').value = log.remarks || '';

        document.getElementById('silo-history-modal').classList.remove('show');
        
        const inspTitle = document.getElementById('sl-modal-inspection-title');
        if (inspTitle) inspTitle.textContent = getSiloModalInspectionTitle(log.siloNumber);

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
        const operationSelect = document.getElementById('sl-modal-operation');

        if (operationSelect) {
            operationSelect.addEventListener('change', (e) => {
                toggleSiloLogSections(e.target.value);
                if (!activeLogId) {
                    if (e.target.value === 'Discharging') {
                        const siloNum = document.getElementById('sl-modal-silo').value;
                        const lastFillingLog = siloLogs.slice().reverse().find(l => l.siloNumber === siloNum && l.operation === 'Filling');
                        if (lastFillingLog && lastFillingLog.material) {
                            document.getElementById('sl-modal-material').value = lastFillingLog.material;
                        }
                    } else if (e.target.value === 'Filling') {
                        document.getElementById('sl-modal-material').value = 'Maize';
                    }
                }
            });
        }

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
                
                const remarksProd = document.getElementById('sl-modal-remarks-prod').value.trim();
                const remarksLab = document.getElementById('sl-modal-remarks-lab').value.trim();
                const remarks = document.getElementById('sl-modal-remarks').value.trim();

                if (!date) return alert('Please enter Date.');
                if (!material) return alert('Please enter Material Name.');

                let sealNo = '';
                let supervisor = ''; 
                let inspection = null;
                let dischargeInspection = null;
                let gates = null;
                let fumigationData = null;

                if (operation === 'Filling') {
                    let allSeals = [];
                    for (let i = 1; i <= 8; i++) {
                        let val = document.getElementById(`sl-modal-seal-${i}`).value.trim();
                        allSeals.push(val);
                    }
                    sealNo = allSeals.join(', ');
                    supervisor = document.getElementById('sl-modal-officer').value; 
                    
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
                        managerApproved: prevApproval,
                        remarksProd,
                        remarksLab
                    };
                } else if (operation === 'Discharging') {
                    dischargeInspection = {
                        mechDept: document.getElementById('sl-modal-mech-dept').value.trim(),
                        balance: document.getElementById('sl-dis-balance').value.trim(),
                        dis1: document.getElementById('sl-chk-dis1-yes').checked,
                        dis2: document.getElementById('sl-chk-dis2-yes').checked,
                        dis4: document.getElementById('sl-chk-dis4-yes').checked
                    };
                    gates = {};
                    let disSealsArr = [];
                    [1,2,3,4,5,6,7,8].forEach(num => {
                        const sealVal = document.getElementById(`sl-dis-seal-${num}`).value.trim();
                        gates[`seal${num}`] = sealVal;
                        gates[`open${num}`] = document.getElementById(`sl-dis-gate-${num}`).value.trim();
                        disSealsArr.push(sealVal);
                    });

                    const lastFillingLog = siloLogs.slice().reverse().find(l => l.siloNumber === siloNumber && l.operation === 'Filling');
                    if (lastFillingLog) {
                        const fillingSeals = lastFillingLog.sealNo ? lastFillingLog.sealNo.split(',').map(s => s.trim()) : [];
                        let mismatch = false;
                        for (let i = 0; i < 8; i++) {
                            const fillSeal = fillingSeals[i] || '';
                            const disSeal = disSealsArr[i] || '';
                            if (fillSeal !== disSeal) {
                                mismatch = true;
                                break;
                            }
                        }
                        if (mismatch && !remarks) {
                            return alert('Seal numbers on specific gates do not match the filling records. Please provide remarks.');
                        }
                    }
                } else if (operation === 'Silo Fumigation') {
                    fumigationData = {};
                    ['g1','g2','g3','g4','g5','g6','g7','g8'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    ['uw','lw'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    ['fan1','fan2'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    ['d1','d2','d3','d4','d5','d6','d7','d8'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    ['c1','c2','c3','c4','c5','c6','c7','c8'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    ['172c','172w','s1','171c','171w','s2','173c','17w'].forEach(id => fumigationData[id] = document.getElementById(`fum-${id}`).checked);
                    fumigationData.mainhole = document.getElementById('fum-mainhole').checked;

                    ['48','72','120','168','216'].forEach(id => fumigationData[`ppm${id}`] = document.getElementById(`fum-ppm-${id}`).value.trim());

                    ['fan1','fan2','top'].forEach(id => {
                        fumigationData[`qtyFull_${id}`] = document.getElementById(`fum-qty-full-${id}`).value.trim();
                        fumigationData[`qtyEmpty_${id}`] = document.getElementById(`fum-qty-empty-${id}`).value.trim();
                    });
                }

                if (!inspection) inspection = { remarksProd, remarksLab };

                const log = {
                    id: activeLogId || Date.now(),
                    date, shift, siloNumber, operation, material, moisture,
                    netQty, temperature, operator, remarksProd, remarksLab, remarks,
                    sealNo, supervisor, inspection, dischargeInspection, gates, fumigationData
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
                            date: formatDateToDb(date),
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
                            inspection: {
                                ...log.inspection,
                                dischargeInspection: log.dischargeInspection,
                                gates: log.gates,
                                fumigationData: log.fumigationData
                            }
                        };

                        const { error } = await sbClient.from('silo_logs').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert(`✓ Silo ${log.operation} Performa saved to Supabase successfully!`);
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        if (window.showToast) window.showToast('✗ Supabase Save Error');
                        alert('Error saving to Supabase: ' + (err.message || JSON.stringify(err)));
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
                // Fetch remote data
                const { data, error } = await sbClient.from('silo_logs').select('*').order('date', { ascending: false });
                
                if (!error && data) {
                    const remoteIds = new Set(data.map(r => r.id));
                    
                    // Identify local logs that are NOT in Supabase yet
                    const unsyncedLogs = siloLogs.filter(log => !remoteIds.has(log.id));
                    
                    // If we have unsynced local logs, push them to Supabase
                    if (unsyncedLogs.length > 0) {
                        console.log(`Pushing ${unsyncedLogs.length} unsynced local logs to Supabase...`);
                        const recordsToInsert = unsyncedLogs.map(log => ({
                            id: log.id,
                            date: formatDateToDb(log.date),
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
                            inspection: {
                                ...(log.inspection || {}),
                                remarksProd: log.remarksProd,
                                remarksLab: log.remarksLab
                            }
                        }));
                        
                        await sbClient.from('silo_logs').upsert(recordsToInsert);
                        
                        // Refetch after pushing
                        const { data: newData, error: newError } = await sbClient.from('silo_logs').select('*').order('date', { ascending: false });
                        if (!newError && newData) {
                            siloLogs = newData.map(r => {
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
                                    remarksProd: r.inspection && r.inspection.remarksProd ? r.inspection.remarksProd : (r.remarks || ''),
                                    remarksLab: r.inspection && r.inspection.remarksLab ? r.inspection.remarksLab : '',
                                    sealNo: r.seal_no,
                                    supervisor: r.supervisor,
                                    inspection: r.inspection
                                };
                            });
                        }
                    } else {
                        // Simply map remote data to local
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
                                remarksProd: r.inspection && r.inspection.remarksProd ? r.inspection.remarksProd : (r.remarks || ''),
                                remarksLab: r.inspection && r.inspection.remarksLab ? r.inspection.remarksLab : '',
                                sealNo: r.seal_no,
                                supervisor: r.supervisor,
                                inspection: r.inspection
                            };
                        });
                    }
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
            renderSiloPerformaDashboard();
            await syncWithSupabase();
        });
    } else {
        initSiloEvents();
        renderSiloPerformaDashboard();
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

