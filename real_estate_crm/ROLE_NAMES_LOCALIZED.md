# Локализация названий ролей

## Обзор

Все названия ролей в системе теперь отображаются на русском языке во всех компонентах интерфейса.

## Маппинг ролей

```typescript
const ROLE_NAME_MAPPING: Record<string, string> = {
  'SYSTEM_ADMIN': 'Системный администратор',
  'COMPANY_ADMIN': 'Администратор компании',
  'DEPARTMENT_MANAGER': 'Руководитель отдела',
  'MANAGER': 'Менеджер',
  'VIEWER': 'Наблюдатель',
};
```

## Маппинг ресурсов

Добавлены русские названия для всех ресурсов в системе:

```typescript
const RESOURCE_LABELS: Record<string, string> = {
  CLIENT: 'Клиенты',
  APPLICATION: 'Заявки',
  MEETING: 'Встречи',
  DEAL: 'Сделки',
  PAYMENT: 'Платежи',
  REFUND: 'Возвраты',
  PROJECT: 'Проекты',
  BUILDING: 'Здания',
  PROPERTY: 'Объекты недвижимости',
  LAYOUT: 'Планировки',
  DISCOUNT: 'Скидки',
  DOCUMENT: 'Документы',
  REPORT: 'Отчеты',
  COMPANY: 'Компании',
  DEPARTMENT: 'Отделы',
  ROLE: 'Роли',
  USER: 'Пользователи',
  BENEFICIARY_ACCOUNT: 'Счета получателей',
  DASHBOARD: 'Дашборд',
  PAYMENT_TYPE: 'Типы платежей',
  PERMISSION: 'Разрешения',
  PLAN: 'Планы',
  SETTINGS: 'Настройки',
  TEMPLATE: 'Шаблоны',
  OTHER: 'Прочее',
};
```

## Обновленные компоненты

### 1. RolesPage.tsx
**Расположение:** `frontend-new/src/pages/permissions/RolesPage.tsx`

**Изменения:**
- Добавлен `ROLE_NAME_MAPPING` для преобразования кодов ролей в русские названия
- Обновлена колонка "Название" в таблице для использования fallback цепочки:
  ```typescript
  const displayName = params.value || ROLE_NAME_MAPPING[params.row.code] || params.row.code;
  ```

### 2. RoleDetailPage.tsx
**Расположение:** `frontend-new/src/pages/permissions/RoleDetailPage.tsx`

**Изменения:**
- Добавлен `ROLE_NAME_MAPPING`
- Обновлен заголовок страницы (header) для отображения русского названия
- Обновлен блок "Основная информация" для отображения русского названия
- Обновлен диалог подтверждения удаления роли

**Fallback цепочка:**
```typescript
role.name || ROLE_NAME_MAPPING[role.code] || role.code
```

### 3. UsersPage.tsx
**Расположение:** `frontend-new/src/pages/permissions/UsersPage.tsx`

**Изменения:**
- Добавлен `ROLE_NAME_MAPPING`
- Обновлена колонка "Роли" для отображения русских названий в Chip компонентах:
  ```typescript
  const displayName = role.name || ROLE_NAME_MAPPING[role.code] || role.code;
  ```

### 4. UserForm.tsx
**Расположение:** `frontend-new/src/components/permissions/UserForm.tsx`

**Изменения:**
- Добавлен `ROLE_NAME_MAPPING`
- Обновлен Autocomplete компонент для выбора ролей:
  - `getOptionLabel` использует fallback цепочку
  - `renderTags` использует fallback цепочку для отображения выбранных ролей

### 5. RoleForm.tsx
**Расположение:** `frontend-new/src/components/permissions/RoleForm.tsx`

**Изменения:**
- Добавлен `ROLE_NAME_MAPPING` для единообразия
- **Расширен `RESOURCE_LABELS`** - добавлены русские названия для всех ресурсов:
  - `BENEFICIARY_ACCOUNT` → 'Счета получателей'
  - `DASHBOARD` → 'Дашборд'
  - `PAYMENT_TYPE` → 'Типы платежей'
  - `PERMISSION` → 'Разрешения'
  - `PLAN` → 'Планы'
  - `SETTINGS` → 'Настройки'
  - `TEMPLATE` → 'Шаблоны'

### 6. RoleDetailPage.tsx - Обновление ресурсов
**Изменения:**
- **Расширен `RESOURCE_LABELS`** - добавлены те же русские названия ресурсов, что и в RoleForm
- Теперь все ресурсы в матрице разрешений отображаются на русском языке

## Принцип работы

### Fallback цепочка
Во всех компонентах используется трёхуровневая fallback цепочка:

1. **Первый приоритет:** `role.name` - название из API (бэкенд уже возвращает русские названия)
2. **Второй приоритет:** `ROLE_NAME_MAPPING[role.code]` - локальный маппинг на случай, если API не вернул название
3. **Третий приоритет:** `role.code` - сырой код роли (последний резерв)

### Преимущества подхода

1. **Защита от изменений API:** Даже если бэкенд не вернёт поле `name`, фронтенд всё равно покажет русское название
2. **Единообразие:** Все компоненты используют одинаковый маппинг и логику
3. **Читаемость:** Пользователи видят понятные русские названия вместо технических кодов
4. **Надёжность:** Всегда есть fallback на отображение хоть чего-то (код роли)

## Бэкенд интеграция

Бэкенд уже настроен для возврата русских названий:

### models.py
```python
class RoleLevel(models.TextChoices):
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'Системный администратор'
    COMPANY_ADMIN = 'COMPANY_ADMIN', 'Администратор компании'
    DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER', 'Руководитель отдела'
    MANAGER = 'MANAGER', 'Менеджер'
    VIEWER = 'VIEWER', 'Наблюдатель'
```

### serializers.py
```python
class RoleListSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
```

## Тестирование

Для проверки корректности отображения:

1. Откройте страницу `/permissions/roles` - все названия ролей должны быть на русском
2. Откройте детальную страницу любой роли - название в заголовке и в информации должно быть на русском
3. Откройте страницу `/permissions/users` - роли в колонке "Роли" должны отображаться на русском
4. Откройте форму редактирования пользователя - в выборе ролей названия должны быть на русском
5. Попробуйте удалить роль - в диалоге подтверждения название должно быть на русском

## Связанные файлы

- [PERMISSIONS_AUTH_FIXED.md](PERMISSIONS_AUTH_FIXED.md) - исправления авторизации
- [PERMISSIONS_READY.md](PERMISSIONS_READY.md) - готовая система прав
- [QUICKSTART_PERMISSIONS.md](QUICKSTART_PERMISSIONS.md) - быстрый старт

## Статус

✅ **Завершено** - Все роли отображаются на русском языке во всех компонентах интерфейса
