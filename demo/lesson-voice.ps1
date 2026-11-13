$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$lessonRoot = Split-Path -Parent $PSScriptRoot
$audioFolder = Join-Path $PSScriptRoot 'public/lesson'
New-Item -ItemType Directory -Force -Path $audioFolder | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Zira Desktop')
$speaker.Rate = 1
try {
    foreach ($step in (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'lesson.json') -Raw -Encoding utf8 | ConvertFrom-Json)) {
        $speaker.SetOutputToWaveFile((Join-Path $audioFolder ($step.id + '.wav')))
        $speaker.Speak($step.voice)
        $speaker.SetOutputToNull()
    }
} finally { $speaker.Dispose() }
