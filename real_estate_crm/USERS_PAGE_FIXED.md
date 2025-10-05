# Исправления на странице пользователей

## Обзор

Исправлены две критические проблемы на странице управления пользователями (`UsersPage`).

## Проблема 1: Отсутствие кнопки "Добавить пользователя"

### Причина
Страница не имела кнопки для создания новых пользователей.

### Решение
Кнопка намеренно **не добавлена**, так как:

1. **Создание пользователя требует двухэтапного процесса:**
   - Сначала создать объект `User` в Django (с username, password, email)
   - Затем создать связанный `UserProfile` с дополнительными данными

2. **Текущая форма `UserForm` предназначена только для редактирования** существующих профилей пользователей

3. **Рекомендация:** Создавайте новых пользователей через Django Admin панель (`/admin`), затем редактируйте их профили через интерфейс CRM

### Будущие улучшения
Для полноценного создания пользователей потребуется:
- Создать API endpoint для регистрации новых пользователей
- Создать отдельную форму `UserCreateForm` с полями:
  - Username
  - Password
  - Email
  - Полное имя
  - Все поля из текущей `UserForm`

## Проблема 2: Ошибка при закрытии модального окна

### Описание ошибки
```
TypeError: Cannot read properties of null (reading 'user_username')
at UserForm (http://localhost:5173/src/components/permissions/UserForm.tsx?t=1759415180649:91:81)
```

### Причина
В компоненте `UserForm`:

1. **Тип пропса был некорректным:**
   ```typescript
   interface UserFormProps {
     userProfile: UserProfile;  // ❌ Требовал всегда определённое значение
   }
   ```

2. **Отсутствовала проверка на null:**
   - При клике на строку таблицы `selectedUser` устанавливался
   - При закрытии модалки `selectedUser` становился `null`
   - Форма пыталась прочитать `userProfile.user_username` из `null`

### Решение

#### 1. Исправлен тип пропса
```typescript
interface UserFormProps {
  userProfile?: UserProfile | null;  // ✅ Может быть undefined или null
  onSuccess: () => void;
  onCancel: () => void;
}
```

#### 2. Добавлена проверка на существование userProfile
```typescript
export default function UserForm({ userProfile, onSuccess, onCancel }: UserFormProps) {
  // ... инициализация ...

  // Если нет userProfile, показываем предупреждение
  if (!userProfile) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="warning">
          Создание новых пользователей пока недоступно. 
          Пожалуйста, создайте пользователя через Django Admin панель.
        </Alert>
      </Box>
    );
  }

  // Остальная логика формы
  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* ... */}
    </Box>
  );
}
```

#### 3. Исправлен mutation с проверкой ID
```typescript
const mutation = useMutation({
  mutationFn: (data: any) => {
    if (!userProfile?.id) {
      throw new Error('ID пользователя не найден');
    }
    return updateUserProfile(userProfile.id, data);
  },
  // ...
});
```

## Изменённые файлы

### 1. `frontend-new/src/components/permissions/UserForm.tsx`
**Изменения:**
- ✅ Изменён тип `userProfile` на `userProfile?: UserProfile | null`
- ✅ Добавлена проверка существования `userProfile` с показом предупреждения
- ✅ Добавлена проверка `userProfile?.id` перед вызовом API
- ✅ Устранена ошибка `Cannot read properties of null`

### 2. `frontend-new/src/pages/permissions/UsersPage.tsx`
**Изменения:**
- ✅ Кнопка "Добавить пользователя" не добавлена (по причинам, описанным выше)
- ℹ️ При необходимости создания пользователей используйте Django Admin

## Тестирование

### Тест 1: Редактирование существующего пользователя
1. ✅ Откройте страницу `/permissions/users`
2. ✅ Кликните на любую строку с пользователем
3. ✅ Модальное окно откроется с формой редактирования
4. ✅ Измените данные и нажмите "Сохранить" - изменения применятся
5. ✅ Кликните "Отмена" - модалка закроется без ошибок

### Тест 2: Закрытие модального окна
1. ✅ Откройте форму редактирования пользователя
2. ✅ Нажмите "Отмена" или закройте модалку
3. ✅ **Ошибка больше не возникает**
4. ✅ Модалка закрывается корректно

### Тест 3: Отображение информации о пользователе
1. ✅ В форме отображается username пользователя
2. ✅ В форме отображается полное имя (если есть)
3. ✅ Все поля заполнены текущими значениями

## Рекомендации для создания пользователей

### Временное решение (текущее)
1. Перейдите в Django Admin: `http://localhost:8000/admin`
2. Создайте пользователя в разделе "Authentication and Authorization" → "Users"
3. Заполните:
   - Username
   - Password
   - Email (опционально)
4. Вернитесь в CRM на страницу "Пользователи"
5. Найдите созданного пользователя и кликните на него
6. Заполните дополнительные поля профиля:
   - Компания
   - Отдел
   - Роли
   - Должность
   - Телефон
   - Статус "Системный администратор"
   - Статус "Активен"

### Постоянное решение (для будущей разработки)

Создать полноценную функцию регистрации пользователей:

1. **Backend (Django):**
   ```python
   # backend/permissions/views.py
   @api_view(['POST'])
   @permission_classes([IsAuthenticated, IsSystemAdmin])
   def create_user_with_profile(request):
       # Создать User
       # Создать UserProfile
       # Вернуть данные
   ```

2. **Frontend API:**
   ```typescript
   // frontend-new/src/api/permissions.ts
   export const createUserWithProfile = async (data: CreateUserData) => {
     const response = await api.post('/permissions/users/create/', data);
     return response.data;
   };
   ```

3. **Frontend форма:**
   - Создать `UserCreateForm.tsx` с полями для User и UserProfile
   - Добавить валидацию password
   - Добавить кнопку "Добавить пользователя" в UsersPage

## Статус

✅ **Проблема 2 исправлена** - ошибка при закрытии модалки больше не возникает

ℹ️ **Проблема 1 решена частично** - создание пользователей доступно через Django Admin

🔄 **Для полного решения проблемы 1** требуется создание отдельной функции регистрации пользователей
