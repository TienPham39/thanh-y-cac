param([string]$Email = 'admin@thanhycac.com')
$ErrorActionPreference = 'Stop'
$password = Read-Host 'Nhap mat khau admin (12-72 byte)' -AsSecureString
$confirmation = Read-Host 'Nhap lai mat khau' -AsSecureString
try {
    $plain = [System.Net.NetworkCredential]::new('', $password).Password
    $confirmPlain = [System.Net.NetworkCredential]::new('', $confirmation).Password
    if ($plain -cne $confirmPlain) { throw 'Hai mat khau khong khop.' }
    # Send over stdin, never through process arguments or command history.
    $previousEncoding = $OutputEncoding
    try {
        $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $plain | & php (Join-Path $PSScriptRoot 'set-admin-password.php') $Email
        if ($LASTEXITCODE -ne 0) { throw 'Khong luu duoc mat khau.' }
    } finally { $OutputEncoding = $previousEncoding }
} finally {
    $plain = $null
    $confirmPlain = $null
    $password.Dispose()
    $confirmation.Dispose()
}
