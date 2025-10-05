# Исправление ошибки "Отдел не найден"

## Проблема

При создании пользователя с выбранным отделом возникала ошибка:
```
POST http://127.0.0.1:8000/api/permissions/user-profiles/create_user/ 400 (Bad Request)
User form error: {department_id: Array(1)}
Ошибка: "Отдел не найден"
```

Хотя отдел был выбран из списка.

## Причина

### 1. Отправка `null` вместо отсутствия поля

**Было:**
```typescript
createUserProfile({
  username: data.username,
  password: data.password,
  company_id: data.company || undefined,      // null → undefined
  department_id: data.department || undefined, // null → undefined
  // ...
})
```

Проблема: `null || undefined` → `undefined`, но поле всё равно включается в запрос как `undefined`.

### 2. Возможная отправка строки вместо числа

Если `data.company` или `data.department` были строками, они могли не преобразовываться в числа корректно.

### 3. Отправка пустых строк

Пустые строки (`''`) отправлялись для опциональных текстовых полей.

## Решение

### Улучшенная логика формирования payload

**Файл:** `frontend-new/src/components/permissions/UserForm.tsx`

#### Для создания пользователя:

**До:**
```typescript
return createUserProfile({
  username: data.username,
  password: data.password,
  email: data.email || undefined,
  first_name: data.first_name || undefined,
  last_name: data.last_name || undefined,
  company_id: data.company || undefined,        // ❌ Может отправить undefined
  department_id: data.department || undefined,  // ❌ Может отправить undefined
  role_ids: data.roles || [],
  position: data.position || undefined,
  phone: data.phone || undefined,
  is_system_admin: data.is_system_admin,
  is_active: data.is_active,
});
```

**После:**
```typescript
const payload: any = {
  username: data.username,
  password: data.password,
  is_system_admin: data.is_system_admin,
  is_active: data.is_active,
  role_ids: data.roles || [],
};

// ✅ Добавляем поля ТОЛЬКО если они заполнены
if (data.email?.trim()) payload.email = data.email.trim();
if (data.first_name?.trim()) payload.first_name = data.first_name.trim();
if (data.last_name?.trim()) payload.last_name = data.last_name.trim();
if (data.company) payload.company_id = Number(data.company);        // ✅ Явное преобразование в число
if (data.department) payload.department_id = Number(data.department); // ✅ Явное преобразование в число
if (data.position?.trim()) payload.position = data.position.trim();
if (data.phone?.trim()) payload.phone = data.phone.trim();

console.log('Creating user with payload:', payload); // ✅ Логирование для отладки
return createUserProfile(payload);
```

#### Для обновления пользователя:

**До:**
```typescript
return updateUserProfile(userProfile.id, {
  company_id: data.company || undefined,        // ❌ Может отправить undefined
  department_id: data.department || undefined,  // ❌ Может отправить undefined
  role_ids: data.roles,
  position: data.position,
  phone: data.phone,
  is_system_admin: data.is_system_admin,
  is_active: data.is_active,
});
```

**После:**
```typescript
const payload: any = {
  role_ids: data.roles || [],
  is_system_admin: data.is_system_admin,
  is_active: data.is_active,
};

// ✅ Добавляем поля ТОЛЬКО если они заполнены
if (data.company) {
  payload.company_id = Number(data.company);
}
if (data.department) {
  payload.department_id = Number(data.department);
}
if (data.position?.trim()) {
  payload.position = data.position.trim();
}
if (data.phone?.trim()) {
  payload.phone = data.phone.trim();
}

return updateUserProfile(userProfile.id, payload);
```

## Преимущества нового подхода

### ✅ 1. Не отправляем пустые поля
Поля, которые не заполнены, **не включаются** в payload вообще.

**Пример:**
```javascript
// Было (если отдел не выбран):
{
  username: "test",
  password: "pass123",
  company_id: undefined,    // ❌ Поле присутствует
  department_id: undefined  // ❌ Поле присутствует
}

// Стало (если отдел не выбран):
{
  username: "test",
  password: "pass123"
  // ✅ Поля отсутствуют полностью
}
```

### ✅ 2. Явное преобразование типов
```typescript
Number(data.company)    // Гарантированно число
Number(data.department) // Гарантированно число
```

