# Script para criar a VM Oracle Cloud (A1.Flex) automaticamente
# Roda indefinidamente com renovação automática de token a cada 50 minutos
# Para parar: feche o terminal ou pressione Ctrl+C

$COMPARTMENT_ID = "ocid1.tenancy.oc1..aaaaaaaayxffp5rs7fca7efucwrxxf4hxtwmlzeqr26by42pmwwiitgp7qnq"
$SUBNET_ID      = "ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaaqp7jwln2pbnzqq2icesaaxsivhvtbmrlwhkcmejq74mbbbm325ga"
$SSH_PUBLIC_KEY = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC8ReyScUTNM8aox1RQTq1DMfqSPqx4M6AF03o4DReyYk6z9v615lIurumz1QAtgGmQh0vM4P3gGQp8EkCJzCOfNSwMMqAHmQqWCCd0cGz/GoQN0tNCAWMPKjCOm5Q1E6+GWz9VyVJHcfiF9tsUVJb2dULBjnpR+wRKNRk6BA7wlggr0XZYhwnqV+zuaE5cRvbk5zVQdmvPJz6xaNqdlEu3L3QJK4jPrO70B++JIi1BvKbf3mT/QviPSuEFa2Xcy4SH4WCAVuAHvV3PGVk0Sa5+8Jvle623Baoq2Alopt09lOjtNHG/BqAy7Y27pQa13VDTUKHrKrltGZdmXegbdek3 ssh-key-2026-06-26"
$SHAPE          = "VM.Standard.A1.Flex"
$AD             = "Dvuk:SA-SAOPAULO-1-AD-1"
$IMAGE_ID       = "ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaemf52b7af7ncncxz6pdc6hrlkdmylvwejfzpwnpbuhlfxwhrno6a"

$OCI        = "C:\Users\davi.inov\AppData\Roaming\Python\Python313\Scripts\oci.exe"
$AUTH_ARGS  = @("--auth", "security_token", "--profile", "automation-hub")
$WAIT_SEC   = 60
$REFRESH_MIN = 50  # renova o token a cada 50 minutos (expira em 60)

# Arquivos temporários
$SSH_KEY_FILE      = "$env:TEMP\oci_ssh_key.pub"
$SHAPE_CONFIG_FILE = "$env:TEMP\oci_shape_config.json"
$SSH_PUBLIC_KEY | Out-File -FilePath $SSH_KEY_FILE -Encoding ascii -NoNewline
[System.IO.File]::WriteAllText($SHAPE_CONFIG_FILE, '{"ocpus": 2, "memoryInGBs": 12}')

Write-Host "=============================="    -ForegroundColor Cyan
Write-Host " Automation Hub - Oracle Retry"    -ForegroundColor Cyan
Write-Host "=============================="    -ForegroundColor Cyan
Write-Host " Tentando a cada $WAIT_SEC segundos"
Write-Host " Token renovado automaticamente a cada $REFRESH_MIN min"
Write-Host " Para parar: Ctrl+C"
Write-Host ""

$attempt      = 0
$lastRefresh  = Get-Date

while ($true) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"

    # ── Renovação automática do token ─────────────────────────
    $minutesSinceRefresh = (New-TimeSpan -Start $lastRefresh -End (Get-Date)).TotalMinutes
    if ($minutesSinceRefresh -ge $REFRESH_MIN) {
        Write-Host "[$timestamp] Renovando token de sessão..." -ForegroundColor Magenta
        $refreshResult = & $OCI session refresh --profile automation-hub 2>&1 | Out-String
        if ($refreshResult -match "Refreshed" -or $LASTEXITCODE -eq 0) {
            $lastRefresh = Get-Date
            Write-Host "[$timestamp] Token renovado com sucesso." -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] AVISO: Falha ao renovar token. Continuando com token atual..." -ForegroundColor Yellow
            # Notifica o usuário via popup para re-autenticar manualmente se necessário
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show(
                "O token Oracle expirou e nao foi possivel renovar automaticamente.`n`nPor favor:`n1. Abra o terminal`n2. Execute: oci session authenticate --region sa-saopaulo-1 --profile automation-hub`n3. Faca o login no browser`n`nO script vai continuar tentando.",
                "Automation Hub - Token Expirado",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            ) | Out-Null
            $lastRefresh = Get-Date  # reseta para evitar popups repetidos
        }
        $timestamp = Get-Date -Format "HH:mm:ss"
    }

    # ── Tentativa de criar a VM ───────────────────────────────
    Write-Host "[$timestamp] Tentativa $attempt..." -NoNewline

    $result = & $OCI compute instance launch @AUTH_ARGS `
        --compartment-id $COMPARTMENT_ID `
        --availability-domain $AD `
        --shape $SHAPE `
        --shape-config "file://$SHAPE_CONFIG_FILE" `
        --image-id $IMAGE_ID `
        --subnet-id $SUBNET_ID `
        --assign-public-ip true `
        --ssh-authorized-keys-file $SSH_KEY_FILE `
        --display-name "automation-hub-vm" 2>&1 | Out-String

    # ── Sucesso ───────────────────────────────────────────────
    if ($LASTEXITCODE -eq 0) {
        Write-Host " SUCESSO!" -ForegroundColor Green
        $instance   = ($result | ConvertFrom-Json).data
        $instanceId = $instance.id

        Start-Sleep -Seconds 15
        $vnic     = (& $OCI compute instance list-vnics @AUTH_ARGS --instance-id $instanceId 2>&1 | ConvertFrom-Json).data[0]
        $publicIp = $vnic.'public-ip'

        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host " VM CRIADA COM SUCESSO!"              -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host " IP Publico: $publicIp"               -ForegroundColor Yellow
        Write-Host " SSH: ssh -i ssh-key-2026-06-26.key ubuntu@$publicIp" -ForegroundColor Cyan
        Write-Host "=====================================" -ForegroundColor Green

        # Salva IP na Área de Trabalho
        $desktopFile = "$env:USERPROFILE\Desktop\oracle-vm-ip.txt"
        @"
VM Oracle Cloud criada com sucesso!

IP Publico: $publicIp

Comando SSH:
ssh -i "$env:USERPROFILE\Downloads\ssh-key-2026-06-26.key" ubuntu@$publicIp

Proximo passo: rode o setup.sh na VM
"@ | Out-File -FilePath $desktopFile -Encoding utf8

        # Popup com IP antes de desligar
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show(
            "VM Oracle criada com sucesso!`n`nIP: $publicIp`n`nO IP foi salvo na Area de Trabalho em 'oracle-vm-ip.txt'`n`nO computador vai desligar em 60 segundos.`nPara cancelar abra o terminal e rode: shutdown /a",
            "Automation Hub - VM Criada!",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        ) | Out-Null

        shutdown /s /t 60
        exit 0
    }

    # ── Sem capacidade — continua tentando ───────────────────
    $isRetryable = $result -match "Out of capacity|out of host capacity|InternalError|Out of host|timed out|RequestException|connection|NotAuthenticated|unauthorized"

    if ($isRetryable) {
        Write-Host " Sem capacidade. Aguardando $WAIT_SEC s..." -ForegroundColor Yellow
    } else {
        Write-Host " Erro inesperado:" -ForegroundColor Red
        Write-Host $result
        Write-Host "Script pausado. Verifique o erro acima." -ForegroundColor Red
        exit 1
    }

    Start-Sleep -Seconds $WAIT_SEC
}
