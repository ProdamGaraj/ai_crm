# Инструкция для исправления CORS ошибки

## Для вашего друга

Привет! У тебя была ошибка CORS при попытке входа. Проблема была в **неправильной настройке CORS на backend**.

### Что было исправлено:

1. ✅ Добавлен порт 5175 в `CORS_ALLOWED_ORIGINS`
2. ✅ Добавлено `CORS_ALLOW_CREDENTIALS = True` (необходимо для JWT)
3. ✅ Добавлен список `CORS_ALLOW_HEADERS` с заголовком `authorization`
4. ✅ Исправлен порядок middleware - `CorsMiddleware` теперь идёт ПЕРЕД `CommonMiddleware`

### Что нужно сделать:

#### 1. Получи последние изменения из репозитория

```bash
git pull origin dev
```

#### 2. Перезапусти Django сервер

**ВАЖНО**: Обязательно перезапусти сервер, иначе изменения не вступят в силу!

```bash
# Если сервер запущен - останови его (Ctrl+C)
cd backend
py.exe manage.py runserver
```

#### 3. Очисти кеш браузера

- Нажми `Ctrl + Shift + Delete`
- Выбери "Кеш" или "Cached images and files"
- Очисти кеш

Или просто используй режим **инкогнито** (Ctrl + Shift + N)

#### 4. Попробуй войти снова

1. Открой http://localhost:5175/login
2. Введи username: **manager1** 
3. Введи password: **test123456**
4. Должно работать! ✅

### Если всё ещё не работает:

1. **Открой DevTools** (F12)
2. Перейди на вкладку **Network**
3. Попробуй войти
4. Найди запрос к `/api/permissions/auth/login/`
5. Проверь **Response Headers**:
   
   Должно быть:
   ```
   Access-Control-Allow-Origin: http://localhost:5175
   Access-Control-Allow-Credentials: true
   ```

6. Если этих заголовков нет - значит сервер не перезапущен или изменения не применились

### Для проверки CORS настроек:

Открой в браузере:
```
http://127.0.0.1:8000/api/permissions/roles/
```

Если видишь список ролей (или ошибку 401, но НЕ CORS ошибку) - значит CORS работает!

### Технические детали (если интересно):

**Проблема была в том, что:**
- При JWT аутентификации браузер отправляет **preflight запрос** (OPTIONS)
- Для preflight нужно явно разрешить заголовок `Authorization`
- Нужно включить `CORS_ALLOW_CREDENTIALS` для работы с токенами
- `CorsMiddleware` должен обрабатывать запросы ДО других middleware

**Теперь исправлено в `backend/real_estate_project/settings.py`:**

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ← Теперь здесь!
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",  # ← Твой порт добавлен
]

CORS_ALLOW_CREDENTIALS = True  # ← Для JWT

CORS_ALLOW_HEADERS = [  # ← Для Authorization header
    'authorization',
    'content-type',
    # ...
]
```

### Если хочешь добавить свой порт:

Отредактируй `backend/real_estate_project/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:ТВОЙ_ПОРТ",  # ← Добавь свой порт
]
```

И **обязательно перезапусти** Django сервер!

---

## Быстрая проверка

После перезапуска сервера, выполни в терминале:

```bash
curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ \
  -H "Origin: http://localhost:5175" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v
```

В ответе должно быть:
```
< Access-Control-Allow-Origin: http://localhost:5175
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Headers: authorization, content-type, ...
```

Если видишь эти заголовки - всё работает правильно! 🎉

---

**P.S.**: Полная документация по решению CORS проблем находится в файле `CORS_JWT_SOLUTION.md`
