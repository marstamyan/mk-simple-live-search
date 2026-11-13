$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot
$mainFile = Join-Path $repository 'mk-simple-live-search.php'
$source = Get-Content -LiteralPath $mainFile -Raw
$version = [regex]::Match($source, '(?m)^\s*\* Version:\s*(\S+)').Groups[1].Value
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Plugin version is missing or invalid.' }
$outputDirectory = Join-Path $repository 'artifacts'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$archivePath = Join-Path $outputDirectory "mk-simple-live-search-$version.zip"
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = @('mk-simple-live-search.php', 'README.md', 'readme.txt') | ForEach-Object { Get-Item -LiteralPath (Join-Path $repository $_) }
    foreach ($directory in @('admin', 'assets', 'includes')) {
        $files += Get-ChildItem -LiteralPath (Join-Path $repository $directory) -File -Recurse
    }
    foreach ($file in ($files | Sort-Object FullName)) {
        $relative = $file.FullName.Substring($repository.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, "mk-simple-live-search/$relative", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $archive.Dispose()
}
$builtArchive = Get-Item -LiteralPath $archivePath
[pscustomobject]@{
    File = $builtArchive.FullName
    Bytes = $builtArchive.Length
    SHA256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
} | Format-List
