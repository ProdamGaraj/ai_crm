# Исправление ошибки создания роли

## Проблема

При попытке создать роль возникала ошибка:
```json
{
  "level": [""SYSTEM" is not a valid choice."]
}
```

## Причина

Frontend отправлял неправильные значения для поля `level`:
- Отправлялось: `SYSTEM`, `COMPANY`, `DEPARTMENT`, `PERSONAL`
- Ожидалось backend: `SYSTEM_ADMIN`, `COMPANY_ADMIN`, `DEPARTMENT_MANAGER`, `MANAGER`, `VIEWER`, `CUSTOM`

## Решение

### Файл: `frontend-new/src/components/permissions/RoleForm.tsx`

**БЫЛО:**
```typescript
const ROLE_LEVELS = [
  { value: 'SYSTEM', label: 'Системный' },
  { value: 'COMPANY', label: 'Компания' },
  { value: 'DEPARTMENT', label: 'Отдел' },
  { value: 'PERSONAL', label: 'Личный' },
];
```

**СТАЛО:**
```typescript
const ROLE_LEVELS = [
  { value: 'SYSTEM_ADMIN', label: 'Системный администратор' },
  { value: 'COMPANY_ADMIN', label: 'Администратор компании' },
  { value: 'DEPARTMENT_MANAGER', label: 'Руководитель отдела' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'VIEWER', label: 'Наблюдатель' },
  { value: 'CUSTOM', label: 'Пользовательская роль' },
];
```

**Также исправлено дефолтное значение:**
```typescript
// БЫЛО:
level: role?.level || 'DEPARTMENT',

// СТАЛО:
level: role?.level || 'CUSTOM',
```

## Правильные значения level из backend

Из модели `permissions/models.py`:

```python
class RoleLevel(models.TextChoices):
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'Системный администратор'
    COMPANY_ADMIN = 'COMPANY_ADMIN', 'Администратор компании'
    DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER', 'Руководитель отдела'
    MANAGER = 'MANAGER', 'Менеджер'
    VIEWER = 'VIEWER', 'Наблюдатель'
    CUSTOM = 'CUSTOM', 'Пользовательская роль'
```

## Как протестировать

1. Обновите код:
   ```bash
   git pull origin dev
   ```

2. Перейдите в Настройки → Роли

3. Нажмите "Создать роль"

4. Заполните форму:
   - Название: "Тестовая роль"
   - Код: "TEST_ROLE"
   - Уровень: Выберите любой из списка (например, "Менеджер")
   - Выберите несколько разрешений

5. Нажмите "Сохранить"

6. Роль должна быть создана успешно! ✅

## Описание уровней ролей

| Значение | Русское название | Описание |
|----------|------------------|----------|
| `SYSTEM_ADMIN` | Системный администратор | Полный доступ ко всей системе |
| `COMPANY_ADMIN` | Администратор компании | Управление компанией и её подразделениями |
| `DEPARTMENT_MANAGER` | Руководитель отдела | Управление отделом |
| `MANAGER` | Менеджер | Обычный менеджер с ограниченными правами |
| `VIEWER` | Наблюдатель | Только просмотр данных |
| `CUSTOM` | Пользовательская роль | Гибкая настройка разрешений |

## Что было исправлено ранее

### 1. Создание ролей через UI
**Проблема**: Форма отправляла `permissions` вместо `permission_ids`  
**Решение**: Преобразование данных перед отправкой на backend

### 2. Значения уровней ролей (текущая проблема)
**Проблема**: Несоответствие значений между frontend и backend  
**Решение**: Синхронизация значений с backend моделью

## Статус

✅ **Исправлено** - теперь роли можно создавать без ошибок!

При создании роли будет отправляться правильное значение `level`, которое backend примет и сохранит.
