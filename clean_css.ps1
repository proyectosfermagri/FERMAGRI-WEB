$cssPath = "style.css"
$content = Get-Content -Path $cssPath -Raw

$unusedClasses = @(
    "boton-play", "btn-volver-catalogo", "contenedor-grano",
    "contenedor-regresar-detalle", "contenedor-textura", "etiqueta-textura",
    "hero-container", "hero-mobile-controls", "hero-quick-btns",
    "hero-search", "hq-btn", "hq-green", "hq-yellow", "link-volver",
    "m-btn", "mhero-badge", "miniatura-video", "mobile-home-controls",
    "m-quick-actions", "m-search-box", "overlay-video", "producto-dosis",
    "producto-presentacion", "ver-grano-flotante", "video-aspecto",
    "whatsapp-float"
)

foreach ($c in $unusedClasses) {
    # Match the class selector, possibly with pseudo-classes like :hover or .active chained
    # and match the content of the block up to the closing brace.
    # Note: this simple regex assumes no nested braces inside the block.
    # It will match '.classname' or '.classname:hover' or '.classname.active' etc.
    # We use (?s) for dot to match newlines.
    
    $pattern1 = '(?sm)^[\s]*\.' + $c + '(?:[^{]*)\{[^{}]*\}[\s]*'
    $content = $content -replace $pattern1, "`r`n`r`n"
    
    # Also handle if it's part of a comma separated list (e.g. .other-class, .unused-class { ... })
    # This is trickier, so let's just do a pass to remove comma-separated instances where possible,
    # or just let them be if they share a block with a used class. The user just wants unused blocks removed.
}

# Clean up multiple empty lines
$content = $content -replace '(?m)^\s+$', ""
$content = $content -replace '(?s)\r\n\r\n\r\n+', "`r`n`r`n"

$content | Set-Content -Path $cssPath

Write-Host "CSS Cleanup completed."
