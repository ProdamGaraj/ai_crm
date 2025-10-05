# 🚨 СРОЧНО! Решение CORS проблемы

## Твоя ошибка:
```
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

Это означает **backend запущен со старым кодом** без CORS настроек!

---

## ⚡ БЫСТРОЕ РЕШЕНИЕ (3 шага)

### 1️⃣ Получи последние изменения
```bash
cd s:\ai_crm\real_estate_crm
git pull origin dev
```

### 2️⃣ УБЕЙ ВСЕ процессы Python
```powershell
# Найти процессы на порту 8000
netstat -ano | findstr :8000

# Увидишь что-то вроде:
# TCP  127.0.0.1:8000  0.0.0.0:0  LISTENING  12345
#                                            ^^^^^ это PID

# Убить процесс (замени 12345 на свой PID)
taskkill /PID 12345 /F
```

Или проще - закрой **ВСЕ** терминалы и открой новый!

### 3️⃣ Запусти сервер ЗАНОВО
```bash
cd s:\ai_crm\real_estate_crm\backend
py.exe manage.py runserver
```

### 4️⃣ Открой сайт в ИНКОГНИТО
- Chrome/Edge: **Ctrl + Shift + N**
- Firefox: **Ctrl + Shift + P**

Открой: http://localhost:5175/login

Войди: **manager1** / **test123456**

**Должно работать!** ✅

---

## 🔍 Если не помогло - ДИАГНОСТИКА

Запусти скрипт для автоматической проверки:

```powershell
cd s:\ai_crm\real_estate_crm
powershell -ExecutionPolicy Bypass -File check_cors.ps1
```

Скрипт проверит:
- ✅ Git статус
- ✅ Настройки CORS в settings.py
- ✅ Запущен ли Django
- ✅ CORS заголовки в ответах

---

## 📋 Ручная проверка (если нужно)

### Проверь, что изменения применились:

```bash
cd s:\ai_crm\real_estate_crm\backend
findstr /N "5175" real_estate_project\settings.py
```

**Должно быть:**
```
143:    "http://localhost:5175",  # Для друга
```

Если **НЕТ** → сделай `git pull` снова!

### Проверь CORS через curl:

```bash
curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ -H "Origin: http://localhost:5175" -H "Access-Control-Request-Method: POST" -v
```

**Должны увидеть:**
```
< Access-Control-Allow-Origin: http://localhost:5175
< Access-Control-Allow-Credentials: true
```

Если **НЕТ** этих заголовков → сервер со старым кодом!

---

## 🆘 Если НИЧЕГО не помогает

### Последняя надежда - временное решение:

Открой `backend/real_estate_project/settings.py` и добавь:

```python
# ВРЕМЕННО для отладки
CORS_ALLOW_ALL_ORIGINS = True
```

Перезапусти сервер. Если заработало → проблема была в настройках.

---

## 📸 Отправь мне, если не работает:

1. **Скриншот DevTools:**
   - F12
   - Network
   - Попытка входа
   - Клик на запрос `/login/`
   - Headers → Response Headers

2. **Вывод команды:**
   ```bash
   curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ -H "Origin: http://localhost:5175" -v
   ```

3. **Вывод команды:**
   ```bash
   findstr /N "CORS" backend\real_estate_project\settings.py
   ```

---

## ⚠️ ВАЖНО!

**После каждого `git pull` ОБЯЗАТЕЛЬНО перезапускай Django сервер!**

Settings.py не перезагружается автоматически - нужен полный перезапуск!
