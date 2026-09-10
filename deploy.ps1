# Manual deploy of the DigitalBox UI to Amplify.
#
# The Amplify app (digitalbox-ui / d5fyu1cc9a713) is a manual-deploy app - it is not
# connected to GitHub, so `git push` does nothing. Run this script to ship a UI change:
#
#   pwsh ./deploy.ps1
#
# It builds with the production API URL baked in, zips dist/, and pushes the bundle to
# Amplify's master branch. The custom domain (digitalbox.hendersonsoftwarelabs.com), the
# CSP/security headers, and the SPA rewrite rule are set at the app level and are NOT
# touched by a redeploy - if the API origin ever changes, update the CSP separately with
#   aws amplify update-app --app-id d5fyu1cc9a713 --custom-headers file://<yaml>
#
# Prereqs: node/npm, python (for the zip), and the AWS CLI authenticated to account
# 441627938519 in us-east-1 (the same creds used for the API deploys).

$ErrorActionPreference = 'Stop'
$AppId  = 'd5fyu1cc9a713'
$Branch = 'master'
$Region = 'us-east-1'
$ApiUrl = 'https://digitalbox-api.hendersonsoftwarelabs.com'

Set-Location $PSScriptRoot

Write-Host "==> building (VITE_API_BASE_URL=$ApiUrl)" -ForegroundColor Cyan
$env:VITE_API_BASE_URL = $ApiUrl
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

# sanity: the API URL must be in the bundle
if (-not (Select-String -Path dist/assets/*.js -Pattern 'digitalbox-api\.hendersonsoftwarelabs\.com' -Quiet)) {
    throw "API URL not found in the built bundle - aborting"
}

Write-Host "==> zipping dist/" -ForegroundColor Cyan
$zip = Join-Path $env:TEMP "digitalbox-ui-deploy.zip"
if (Test-Path $zip) { Remove-Item $zip }
python -c @"
import zipfile, os
with zipfile.ZipFile(r'$zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk('dist'):
        for f in fs:
            full = os.path.join(dp, f)
            z.write(full, os.path.relpath(full, 'dist'))
print('  ', os.path.getsize(r'$zip'), 'bytes')
"@
if ($LASTEXITCODE -ne 0) { throw "zip failed" }

Write-Host "==> creating Amplify deployment" -ForegroundColor Cyan
$dep = aws amplify create-deployment --region $Region --app-id $AppId --branch-name $Branch | ConvertFrom-Json
$jobId = $dep.jobId
$uploadUrl = $dep.zipUploadUrl

Write-Host "==> uploading bundle (job $jobId)" -ForegroundColor Cyan
curl.exe -sS -X PUT -H "Content-Type: application/zip" --upload-file $zip $uploadUrl
if ($LASTEXITCODE -ne 0) { throw "upload failed" }

Write-Host "==> starting deployment" -ForegroundColor Cyan
aws amplify start-deployment --region $Region --app-id $AppId --branch-name $Branch --job-id $jobId | Out-Null

Write-Host "==> waiting for build" -ForegroundColor Cyan
do {
    Start-Sleep 6
    $status = aws amplify get-job --region $Region --app-id $AppId --branch-name $Branch --job-id $jobId --query 'job.summary.status' --output text
    Write-Host "    $status"
} while ($status -notin @('SUCCEED', 'FAILED', 'CANCELLED'))

Remove-Item $zip -ErrorAction SilentlyContinue

if ($status -eq 'SUCCEED') {
    Write-Host "`n[OK] deployed -> https://digitalbox.hendersonsoftwarelabs.com" -ForegroundColor Green
} else {
    throw "deployment $status"
}
