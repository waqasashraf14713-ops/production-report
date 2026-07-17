const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newOfficerOptions = `
                                <option value="M. Tahir">M. Tahir</option>
                                <option value="M. Zubair">M. Zubair</option>
                                <option value="M. Shoaib">M. Shoaib</option>
                                <option value="M. Waqas">M. Waqas</option>
                            `;

const newOfficerOptionsWithSelect = `
                                <option value="">Select Officer</option>` + newOfficerOptions;

const newOperatorOptions = `
                                <option value="M. Umer">M. Umer</option>
                                <option value="M. Saifal">M. Saifal</option>
                                <option value="M. Farrukh">M. Farrukh</option>
                                <option value="M. Deen">M. Deen</option>
                            `;

const newOperatorOptionsWithSelect = `
                                <option value="">Select Operator</option>` + newOperatorOptions;

html = html.replace(/(<select[^>]*id="[^"]*officer[^"]*"[^>]*>)([\s\S]*?)(<\/select>)/gi, (match, p1, p2, p3) => {
    let options = newOfficerOptions;
    if (p2.includes('value=""') || p2.toLowerCase().includes('select officer')) {
        options = newOfficerOptionsWithSelect;
    }
    return p1 + '\n' + options + '                            ' + p3;
});

html = html.replace(/(<select[^>]*id="[^"]*operator[^"]*"[^>]*>)([\s\S]*?)(<\/select>)/gi, (match, p1, p2, p3) => {
    let options = newOperatorOptions;
    if (p2.includes('value=""') || p2.toLowerCase().includes('select operator') || p2.toLowerCase().includes('select')) {
        options = newOperatorOptionsWithSelect;
    }
    return p1 + '\n' + options + '                            ' + p3;
});

fs.writeFileSync('index.html', html);
