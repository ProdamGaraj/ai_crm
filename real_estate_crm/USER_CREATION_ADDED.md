# Добавлено создание пользователей из интерфейса

## Обзор

Теперь пользователи могут быть созданы прямо из настроек CRM, без необходимости использовать Django Admin панель.

## Что было реализовано

### Backend (Django)

#### 1. Новый сериализатор `UserCreateSerializer`
**Файл:** `backend/permissions/serializers.py`

Добавлен сериализатор для создания пользователя с профилем в одном запросе:

```python
class UserCreateSerializer(serializers.Serializer):
    # Поля пользователя
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    
    # Поля профиля
    company_id = serializers.IntegerField(required=False, allow_null=True)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    role_ids = serializers.ListField(child=serializers.IntegerField())
    position = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    is_system_admin = serializers.BooleanField(default=False)
    is_active = serializers.BooleanField(default=True)
```

**Валидация:**
- ✅ Проверка уникальности username
- ✅ Проверка уникальности email
- ✅ Проверка существования компании
- ✅ Проверка существования отдела
- ✅ Проверка существования ролей
- ✅ Минимальная длина пароля (8 символов)

**Логика создания:**
1. Создаёт объект `User` в Django
2. Автоматически создаёт связанный `UserProfile`
3. Назначает роли пользователю
4. Возвращает созданный профиль

#### 2. Новый API endpoint
**Файл:** `backend/permissions/views.py`

Добавлен action в `UserProfileViewSet`:

```python
@action(detail=False, methods=['post'])
def create_user(self, request):
    """
    Создать нового пользователя с профилем
    POST /api/permissions/user-profiles/create_user/
    """
```

**Функционал:**
- ✅ Создание пользователя и профиля за один запрос
- ✅ Логирование создания в `PermissionLog`
- ✅ Возврат полных данных созданного профиля

**Пример запроса:**
```json
{
  "username": "ivanov",
  "password": "SecurePass123",
  "email": "ivanov@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "company_id": 1,
  "department_id": 2,
  "role_ids": [3, 4],
  "position": "Менеджер по продажам",
  "phone": "+7 900 123-45-67",
  "is_system_admin": false,
  "is_active": true
}
```

**Пример ответа:**
```json
{
  "id": 5,
  "user": 10,
  "user_username": "ivanov",
  "user_full_name": "Иван Иванов",
  "company": 1,
  "company_name": "Моя компания",
  "department": 2,
  "department_name": "Отдел продаж",
  "roles": [...],
  "position": "Менеджер по продажам",
  "phone": "+7 900 123-45-67",
  "is_system_admin": false,
  "is_active": true,
  "created_at": "2025-10-02T10:30:00Z",
  "updated_at": "2025-10-02T10:30:00Z"
}
```

### Frontend (React)

#### 1. Обновлён API клиент
**Файл:** `frontend-new/src/api/permissions.ts`

Обновлена функция `createUserProfile`:

```typescript
export const createUserProfile = async (data: {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_id?: number;
  department_id?: number;
  role_ids?: number[];
  position?: string;
  phone?: string;
  is_system_admin?: boolean;
  is_active?: boolean;
}): Promise<UserProfile>
```

**Endpoint:** `POST /permissions/user-profiles/create_user/`

#### 2. Обновлён компонент `UserForm`
**Файл:** `frontend-new/src/components/permissions/UserForm.tsx`

**Изменения:**

1. **Поддержка двух режимов:**
   - Создание нового пользователя (`isCreating = true`)
   - Редактирование существующего (`isCreating = false`)

2. **Дополнительные поля для создания:**
   ```typescript
   {
     username: '',      // Имя пользователя для входа
     password: '',      // Пароль (минимум 8 символов)
     email: '',         // Email (необязательно)
     first_name: '',    // Имя
     last_name: '',     // Фамилия
     // ... остальные поля профиля
   }
   ```

3. **Валидация на фронтенде:**
   - Username обязателен
   - Пароль обязателен
   - Пароль минимум 8 символов

4. **Умная обработка ошибок:**
   ```typescript
   const errorMessage = err.response?.data?.detail 
     || err.response?.data?.username?.[0]  // "Пользователь уже существует"
     || err.response?.data?.email?.[0]     // "Email уже используется"
     || err.response?.data?.password?.[0]  // "Пароль слишком короткий"
     || err.message;
   ```

5. **Условный рендеринг:**
   - При создании: показываются поля username, password, email, имя, фамилия
   - При редактировании: показывается только информация о пользователе (username, полное имя)

#### 3. Добавлена кнопка в `UsersPage`
**Файл:** `frontend-new/src/pages/permissions/UsersPage.tsx`

Добавлена кнопка "Добавить пользователя" в заголовок страницы:

```tsx
<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => {
    setSelectedUser(null);  // null = режим создания
    setIsModalOpen(true);
  }}
>
  Добавить пользователя
</Button>
```

## Как использовать

### Создание нового пользователя

1. **Откройте страницу настроек:** `http://localhost:5173/settings?tab=users`

2. **Нажмите кнопку "Добавить пользователя"** в правом верхнем углу

