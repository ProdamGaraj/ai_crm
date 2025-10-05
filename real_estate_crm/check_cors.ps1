# Скрипт для диагностики CORS проблемы
# Запустите: powershell -ExecutionPolicy Bypass -File check_cors.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ДИАГНОСТИКА CORS ПРОБЛЕМЫ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allOk = $true

# 1. Проверка Git статуса
Write-Host "[1/6] Проверка Git..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "  ⚠️  Есть несохранённые изменения" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Git чист" -ForegroundColor Green
    }
    
    $lastCommit = git log -1 --oneline
    Write-Host "  Последний коммит: $lastCommit" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Ошибка Git: $_" -ForegroundColor Red
    $allOk = $false
}

# 2. Проверка settings.py
Write-Host "`n[2/6] Проверка settings.py..." -ForegroundColor Yellow
$settingsPath = "backend\real_estate_project\settings.py"

if (Test-Path $settingsPath) {
    $content = Get-Content $settingsPath -Raw
    
    # Проверка портов
    if ($content -match "5175") {
        Write-Host "  ✅ Порт 5175 найден" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Порт 5175 НЕ найден!" -ForegroundColor Red
        $allOk = $false
    }
    
    # Проверка CORS_ALLOW_CREDENTIALS
    if ($content -match "CORS_ALLOW_CREDENTIALS\s*=\s*True") {
        Write-Host "  ✅ CORS_ALLOW_CREDENTIALS = True" -ForegroundColor Green
    } else {
        Write-Host "  ❌ CORS_ALLOW_CREDENTIALS не найден!" -ForegroundColor Red
        $allOk = $false
    }
    
    # Проверка CORS_ALLOW_HEADERS
    if ($content -match "CORS_ALLOW_HEADERS") {
        Write-Host "  ✅ CORS_ALLOW_HEADERS настроен" -ForegroundColor Green
    } else {
        Write-Host "  ❌ CORS_ALLOW_HEADERS не найден!" -ForegroundColor Red
        $allOk = $false
    }
    
    # Проверка порядка middleware
    if ($content -match "corsheaders\.middleware\.CorsMiddleware.*?django\.middleware\.common\.CommonMiddleware") {
        Write-Host "  ✅ CorsMiddleware идёт перед CommonMiddleware" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Проверьте порядок middleware!" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "  ❌ Файл settings.py не найден!" -ForegroundColor Red
    $allOk = $false
}

# 3. Проверка процессов Python
Write-Host "`n[3/6] Проверка запущенных процессов Python..." -ForegroundColor Yellow
$pythonProcesses = Get-Process | Where-Object { $_.ProcessName -like "*python*" }

if ($pythonProcesses) {
    Write-Host "  ⚠️  Найдено запущенных процессов Python: $($pythonProcesses.Count)" -ForegroundColor Yellow
    foreach ($proc in $pythonProcesses) {
        Write-Host "    - PID: $($proc.Id), Имя: $($proc.ProcessName)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ℹ️  Процессы Python не запущены" -ForegroundColor Cyan
}

# 4. Проверка порта 8000
Write-Host "`n[4/6] Проверка порта 8000..." -ForegroundColor Yellow
$port8000 = netstat -ano | Select-String ":8000"

if ($port8000) {
    Write-Host "  ✅ Порт 8000 используется (Django запущен)" -ForegroundColor Green
    Write-Host "    $port8000" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Порт 8000 свободен (Django НЕ запущен!)" -ForegroundColor Red
    $allOk = $false
}

# 5. Проверка доступности API
Write-Host "`n[5/6] Проверка доступности API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ API доступен (статус: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ❌ API недоступен: $_" -ForegroundColor Red
    $allOk = $false
}

# 6. Проверка CORS заголовков
Write-Host "`n[6/6] Проверка CORS заголовков..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5175"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "authorization,content-type"
    }
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/permissions/auth/login/" `
        -Method OPTIONS `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $corsOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $corsCredentials = $response.Headers["Access-Control-Allow-Credentials"]
    $corsHeaders = $response.Headers["Access-Control-Allow-Headers"]
    
    if ($corsOrigin) {
        Write-Host "  ✅ Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Access-Control-Allow-Origin отсутствует!" -ForegroundColor Red
        $allOk = $false
    }
    
    if ($corsCredentials -eq "true") {
        Write-Host "  ✅ Access-Control-Allow-Credentials: true" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Access-Control-Allow-Credentials: $corsCredentials" -ForegroundColor Red
        $allOk = $false
    }
    
    if ($corsHeaders -match "authorization") {
        Write-Host "  ✅ Authorization header разрешён" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Authorization header НЕ разрешён!" -ForegroundColor Red
        $allOk = $false
    }
    
} catch {
    Write-Host "  ❌ Ошибка проверки CORS: $_" -ForegroundColor Red
    $allOk = $false
}

# Итог
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "✅ ВСЁ В ПОРЯДКЕ! CORS настроен правильно." -ForegroundColor Green
    Write-Host "`nЕсли всё равно не работает:" -ForegroundColor Yellow
    Write-Host "  1. Очистите кеш браузера" -ForegroundColor White
    Write-Host "  2. Используйте режим инкогнито" -ForegroundColor White
    Write-Host "  3. Проверьте DevTools → Network → Response Headers" -ForegroundColor White
} else {
    Write-Host "❌ НАЙДЕНЫ ПРОБЛЕМЫ!" -ForegroundColor Red
    Write-Host "`nЧто делать:" -ForegroundColor Yellow
    Write-Host "  1. git pull origin dev" -ForegroundColor White
    Write-Host "  2. Остановите Django сервер (Ctrl+C)" -ForegroundColor White
    Write-Host "  3. Убейте все процессы Python (см. список выше)" -ForegroundColor White
    Write-Host "  4. Запустите сервер: cd backend; py.exe manage.py runserver" -ForegroundColor White
    Write-Host "  5. Запустите этот скрипт снова" -ForegroundColor White
}
Write-Host "========================================`n" -ForegroundColor Cyan

# Пауза
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
