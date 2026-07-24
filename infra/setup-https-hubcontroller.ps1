# Rodar como Administrador (botao direito no PowerShell > Executar como administrador)
# Configura HTTPS (certificado autoassinado) para hubcontroller.com.br no IIS

$hostName = "hubcontroller.com.br"

Import-Module WebAdministration

# Localiza o site com o binding de host header hubcontroller.com.br
$site = Get-Website | Where-Object {
    $_.bindings.Collection | Where-Object { $_.bindingInformation -like "*:80:$hostName" }
}

if (-not $site) {
    Write-Host "Nao encontrei nenhum site IIS com binding para $hostName na porta 80. Verifique manualmente no IIS Manager." -ForegroundColor Red
    exit 1
}

Write-Host "Site encontrado: $($site.Name)"

# Cria certificado autoassinado valido por 5 anos
$cert = New-SelfSignedCertificate `
    -DnsName $hostName `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -FriendlyName "hubcontroller.com.br (self-signed)" `
    -NotAfter (Get-Date).AddYears(5)

Write-Host "Certificado criado: $($cert.Thumbprint)"

# Adiciona binding HTTPS (porta 443) ao site, associado ao certificado
New-WebBinding -Name $site.Name -Protocol https -Port 443 -HostHeader $hostName -SslFlags 1

$binding = Get-WebBinding -Name $site.Name -Protocol https -HostHeader $hostName
$binding.AddSslCertificate($cert.Thumbprint, "My")

Write-Host "Binding HTTPS adicionado em $hostName`:443"

# Libera a porta 443 no firewall do Windows (se ainda nao existir a regra)
if (-not (Get-NetFirewallRule -DisplayName "HTTPS-hubcontroller" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "HTTPS-hubcontroller" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
    Write-Host "Regra de firewall criada para a porta 443"
}

# Exporta o certificado publico (.cer) para distribuir/instalar nas maquinas dos usuarios
$exportPath = "C:\Users\robot1\Documents\automation-hub\infra\hubcontroller-cert.cer"
Export-Certificate -Cert $cert -FilePath $exportPath | Out-Null

Write-Host ""
Write-Host "Pronto. Teste em: https://$hostName/" -ForegroundColor Green
Write-Host "Certificado publico exportado em: $exportPath" -ForegroundColor Yellow
Write-Host "Para os navegadores nao mostrarem aviso de 'nao seguro', importe esse .cer em 'Autoridades de Certificacao Raiz Confiaveis' em cada maquina (ou distribua via GPO)." -ForegroundColor Yellow
