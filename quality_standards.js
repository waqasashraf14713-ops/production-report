// ─── Quality Standards Check List Module ──────────────────────────────────
(() => {
const LS_QS = 'fm_qs_report';
let qsData = [];
try {
    qsData = JSON.parse(localStorage.getItem(LS_QS) || '[]');
} catch (e) {
    console.error("Failed to parse quality standards data from localStorage:", e);
}
let activeQsId = null;

const qsBatchingItems = [
    'کنٹرول روم آپريٹر نے بيچنگ اسٹارٹ کرنے سے پہلے بيچنگ کلرک کو بيچنگ کارڈ ديا ہے',
    'فارمولا تبديل کرتےوقت مکسر ہاپر بيچنگ کلرک سے چيک کروايا ہے',
    'بيچنگ کلرک نے فارمولے کے حساب سے ميڈسن وئينگ سکيل پر ترتيب دی ہے',
    'فارمولا فيڈ کرنے کے بعدآپريٹرنے بيچنگ کلرک سے فارمولا ميچ کيا ہے ،اور ٹوٹل ايٹم کی تعداد پوچه کر فارمولے کے ساته ميچ کيا ہے',
    'پروڈکشن آفيسراور آپڑيٹرنے فارمولا چيک کرتے وقت formula Receipe سکرين پر جا کربن مٹيريل ،ٹائيمر کو چيک کيا ہے،اور پهر مين سکرين پر بهی جا کر فارمولا کو چيک کيا ہے ،اور چهوٹے سکيل اور بڑے سکيل کا وزن چيک کر کے فارمولے کے ساته ميچ کيا ہے',
    'مکسر پر موجوده فيڈ نمبرکی پليٹ اورور ژن اپڈيٹ ہے',
    'کنٹرول روم ميں PLC پر ميڈيسن کی ٹالرنس 1کلو گرام دی ہوئی ہے',
    'آپريٹر ہر پانچ لائنوں کے بعد بيچنگ کلرک کی شيٹ چيک کر رہا ہے ،اور پروڈکشن آفيسر ہر دس لائنوں کے بعد چيک کر رہا ہے',
    'بيچنگ کلرک نے پہلی لائن کا شيره،پانی والی نوزل ،اور آئل والی نوزل چيک کی ہيں',
    '215ہاپر پری مکس کا وزن آنے کم زياده آنے پر پروڈکشن آفيسر کو چيک کرايا ہے',
    'تما م بنو ں کا آف سيٹ ويٹ مٹيريل کے ويٹ کے لحاظ سے ديا ہوا ہے',
    'بيچنگ ايريا ميں صرف رننگ فارمولا ورژن موجود ہے ،پرانا ورژن موجود نہيں ہے',
    'ميڈيسن کے خالی بيگز ٹب کے کور پر لگے ہوئے ہيں ،اور اپڈيٹ ہيں',
    'بيچنگ ايريا ميں اضافی ميڈيسن ،يا بيگ نہيں پڑے ہوئے',
    'ميڈيسن اسٹاک متعلقہ ميڈيسن کے ٹب کے سامنے رکهی ہوئی ہے،اور اسٹينڈرڈ کے مطابق ہے',
    'بيچنگ ايريا ميں وئينگ پوائينٹ کےدونوں سکيل، گراس ويٹ سکيل ہر شفٹ ميں چيک ہو رہے ہيں',
    'سکيل کيليبريشن رات 12 بجے چيک ہو رہی ہے',
    'جو ميڈيسن فارمولے کا حصہ نہيں ہے ان ميڈيسن کے ٹب سائيڈ پر ہيں ،اور ان کے کور کو لاک کيا گيا ہے',
    'ہر فارمولے ميں خالی بالٹی کا گراس ويٹ وئينگ آپريٹر اور بيچنگ کلرک چيک کر رہا ہے ،اور شيٹ پر لکه رہا ہے',
    'پروڈکشن آفيسر نے فارموليشن فائل کے ساته بيچنگ ايريا ميں ميڈيسن کا وزن چيک کيا ہے',
    'دونوں وئينگ آپريٹر اپنے اپنے سکيل پر گراس ويٹ چيک کر رہے ہيں اور گراس ويٹ کی ٹالرنس وئينگ پوائينٹ 1اور 2 پر 10 گرام ہے',
    'گراس ويٹ والا پيج سکيل کے ساته لگا ہوا ہے ،اور اپڈيٹ ہے',
    'بيچنگ کلرک ہر فارمولے کی پہلی اور گيارويں لائن کی تمام ميڈيسن کا وزن چيک کر رہا ہے',
    'بيچنگ کلرک ہر لائن کا ٹوٹل وزن شيٹ پر لکه رہا ہے،اور ميڈيسن کے ٹوٹل وزن کی ٹلرنس 20 گرام ہے',
    'پروڈکشن آفيسر ہرشفٹ ميں بيچنگ ميڈيسن اور پری مکس،فائی ٹيزکا آڈٹ کر رہا ہے',
    'ڈمپننگ آپريٹر تمام ميڈيسن کو گراس ويٹ سکيل سے اٹها کر ڈمپننگ پوائينٹ پر رکهتا ہے اور پهر ڈمپ کرتا ہے',
    'ونڈے ميں ہينڈ ڈمپ ہونے والی ميڈيسن (گلوٹن ميل،فيڈ) کے بيگ کا اسٹينڈرڈ وزن 50 کلوگرام ہے',
    'نمبر تبديل پر بيچنگ کلرک پہلی لائن کا پری مکس ،فائی ٹيز خود جا کرپری مکس ايريا ميں اٹهوارہا ہے'
];

const qsPelletItems = [
    'پيلٹ آپريٹر ہر4 گهنٹے بعد بيچنگ سيمپل چيک کرارہے ہيں',
    'پيلٹ آپريٹر ہر 30منٹ بعد پيلٹ کے سيمپل چيک کرارہے ہيں'
];

const chkHtml = (id) => `<input type="checkbox" id="${id}" style="transform:scale(1.3);cursor:pointer;">`;

const buildQsUI = () => {
    let bHtml = '';
    qsBatchingItems.forEach((item, i) => {
        bHtml += `
        <tr style="border-bottom:1px solid var(--card-border);">
            <td style="text-align:center;font-weight:bold;padding:0.5rem;">${i + 1}</td>
            <td style="text-align:right;padding:0.5rem;direction:rtl;">${item}</td>
            <td style="text-align:center;padding:0.5rem;">${chkHtml(`qs-b-${i}`)}</td>
        </tr>`;
    });
    const tb = document.getElementById('qs-batching-tbody');
    if (tb) tb.innerHTML = bHtml;

    let pHtml = '';
    qsPelletItems.forEach((item, i) => {
        pHtml += `
        <tr style="border-bottom:1px solid var(--card-border);">
            <td style="text-align:center;font-weight:bold;padding:0.5rem;">${i + 1}</td>
            <td style="text-align:right;padding:0.5rem;direction:rtl;">${item}</td>
            <td style="text-align:center;padding:0.5rem;">${chkHtml(`qs-p-${i}`)}</td>
        </tr>`;
    });
    const tp = document.getElementById('qs-pellet-tbody');
    if (tp) tp.innerHTML = pHtml;
};

const clearQsForm = () => {
    const today = new Date();
    document.getElementById('qs-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
    document.getElementById('qs-shift').value = 'Morning';
    document.getElementById('qs-officer').value = '';

    document.querySelectorAll('#qs-modal input[type="checkbox"]').forEach(el => el.checked = false);
};

const renderQsTable = () => {
    const tbody = document.querySelector('#qs-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (qsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No Quality Standards check lists found.</td></tr>';
        return;
    }
    [...qsData].reverse().forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.date}</td>
            <td><span style="background:var(--accent-glow);color:var(--accent-color);padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.85rem;">${p.shift}</span></td>
            <td>${p.officer || '—'}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editQs(${p.id})">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteQs(${p.id})">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

const getQsChk = id => document.getElementById(id) ? document.getElementById(id).checked : false;
const setQsChk = (id, val) => { if (document.getElementById(id)) document.getElementById(id).checked = !!val; };

const saveQs = () => {
    const date = document.getElementById('qs-date').value;
    const shift = document.getElementById('qs-shift').value;
    const officer = document.getElementById('qs-officer').value;
    if (!date) return alert('Date is required!');

    const bVals = qsBatchingItems.map((_, i) => getQsChk(`qs-b-${i}`));
    const pVals = qsPelletItems.map((_, i) => getQsChk(`qs-p-${i}`));

    const data = {
        date, shift, officer, bVals, pVals
    };

    if (activeQsId) {
        const idx = qsData.findIndex(x => x.id === activeQsId);
        if (idx !== -1) { data.id = activeQsId; qsData[idx] = data; }
    } else {
        data.id = Date.now();
        qsData.push(data);
    }
    
    localStorage.setItem(LS_QS, JSON.stringify(qsData));
    renderQsTable();
    document.getElementById('qs-modal').classList.remove('show');
    if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();
};

const loadQsToForm = (data) => {
    document.getElementById('qs-date').value = data.date || '';
    document.getElementById('qs-shift').value = data.shift || 'Morning';
    document.getElementById('qs-officer').value = data.officer || '';

    if (data.bVals) data.bVals.forEach((val, i) => setQsChk(`qs-b-${i}`, val));
    if (data.pVals) data.pVals.forEach((val, i) => setQsChk(`qs-p-${i}`, val));
};

window.editQs = (id) => {
    const d = qsData.find(x => x.id === id);
    if (!d) return;
    activeQsId = id;
    loadQsToForm(d);
    document.getElementById('qs-modal').classList.add('show');
};

window.deleteQs = (id) => {
    if (!confirm('Delete this check list?')) return;
    qsData = qsData.filter(x => x.id !== id);
    localStorage.setItem(LS_QS, JSON.stringify(qsData));
    renderQsTable();
};

window.initQualityStandardsEvents = () => {
    buildQsUI();
    
    const btnAdd = document.getElementById('btn-add-qs');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            activeQsId = null;
            clearQsForm();
            document.getElementById('qs-modal').classList.add('show');
        });
    }

    const btnSave = document.getElementById('btn-save-qs');
    if (btnSave) btnSave.addEventListener('click', saveQs);

    const btnClose1 = document.getElementById('qs-close');
    if (btnClose1) btnClose1.addEventListener('click', () => document.getElementById('qs-modal').classList.remove('show'));
    
    const btnClose2 = document.getElementById('btn-cancel-qs');
    if (btnClose2) btnClose2.addEventListener('click', () => document.getElementById('qs-modal').classList.remove('show'));

    renderQsTable();
};
})();
