param(
    [Parameter(Mandatory=$true)][string]$PngPath,
    [string]$OutPath
)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime]

function Await($WinRtTask, $ResultType) {
    $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]
    $netTask = $asTask.MakeGenericMethod($ResultType).Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

if (-not $OutPath) { $OutPath = $PngPath + '.ocr.txt' }
if (-not (Test-Path -LiteralPath $OutPath)) { New-Item -ItemType File -Path $OutPath -Force | Out-Null }

$pngAbs = [System.IO.Path]::GetFullPath((Resolve-Path $PngPath).Path)
$outAbs = [System.IO.Path]::GetFullPath((Resolve-Path $OutPath).Path)

$path = [Windows.Storage.StorageFile]::GetFileFromPathAsync($pngAbs)
$file = Await $path ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$lines = @($result.Text) + @($result.Lines | ForEach-Object { $_.Text })
[System.IO.File]::WriteAllLines($outAbs, $lines)
Write-Output ("lines=" + $lines.Count)