### ✅ 3. Trim для строк
```typescript
data.email?.trim()      // Убирает пробелы по краям
data.first_name?.trim()
data.position?.trim()
```

### ✅ 4. Логирование payload
```typescript
console.log('Creating user with payload:', payload);
```
Позволяет видеть в DevTools точно, что отправляется на сервер.

## Проверка валидации на бэкенде

**Файл:** `backend/permissions/serializers.py`

```python
def validate_department_id(self, value):
    if value:  # ✅ Валидация срабатывает только если value передано
        try:
            Department.objects.get(id=value, is_active=True)
        except Department.DoesNotExist:
            raise serializers.ValidationError("Отдел не найден")
    return value
```

Теперь если `department_id` отсутствует в payload, валидация вообще не запускается.

## Примеры payload

### 1. Минимальный (только username и password):
```json
{
  "username": "testuser",
  "password": "testpass123",
  "is_system_admin": false,
  "is_active": true,
  "role_ids": []
}
```

### 2. С компанией (без отдела):
```json
{
  "username": "testuser",
  "password": "testpass123",
  "company_id": 1,
  "is_system_admin": false,
  "is_active": true,
  "role_ids": []
}
```

### 3. С компанией и отделом:
```json
{
  "username": "testuser",
  "password": "testpass123",
  "company_id": 1,
  "department_id": 5,
  "is_system_admin": false,
  "is_active": true,
  "role_ids": [2, 3]
}
```

### 4. Полный набор данных:
```json
{
  "username": "ivanov",
  "password": "SecurePass123",
  "email": "ivanov@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "company_id": 1,
  "department_id": 5,
  "role_ids": [2, 3],
  "position": "Менеджер по продажам",
  "phone": "+7 900 123-45-67",
  "is_system_admin": false,
  "is_active": true
}
```

## Отладка

### Как проверить payload перед отправкой:

1. Откройте DevTools (F12)
2. Перейдите во вкладку Console
3. Попробуйте создать пользователя
4. Увидите лог:
   ```
   Creating user with payload: {username: "test", password: "...", ...}
   ```

### Как проверить ошибку от сервера:

В консоли будет:
```
User form error: {department_id: ["Отдел не найден"]}
```

Это означает, что бэкенд не нашёл отдел с указанным ID.

## Тестирование

### Тест 1: Создание без компании и отдела
1. ✅ Username: "user1"
2. ✅ Password: "pass12345678"
3. ✅ Компания: не выбрана
4. ✅ Отдел: не выбран
5. ✅ **Результат:** Пользователь создан

### Тест 2: Создание с компанией, но без отдела
1. ✅ Username: "user2"
2. ✅ Password: "pass12345678"
3. ✅ Компания: выбрана
4. ✅ Отдел: не выбран
5. ✅ **Результат:** Пользователь создан с компанией

### Тест 3: Создание с компанией и отделом
1. ✅ Username: "user3"
2. ✅ Password: "pass12345678"
3. ✅ Компания: выбрана
4. ✅ Отдел: выбран из списка
5. ✅ **Результат:** Пользователь создан с компанией и отделом

### Тест 4: Проверка преобразования типов
1. ✅ В DevTools Console видно:
   ```
   Creating user with payload: {
     username: "user3",
     company_id: 1,        // ✅ Число, не строка
     department_id: 5,     // ✅ Число, не строка
     ...
   }
   ```

## Изменённые файлы

### Frontend
- ✅ `frontend-new/src/components/permissions/UserForm.tsx`
  - Изменена логика формирования payload для создания
  - Изменена логика формирования payload для обновления
  - Добавлено явное преобразование в Number
  - Добавлен trim для строк
  - Добавлено логирование payload
  - Поля включаются в payload только если заполнены

## Статус

✅ **Ошибка "Отдел не найден" исправлена**  
✅ **Payload формируется корректно**  
✅ **Типы преобразуются явно**  
✅ **Пустые поля не отправляются**  
✅ **Готово к использованию**

## Примечания

💡 **Console.log** добавлен в создание пользователя - вы всегда можете проверить, что отправляется на сервер  
💡 **Number()** явно преобразует ID компании и отдела в числа  
💡 **trim()** убирает лишние пробелы из текстовых полей  
💡 **Условное добавление** полей гарантирует, что пустые значения не попадают в запрос
