$html = Get-Content -Raw "index.html"

$newOfficerOptions = @"
                                <option value="M. Tahir">M. Tahir</option>
                                <option value="M. Zubair">M. Zubair</option>
                                <option value="M. Shoaib">M. Shoaib</option>
                                <option value="M. Waqas">M. Waqas</option>
"@

$newOfficerOptionsWithSelect = @"
                                <option value="">Select Officer</option>
$newOfficerOptions
"@

$newOperatorOptions = @"
                                <option value="M. Umer">M. Umer</option>
                                <option value="M. Saifal">M. Saifal</option>
                                <option value="M. Farrukh">M. Farrukh</option>
                                <option value="M. Deen">M. Deen</option>
"@

$newOperatorOptionsWithSelect = @"
                                <option value="">Select Operator</option>
$newOperatorOptions
"@

$officerRegex = '(?i)(<select[^>]*id="[^"]*officer[^"]*"[^>]*>)([\s\S]*?)(</select>)'
$html = [regex]::Replace($html, $officerRegex, {
    param($match)
    $p1 = $match.Groups[1].Value
    $p2 = $match.Groups[2].Value
    $p3 = $match.Groups[3].Value
    
    $options = $newOfficerOptions
    if ($p2.ToLower().Contains('value=""') -or $p2.ToLower().Contains('select officer')) {
        $options = $newOfficerOptionsWithSelect
    }
    
    return $p1 + "`n" + $options + "`n                            " + $p3
})

$operatorRegex = '(?i)(<select[^>]*id="[^"]*operator[^"]*"[^>]*>)([\s\S]*?)(</select>)'
$html = [regex]::Replace($html, $operatorRegex, {
    param($match)
    $p1 = $match.Groups[1].Value
    $p2 = $match.Groups[2].Value
    $p3 = $match.Groups[3].Value
    
    $options = $newOperatorOptions
    if ($p2.ToLower().Contains('value=""') -or $p2.ToLower().Contains('select operator') -or $p2.ToLower().Contains('select')) {
        $options = $newOperatorOptionsWithSelect
    }
    
    return $p1 + "`n" + $options + "`n                            " + $p3
})

Set-Content -Path "index.html" -Value $html -Encoding UTF8
