# Решение проблемы CORS при JWT аутентификации

## Проблема

При попытке входа в систему возникает ошибка CORS Policy, даже если frontend URL добавлен в `CORS_ALLOWED_ORIGINS`.

### Типичная ошибка в консоли браузера:
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/permissions/auth/login/' 
from origin 'http://localhost:5175' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Credentials' header in the response is '' 
which must be 'true' when the request's credentials mode is 'include'.
```

## Причина

При работе с JWT токенами и cookies браузер отправляет **preflight запрос** (OPTIONS) для проверки, разрешены ли:
1. Cross-origin запросы
2. Отправка credentials (cookies, authorization headers)
3. Использование кастомных заголовков (Authorization)

Недостаточно просто добавить URL в `CORS_ALLOWED_ORIGINS` - нужно также:
- Разрешить отправку credentials
- Явно указать разрешённые заголовки, включая `Authorization`

## Решение

### Файл: `backend/real_estate_project/settings.py`

```python
# 1. Список разрешённых origins (добавьте все порты, которые используются)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",  # Новый порт
    "http://localhost:3000",  # На случай, если кто-то использует React на порту 3000
    'https://your-domain.com',  # Production domain
]

# 2. ВАЖНО! Разрешить отправку credentials (необходимо для JWT в заголовках)
CORS_ALLOW_CREDENTIALS = True

# 3. ВАЖНО! Явно указать разрешённые заголовки
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',        # ← КРИТИЧНО для JWT!
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## Проверка настроек

### 1. Проверьте, что middleware правильно настроен

В `MIDDLEWARE` должно быть:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ← Должен быть ПЕРЕД CommonMiddleware!
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... остальные middleware
]
```

**ВАЖНО**: `CorsMiddleware` должен быть **ПЕРЕД** `CommonMiddleware`!

### 2. Проверьте, что django-cors-headers установлен

```bash
cd backend
pip install django-cors-headers
```

И добавлен в `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]
```

### 3. Перезапустите Django сервер

После изменения settings.py **обязательно** перезапустите сервер:

```bash
# Остановите сервер (Ctrl+C)
# Запустите снова
cd backend
py.exe manage.py runserver
```

## Тестирование

### 1. Проверка в браузере

1. Откройте DevTools (F12)
2. Перейдите на вкладку Network
3. Попробуйте войти в систему
4. Найдите запрос к `/api/permissions/auth/login/`
5. Проверьте Response Headers:
   ```
   Access-Control-Allow-Origin: http://localhost:5175
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Headers: authorization, content-type, ...
   ```

### 2. Проверка через curl

```bash
# Preflight запрос (OPTIONS)
curl -X OPTIONS http://127.0.0.1:8000/api/permissions/auth/login/ \
  -H "Origin: http://localhost:5175" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v

# Должны увидеть:
# Access-Control-Allow-Origin: http://localhost:5175
# Access-Control-Allow-Credentials: true
```

### 3. Проверка фактического запроса

```bash
curl -X POST http://127.0.0.1:8000/api/permissions/auth/login/ \
  -H "Origin: http://localhost:5175" \
  -H "Content-Type: application/json" \
  -d '{"username":"manager1","password":"test123456"}' \
  -v
```

## Дополнительные настройки (опционально)

### Разрешить все origins в development (НЕ для production!)

```python
# Только для локальной разработки!
CORS_ALLOW_ALL_ORIGINS = True  # Разрешить ВСЕ origins
```

⚠️ **ВНИМАНИЕ**: Никогда не используйте `CORS_ALLOW_ALL_ORIGINS = True` в production!

### Настройки для production

В production лучше использовать переменные окружения:

```python
import os

# Читаем разрешённые origins из переменной окружения
ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS.split(',')]

# Пример использования:
# export CORS_ALLOWED_ORIGINS="https://frontend.example.com,https://app.example.com"
```

## Частые ошибки

### ❌ Ошибка 1: Забыли перезапустить сервер
**Решение**: После изменения `settings.py` всегда перезапускайте Django сервер

### ❌ Ошибка 2: CorsMiddleware в неправильном месте
**Решение**: Убедитесь, что `corsheaders.middleware.CorsMiddleware` идёт ПЕРЕД `CommonMiddleware`

### ❌ Ошибка 3: Не указан CORS_ALLOW_CREDENTIALS
**Решение**: Добавьте `CORS_ALLOW_CREDENTIALS = True` для работы с JWT токенами

### ❌ Ошибка 4: Не указан заголовок Authorization
**Решение**: Добавьте `'authorization'` в `CORS_ALLOW_HEADERS`

### ❌ Ошибка 5: Используется IP вместо localhost (или наоборот)
**Решение**: Добавьте оба варианта:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### ❌ Ошибка 6: HTTPS vs HTTP
**Решение**: Убедитесь, что протокол (http/https) совпадает с тем, что использует frontend

## Проверка текущих настроек

Создайте временный view для проверки CORS настроек:

```python
# В любом views.py
from django.http import JsonResponse
from django.conf import settings

def cors_debug(request):
    return JsonResponse({
        'CORS_ALLOWED_ORIGINS': settings.CORS_ALLOWED_ORIGINS,
        'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
        'CORS_ALLOW_HEADERS': getattr(settings, 'CORS_ALLOW_HEADERS', []),
    })

# В urls.py
urlpatterns = [
    path('api/cors-debug/', cors_debug),
]
```

Затем откройте: http://127.0.0.1:8000/api/cors-debug/

## Для вашего друга

Скажите другу:

1. **Убедитесь, что backend обновлён** - pull последние изменения из репозитория
2. **Перезапустите Django сервер** - Ctrl+C и `py.exe manage.py runserver` снова
3. **Очистите кеш браузера** - или используйте режим инкогнито
4. **Проверьте, что frontend запущен на правильном порту** - http://localhost:5175

Если проблема сохраняется, проверьте:
- Открыта ли вкладка Network в DevTools
- Какой именно запрос выдаёт ошибку CORS
- Какие заголовки приходят в ответе

## Альтернативное решение (временное)

Если CORS всё ещё не работает, можно временно использовать proxy в Vite:

### Файл: `frontend-new/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
```

Тогда frontend будет делать запросы к `/api/...` вместо `http://127.0.0.1:8000/api/...`, и CORS не потребуется.

Но **лучше настроить CORS правильно**, так как proxy не будет работать в production!

## Итоговые настройки для текущего проекта

Уже применены в `backend/real_estate_project/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",  # ← Добавлено для друга
    'https://5mpxwrp0-5174.euw.devtunnels.ms',
]

CORS_ALLOW_CREDENTIALS = True  # ← Добавлено

CORS_ALLOW_HEADERS = [  # ← Добавлено
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

**После применения этих настроек CORS должен работать для всех портов!** 🎉
