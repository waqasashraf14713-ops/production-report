import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update all Officer selects
officer_options = """
                                <option value="M. Tahir">M. Tahir</option>
                                <option value="M. Zubair">M. Zubair</option>
                                <option value="M. Shoaib">M. Shoaib</option>
                                <option value="M. Waqas">M. Waqas</option>
"""
officer_options_with_select = '\n                                <option value="">Select Officer</option>' + officer_options

def repl_officer(m):
    p1 = m.group(1)
    p2 = m.group(2)
    p3 = m.group(3)
    opts = officer_options
    if 'value=""' in p2 or 'select officer' in p2.lower():
        opts = officer_options_with_select
    return p1 + opts + '                            ' + p3

html = re.sub(r'(<select[^>]*id="[^"]*officer[^"]*"[^>]*>)([\s\S]*?)(</select>)', repl_officer, html, flags=re.IGNORECASE)

# 2. Update all Operator selects
operator_options = """
                                <option value="M. Umer">M. Umer</option>
                                <option value="M. Saifal">M. Saifal</option>
                                <option value="M. Farrukh">M. Farrukh</option>
                                <option value="M. Deen">M. Deen</option>
"""
operator_options_with_select = '\n                                <option value="">Select Operator</option>' + operator_options

def repl_operator(m):
    p1 = m.group(1)
    p2 = m.group(2)
    p3 = m.group(3)
    opts = operator_options
    if 'value=""' in p2 or 'select operator' in p2.lower() or 'select' in p2.lower():
        opts = operator_options_with_select
    return p1 + opts + '                            ' + p3

html = re.sub(r'(<select[^>]*id="[^"]*operator[^"]*"[^>]*>)([\s\S]*?)(</select>)', repl_operator, html, flags=re.IGNORECASE)


# 3. Perform the layout change (moving Officer & Operator to the top and removing duplicates at bottom)

# Top inputs replacement
top_target = """                        <div class="form-group" id="fg-officer">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Officer Name</label>
                            <input type="text" id="sl-modal-officer" placeholder="Enter Officer Name" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#f8fafc;color:#000;font-weight:600;outline:none;" />
                        </div>
                        <div class="form-group" id="fg-operator">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Operator</label>
                            <input type="text" id="sl-modal-operator" placeholder="Enter Operator Name" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#f8fafc;color:#000;font-weight:600;outline:none;" />
                        </div>"""

top_replacement = """                        <div class="form-group" id="fg-officer">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Officer Name (آفیسر کا نام)</label>
                            <select id="sl-modal-officer" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;">
                                <option value="M. Tahir">M. Tahir</option>
                                <option value="M. Zubair">M. Zubair</option>
                                <option value="M. Shoaib">M. Shoaib</option>
                                <option value="M. Waqas">M. Waqas</option>
                            </select>
                        </div>
                        <div class="form-group" id="fg-operator">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Operator Name (آپریٹر کا نام)</label>
                            <select id="sl-modal-operator" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;">
                                <option value="M. Umer">M. Umer</option>
                                <option value="M. Saifal">M. Saifal</option>
                                <option value="M. Farrukh">M. Farrukh</option>
                                <option value="M. Deen">M. Deen</option>
                            </select>
                        </div>"""

# Ensure the inputs we're looking for weren't already replaced by our regex. Wait, our regex only replaced <select>s, not <input>s. So the top text inputs are still there.
html = html.replace(top_target, top_replacement)

# Bottom duplicates replacement
bottom_target = """                    <!-- Row 2: Officer/Mech Name, Operator Name (Wide inputs to prevent label wrapping) -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
                        <div class="form-group" id="fg-officer">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Officer Name (آفیسر کا نام)</label>
                            <select id="sl-modal-officer" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;">
                                <option value="M. Tahir">M. Tahir</option>
                                <option value="M. Zubair">M. Zubair</option>
                                <option value="M. Shoaib">M. Shoaib</option>
                                <option value="M. Waqas">M. Waqas</option>
                            </select>
                        </div>
                        <div class="form-group" id="fg-mech-dept" style="display:none;">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Mechanical depart Name</label>
                            <input type="text" id="sl-modal-mech-dept" placeholder="e.g. M. Irfan" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;" />
                        </div>
                        <div class="form-group" id="fg-operator">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Operator Name (آپریٹر کا نام)</label>
                            <select id="sl-modal-operator" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;">
                                <option value="M. Umer">M. Umer</option>
                                <option value="M. Saifal">M. Saifal</option>
                                <option value="M. Farrukh">M. Farrukh</option>
                                <option value="M. Deen">M. Deen</option>
                            </select>
                        </div>
                    </div>"""

bottom_replacement = """                    <!-- Mechanical Dept field (hidden by default) -->
                    <div style="display:block;">
                        <div class="form-group" id="fg-mech-dept" style="display:none;margin-top:0.5rem;">
                            <label style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;display:block;">Mechanical depart Name</label>
                            <input type="text" id="sl-modal-mech-dept" placeholder="e.g. M. Irfan" style="width:100%;border-radius:4px;border:1px solid #cbd5e1;padding:0.5rem;background:#fff;color:#000;outline:none;" />
                        </div>
                    </div>"""

html = html.replace(bottom_target, bottom_replacement)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
