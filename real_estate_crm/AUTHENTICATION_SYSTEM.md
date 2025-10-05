# Система аутентификации

## Обзор

Реализована полная система аутентификации с использованием JWT (JSON Web Tokens) и системой ролей/разрешений.

## Основные компоненты

### Backend (Django)

#### Установленные пакеты
- `djangorestframework-simplejwt` - JWT аутентификация
- `rest_framework_simplejwt.token_blacklist` - черный список токенов

#### Настройки токенов
- **Access Token**: действует 1 час
- **Refresh Token**: действует 7 дней
- **Token Rotation**: включен (новый refresh токен при каждом обновлении)
- **Blacklist**: старые refresh токены добавляются в черный список

#### API Endpoints

**Аутентификация:**
- `POST /api/permissions/auth/login/` - вход в систему
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
  Ответ:
  ```json
  {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token",
    "user": {
      "id": 1,
      "user_username": "string",
      "user_full_name": "string",
      "email": "string",
      "is_system_admin": false,
      "company": 1,
      "company_name": "string",
      "department": 1,
      "department_name": "string",
      "roles": []
    }
  }
  ```

- `POST /api/permissions/auth/logout/` - выход из системы
  ```json
  {
    "refresh": "jwt_refresh_token"
  }
  ```

- `POST /api/permissions/auth/password-reset/` - запрос восстановления пароля
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /api/permissions/auth/password-reset/confirm/` - подтверждение нового пароля
  ```json
  {
    "uid": "string",
    "token": "string",
    "new_password": "string"
  }
  ```

- `POST /api/token/refresh/` - обновление access токена
  ```json
  {
    "refresh": "jwt_refresh_token"
  }
  ```
  Ответ:
  ```json
  {
    "access": "new_jwt_access_token",
    "refresh": "new_jwt_refresh_token"  // если включена ротация
  }
  ```

#### Email настройки
В режиме разработки используется консольный бэкенд:
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Для production добавить SMTP настройки:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

### Frontend (React + TypeScript)

#### Установленные пакеты
- `zustand` - управление состоянием аутентификации
- `zustand/middleware` - persist middleware для сохранения в localStorage

#### Структура файлов

**Страницы:**
- `src/pages/auth/LoginPage.tsx` - страница входа
- `src/pages/auth/PasswordResetRequestPage.tsx` - запрос восстановления пароля
- `src/pages/auth/PasswordResetConfirmPage.tsx` - установка нового пароля

**API:**
- `src/api/auth.ts` - функции для работы с API аутентификации
- `src/api/axios.ts` - настроенный axios клиент с интерцепторами

**State Management:**
- `src/store/authStore.ts` - Zustand store для управления состоянием авторизации

**Компоненты:**
- `src/components/ProtectedRoute.tsx` - обертка для защищенных маршрутов

#### Маршруты

```typescript
/login                           // Страница входа
/forgot-password                 // Запрос восстановления пароля
/reset-password/:uid/:token      // Установка нового пароля
/                               // Главная страница (защищена)
/clients                        // и остальные страницы (защищены)
```

#### Автоматическое обновление токенов

Axios интерцептор автоматически:
1. Добавляет `Authorization: Bearer <access_token>` к каждому запросу
2. При получении 401 ошибки:
   - Запрашивает новый access токен через refresh токен
   - Сохраняет новые токены
   - Повторяет неудачный запрос с новым токеном
3. Если refresh токен тоже истек:
   - Очищает состояние авторизации
   - Перенаправляет на страницу входа

#### Auth Store

```typescript
// Использование в компонентах
import { useAuthStore } from '../store/authStore';

const { user, isAuthenticated, login, logout } = useAuthStore();

// Вход
await login(username, password);

// Выход
await logout();

// Проверка авторизации
if (isAuthenticated) {
  // пользователь авторизован
}

// Данные пользователя
console.log(user?.user_full_name);
console.log(user?.company_name);
console.log(user?.department_name);
```

## Безопасность

### Токены
- Access токены короткоживущие (1 час) - минимизация риска при утечке
- Refresh токены долгоживущие (7 дней) - удобство для пользователя
- Ротация refresh токенов - старые токены становятся недействительными
- Blacklist - предотвращает повторное использование старых токенов

### Пароли
- Минимум 8 символов
- Хранятся в виде хеша (Django PBKDF2)
- Восстановление только через email

### API
- CORS настроен только для фронтенда
- Все защищенные endpoints требуют валидный JWT токен
- Автоматический выход при истечении refresh токена

## Запуск и тестирование

### Backend
```bash
cd backend
py.exe manage.py migrate
py.exe manage.py runserver
```

### Frontend
```bash
cd frontend-new
npm install
npm run dev
```

### Создание тестового пользователя
```bash
cd backend
py.exe manage.py createsuperuser
```

## Интеграция с системой разрешений

Система аутентификации полностью интегрирована с системой ролей и разрешений:

1. При входе возвращается полная информация о профиле пользователя
2. Включены роли пользователя и их разрешения
3. В backend используется `PermissionsBackend` для проверки прав доступа
4. В frontend можно проверять разрешения через данные пользователя

## Примеры использования

### Вход в систему
1. Пользователь открывает `/login`
2. Вводит username и password
3. При успехе перенаправляется на главную страницу
4. Токены сохраняются в localStorage

### Восстановление пароля
1. Пользователь открывает `/forgot-password`
2. Вводит email
3. Получает письмо со ссылкой (в dev режиме - в консоли)
4. Переходит по ссылке `/reset-password/:uid/:token`
5. Вводит новый пароль
6. Перенаправляется на страницу входа

### Автоматическое обновление токена
1. Пользователь работает в системе
2. Access токен истекает через час
3. При следующем запросе получает 401
4. Axios автоматически обновляет токен
5. Запрос повторяется успешно
6. Пользователь ничего не замечает

### Выход из системы
1. Пользователь нажимает на аватар в AppBar
2. Выбирает "Выйти"
3. Refresh токен добавляется в blacklist
4. Локальное состояние очищается
5. Перенаправление на `/login`

## Troubleshooting

### Email не отправляется
- В dev режиме письма выводятся в консоль Django
- Проверьте настройки SMTP для production

### Токен быстро истекает
- Access токен истекает через 1 час (это нормально)
- Refresh токен обновляет его автоматически
- Если не работает - проверьте axios интерцептор

### 401 на всех запросах
- Проверьте, что токен сохраняется в localStorage
- Проверьте, что axios добавляет Authorization заголовок
- Проверьте время на сервере и клиенте

### Не работает logout
- Убедитесь, что token_blacklist в INSTALLED_APPS
- Проверьте, что миграции применены
- Проверьте, что refresh токен передается в запросе