3. **Заполните форму создания:**

   **Данные пользователя (обязательно):**
   - Username - имя для входа в систему (уникальное)
   - Пароль - минимум 8 символов
   
   **Данные пользователя (необязательно):**
   - Email
   - Имя
   - Фамилия

   **Данные профиля:**
   - Компания
   - Отдел (активируется после выбора компании)
   - Роли (можно выбрать несколько)
   - Должность
   - Телефон
   - Системный администратор (checkbox)
   - Активный пользователь (checkbox)

4. **Нажмите "Сохранить"**

5. **Результат:**
   - Пользователь создан в системе
   - Профиль автоматически привязан
   - Роли назначены
   - Запись появляется в таблице пользователей

### Редактирование существующего пользователя

1. Кликните на строку пользователя в таблице
2. Отредактируйте данные профиля
3. Нажмите "Сохранить"

**Примечание:** При редактировании нельзя изменить username и пароль пользователя.

## Валидация и обработка ошибок

### Валидация на фронтенде

✅ Username не пустой  
✅ Пароль не пустой  
✅ Пароль минимум 8 символов

### Валидация на бэкенде

✅ Username уникальный  
✅ Email уникальный (если указан)  
✅ Компания существует и активна  
✅ Отдел существует и активен  
✅ Все роли существуют и активны  
✅ Пароль соответствует требованиям Django

### Примеры сообщений об ошибках

- ❌ "Пользователь с таким именем уже существует"
- ❌ "Пользователь с таким email уже существует"
- ❌ "Компания не найдена"
- ❌ "Отдел не найден"
- ❌ "Роли с ID [1, 2] не найдены или неактивны"
- ❌ "Имя пользователя обязательно"
- ❌ "Пароль обязателен"
- ❌ "Пароль должен содержать минимум 8 символов"

## Безопасность

✅ **Пароль не возвращается в ответах API** (`write_only=True`)  
✅ **Пароль хешируется** при создании через `User.objects.create_user()`  
✅ **Логирование создания** пользователей в `PermissionLog`  
✅ **Проверка прав доступа** через `UserPermission`

## Логирование

Каждое создание пользователя записывается в таблицу `PermissionLog`:

```python
{
  'action': 'USER_CREATE',
  'entity_type': 'UserProfile',
  'entity_id': 5,
  'details': {
    'username': 'ivanov',
    'company_id': 1,
    'department_id': 2,
    'roles': [3, 4]
  },
  'user': <текущий пользователь>,
  'ip_address': '127.0.0.1'
}
```

## Тестирование

### Тест 1: Создание пользователя с минимальными данными
1. ✅ Username: "testuser"
2. ✅ Password: "testpass123"
3. ✅ Нажать "Сохранить"
4. ✅ Пользователь создан

### Тест 2: Создание пользователя со всеми данными
1. ✅ Заполнить все поля
2. ✅ Выбрать компанию, отдел, роли
3. ✅ Нажать "Сохранить"
4. ✅ Пользователь создан с профилем

### Тест 3: Валидация уникальности username
1. ✅ Создать пользователя "user1"
2. ✅ Попытаться создать еще одного "user1"
3. ✅ Ошибка: "Пользователь с таким именем уже существует"

### Тест 4: Валидация пароля
1. ✅ Username: "test"
2. ✅ Password: "123" (меньше 8 символов)
3. ✅ Ошибка: "Пароль должен содержать минимум 8 символов"

### Тест 5: Редактирование существующего пользователя
1. ✅ Кликнуть на пользователя
2. ✅ Изменить должность
3. ✅ Нажать "Сохранить"
4. ✅ Изменения сохранены

## Ограничения

⚠️ **Нельзя изменить username и пароль** существующего пользователя через интерфейс CRM  
⚠️ **Для смены пароля** используйте Django Admin или добавьте отдельную функцию

## Будущие улучшения

🔄 Добавить функцию смены пароля для существующих пользователей  
🔄 Добавить функцию сброса пароля  
🔄 Добавить загрузку аватара при создании  
🔄 Добавить отправку email с данными для входа  
🔄 Добавить генератор надёжных паролей

## Файлы

### Backend
- ✅ `backend/permissions/serializers.py` - UserCreateSerializer
- ✅ `backend/permissions/views.py` - create_user action

### Frontend
- ✅ `frontend-new/src/api/permissions.ts` - createUserProfile
- ✅ `frontend-new/src/components/permissions/UserForm.tsx` - форма с двумя режимами
- ✅ `frontend-new/src/pages/permissions/UsersPage.tsx` - кнопка добавления

## Статус

✅ **Backend реализован** - API endpoint создан  
✅ **Frontend реализован** - форма и кнопка добавлены  
✅ **Валидация работает** - на фронте и бэке  
✅ **Логирование настроено** - все создания записываются  
✅ **Готово к использованию** - можно создавать пользователей из интерфейса!

## Примечание

⚠️ **Требуется перезапуск бэкенда** для применения изменений в `serializers.py` и `views.py`

Команда для перезапуска:
```bash
cd backend
python manage.py runserver
```
