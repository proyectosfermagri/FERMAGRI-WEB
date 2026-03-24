$cssContent = Get-Content -Path "style.css" -Raw
$htmlFiles = Get-ChildItem -Path . -Filter *.html -Recurse
$jsFiles = Get-ChildItem -Path . -Filter *.js -Recurse

$allText = ""
foreach ($file in $htmlFiles) {
    if ($file -ne $null) {
        $allText += (Get-Content -Path $file.FullName -Raw) + "`n"
    }
}
foreach ($file in $jsFiles) {
    if ($file -ne $null) {
        $allText += (Get-Content -Path $file.FullName -Raw) + "`n"
    }
}

# Find all classes and IDs in CSS.
# Regex matches .class or #id, capturing the identifier.
$pattern = '([#\.][a-zA-Z_][a-zA-Z0-9_\-]*)'
$matches = [regex]::Matches($cssContent, $pattern)

$uniqueSelectors = @{}
foreach ($match in $matches) {
    $selector = $match.Groups[1].Value
    if (-not $uniqueSelectors.ContainsKey($selector)) {
        # The clean name without . or #
        $uniqueSelectors[$selector] = $selector.Substring(1)
    }
}

$unused = @()
foreach ($selector in $uniqueSelectors.Keys) {
    $cleanName = $uniqueSelectors[$selector]
    # Simple regex to see if that word is used in HTML/JS as whole word
    $searchPattern = "(?i)\b" + [regex]::Escape($cleanName) + "\b"
    if ($allText -notmatch $searchPattern) {
        $unused += $selector
    }
}

$unused | Sort-Object | Out-File -FilePath "unused_selectors.txt"
Write-Host "Done scanning. Found $($unused.Length) unused selectors based on file contents."
