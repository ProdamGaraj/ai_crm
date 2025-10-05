# Чеклист диагностики CORS проблемы

## Симптом у друга:
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/permissions/auth/login/' 
from origin 'http://localhost:5175' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ❌ Ошибка: "No 'Access-Control-Allow-Origin' header"

Это означает, что **backend вообще не отвечает CORS заголовками** → старая версия кода без исправлений!

---

## 🔍 Диагностика (для друга)

### Шаг 1: Проверь, что получил последние изменения

```bash
cd s:\ai_crm\real_estate_crm
git status
git pull origin dev
```

**Что должно быть:**
- Файл `backend/real_estate_project/settings.py` изменён
- Появились новые файлы: `CORS_JWT_SOLUTION.md`, `CORS_FIX_INSTRUCTIONS.md`

### Шаг 2: Проверь содержимое settings.py

```bash
cd backend
```

Открой файл `real_estate_project/settings.py` и проверь:

**1. Должен быть порт 5175:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",  # ← Должна быть эта строка!
]
```

**2. Должны быть дополнительные настройки:**
```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    # ...
]
```

**3. Middleware в правильном порядке:**
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ← Должен быть здесь (вторым)!
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

❌ **Если чего-то нет** → делай `git pull origin dev` снова!

### Шаг 3: ПОЛНОСТЬЮ ОСТАНОВИ Django сервер

**КРИТИЧНО!** Не просто Ctrl+C, а:

1. Нажми **Ctrl+C** в терминале с Django сервером
2. Проверь, что процесс действительно остановлен:
   ```powershell
   Get-Process | Where-Object { $_.ProcessName -like "*python*" }
   ```
3. Если видишь процессы Python, которые держат порт 8000:
   ```powershell
   # Найти процесс на порту 8000
   netstat -ano | findstr :8000
   
   # Убить процесс (замени <PID> на ID процесса)
   taskkill /PID <PID> /F
   ```

### Шаг 4: Запусти сервер ЗАНОВО

```bash
cd s:\ai_crm\real_estate_crm\backend
py.exe manage.py runserver
```

**Важно:** Запусти в НОВОМ терминале, не в том же, где был старый сервер!

### Шаг 5: Проверь, что сервер запустился с новыми настройками

После запуска сервера, в **ДРУГОМ** терминале выполни:

```bash
curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ -H "Origin: http://localhost:5175" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type" -v
```

**Что ДОЛЖНО быть в ответе:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:5175
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Headers: accept, accept-encoding, authorization, content-type, ...
```

❌ **Если НЕТ заголовков `Access-Control-Allow-*`** → сервер запущен со старым кодом!

### Шаг 6: Очисти кеш браузера

**Важно!** Браузер мог закешировать CORS ошибку.

**Вариант 1 (лучше):** Режим инкогнито
- Chrome/Edge: **Ctrl + Shift + N**
- Firefox: **Ctrl + Shift + P**

**Вариант 2:** Очисти кеш
1. Нажми **Ctrl + Shift + Delete**
2. Выбери "Кэш" или "Cached images and files"
3. Очисти за "Всё время"

### Шаг 7: Попробуй войти

1. Открой http://localhost:5175/login (в режиме инкогнито!)
2. Username: **manager1**
3. Password: **test123456**
4. Нажми "Войти"

---

## 🧪 Быстрая проверка (для отладки)

### Проверка 1: Backend запущен?

```bash
curl http://127.0.0.1:8000/api/
```

Если ответ - ошибка подключения → backend не запущен!

### Проверка 2: CORS включён?

```bash
curl -I http://127.0.0.1:8000/api/permissions/roles/
```

Посмотри на заголовки. Если есть `Access-Control-Allow-Origin` → CORS работает!

### Проверка 3: Какая версия кода?

Открой файл `backend/real_estate_project/settings.py` и найди строку:

```python
CORS_ALLOWED_ORIGINS = [
```

Посчитай, сколько там портов. Должно быть **4 строки** (5173, 5174, 5175, devtunnels).

---

## 🔥 Если ничего не помогло

### Вариант 1: Временное решение - разрешить все origins

⚠️ **Только для локальной разработки!**

В `backend/real_estate_project/settings.py` **временно** добавь:

```python
# ВРЕМЕННО! Только для отладки!
CORS_ALLOW_ALL_ORIGINS = True
```

Перезапусти сервер. Если теперь работает → проблема была в списке origins.

### Вариант 2: Проверь, что django-cors-headers установлен

```bash
cd backend
pip list | findstr cors
```

Должно быть:
```
django-cors-headers    4.x.x
```

Если нет:
```bash
pip install django-cors-headers
```

### Вариант 3: Используй 127.0.0.1 вместо localhost

Иногда браузер различает `localhost` и `127.0.0.1`.

**В settings.py добавь:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",  # ← Добавь эти
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    'https://5mpxwrp0-5174.euw.devtunnels.ms',
]
```

---

## ✅ Контрольный список

Друг должен проверить ВСЁ по порядку:

- [ ] 1. Выполнил `git pull origin dev`
- [ ] 2. Проверил, что в settings.py есть порт 5175
- [ ] 3. Проверил, что в settings.py есть `CORS_ALLOW_CREDENTIALS = True`
- [ ] 4. Проверил, что `CorsMiddleware` на 2-й позиции в MIDDLEWARE
- [ ] 5. **ПОЛНОСТЬЮ** остановил Django сервер (не просто Ctrl+C)
- [ ] 6. Убил все процессы Python, держащие порт 8000
- [ ] 7. Запустил сервер в НОВОМ терминале
- [ ] 8. Проверил curl командой, что CORS заголовки есть
- [ ] 9. Очистил кеш браузера или использовал инкогнито
- [ ] 10. Попробовал войти снова

---

## 📝 Лог для отладки

Попроси друга отправить вывод этих команд:

### 1. Проверка git статуса:
```bash
cd s:\ai_crm\real_estate_crm
git log --oneline -5
git status
```

### 2. Проверка settings.py:
```bash
cd backend
findstr /N "CORS_ALLOWED_ORIGINS" real_estate_project\settings.py
findstr /N "CORS_ALLOW_CREDENTIALS" real_estate_project\settings.py
findstr /N "CorsMiddleware" real_estate_project\settings.py
```

### 3. Проверка Django сервера:
```bash
netstat -ano | findstr :8000
```

### 4. Проверка CORS через curl:
```bash
curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ -H "Origin: http://localhost:5175" -H "Access-Control-Request-Method: POST" -v
```

### 5. Проверка браузера (DevTools):
- F12 → Network
- Попытка входа
- Клик на запрос `/login/`
- Вкладка "Headers"
- Скриншот "Response Headers"

---

## 💡 Самая частая причина

**95% случаев:** Сервер запущен со старым кодом потому что:
1. Не сделан `git pull`
2. Сервер не перезапущен после `git pull`
3. Запущено **два** сервера одновременно (старый + новый)
4. Браузер кешировал CORS ошибку

**Решение:** 
1. `git pull`
2. Убить ВСЕ процессы Python
3. Запустить сервер в новом терминале
4. Открыть сайт в режиме инкогнито
