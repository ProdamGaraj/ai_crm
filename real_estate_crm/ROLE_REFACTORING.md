# Рефакторинг системы ролей: Scope + Category

## 📋 Обзор изменений

**Дата:** 05.10.2025  
**Версия:** Backend v1.1, Frontend v1.1

### Проблема

Старая структура использовала поле `level` (уровень роли), которое содержало значения:
- `SYSTEM_ADMIN` - Системный администратор
- `COMPANY_ADMIN` - Администратор компании
- `DEPARTMENT_MANAGER` - Руководитель отдела
- `MANAGER` - Менеджер
- `VIEWER` - Наблюдатель
- `CUSTOM` - Пользовательская роль

**Проблема:** Эти значения представляли собой **конкретные роли**, а не уровень/категорию! 

Это создавало концептуальную путаницу:
- Было непонятно, что такое "уровень" роли
- Нельзя было создать кастомную роль с нужным уровнем доступа
- Логика проверок была завязана на конкретные значения, а не на концепцию

### Решение

Разделили на два независимых поля:

#### 1. **`scope`** (Область действия) - ФУНКЦИОНАЛЬНОЕ
Определяет реальный уровень доступа в иерархии организации:
- `SYSTEM` - Вся система
- `COMPANY` - Компания
- `DEPARTMENT` - Отдел  
- `OWN` - Только свои данные

#### 2. **`category`** (Категория) - ДЛЯ UI
Группировка ролей в интерфейсе:
- `ADMINISTRATIVE` - Административная
- `MANAGEMENT` - Управленческая
- `OPERATIONAL` - Операционная
- `READONLY` - Только просмотр
- `CUSTOM` - Пользовательская

---

## 🔄 Миграция данных

### Маппинг старых значений на новые

```python
'SYSTEM_ADMIN'       → scope='SYSTEM',     category='ADMINISTRATIVE'
'COMPANY_ADMIN'      → scope='COMPANY',    category='ADMINISTRATIVE'
'DEPARTMENT_MANAGER' → scope='DEPARTMENT', category='MANAGEMENT'
'MANAGER'            → scope='OWN',        category='OPERATIONAL'
'VIEWER'             → scope='COMPANY',    category='READONLY'
'CUSTOM'             → scope='OWN',        category='CUSTOM'
```

### Файл миграции

`backend/permissions/migrations/0002_role_refactor_category_scope.py`

**Порядок операций:**
1. Добавляются новые поля `scope` и `category`
2. Данные мигрируются из `level` в новые поля
3. Удаляется старое поле `level`
4. Обновляется Meta класс (ordering)

---

## 📁 Измененные файлы

### Backend

#### 1. **`backend/permissions/models.py`**

**Изменения:**
```python
# БЫЛО:
class RoleLevel(models.TextChoices):
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'Системный администратор'
    ...

level = models.CharField(
    max_length=30,
    choices=RoleLevel.choices,
    default=RoleLevel.CUSTOM
)

# СТАЛО:
class RoleScope(models.TextChoices):
    SYSTEM = 'SYSTEM', 'Вся система'
    COMPANY = 'COMPANY', 'Компания'
    DEPARTMENT = 'DEPARTMENT', 'Отдел'
    OWN = 'OWN', 'Только свои данные'

class RoleCategory(models.TextChoices):
    ADMINISTRATIVE = 'ADMINISTRATIVE', 'Административная'
    MANAGEMENT = 'MANAGEMENT', 'Управленческая'
    OPERATIONAL = 'OPERATIONAL', 'Операционная'
    READONLY = 'READONLY', 'Только просмотр'
    CUSTOM = 'CUSTOM', 'Пользовательская'

scope = models.CharField(...)
category = models.CharField(...)
```

**Обновлена логика:**
```python
# БЫЛО:
if self.roles.filter(level=Role.RoleLevel.SYSTEM_ADMIN).exists():
    return Company.objects.all()

# СТАЛО:
if self.roles.filter(scope=Role.RoleScope.SYSTEM).exists():
    return Company.objects.all()
```

#### 2. **`backend/permissions/serializers.py`**

```python
# БЫЛО:
level_display = serializers.CharField(source='get_level_display')
fields = [..., 'level', 'level_display', ...]

# СТАЛО:
scope_display = serializers.CharField(source='get_scope_display')
category_display = serializers.CharField(source='get_category_display')
fields = [..., 'scope', 'scope_display', 'category', 'category_display', ...]
```

#### 3. **`backend/permissions/admin.py`**

```python
# БЫЛО:
list_display = ['name', 'code', 'level', ...]
list_filter = ['level', ...]
ordering = ['level', 'name']

# СТАЛО:
list_display = ['name', 'code', 'scope', 'category', ...]
list_filter = ['scope', 'category', ...]
ordering = ['scope', 'category', 'name']
```

#### 4. **`backend/permissions/management/commands/create_test_users.py`**

```python
# БЫЛО:
'level': Role.RoleLevel.MANAGER

# СТАЛО:
'scope': Role.RoleScope.OWN,
'category': Role.RoleCategory.OPERATIONAL
```

### Frontend

#### 5. **`frontend-new/src/api/permissions.ts`**

```typescript
// БЫЛО:
export interface Role {
  ...
  level: string;
  ...
}

export interface RoleFilters {
  level?: string;
  ...
}

// СТАЛО:
export interface Role {
  ...
  scope: string;
  scope_display?: string;
  category: string;
  category_display?: string;
  ...
}

export interface RoleFilters {
  scope?: string;
  category?: string;
  ...
}
```

#### 6. **`frontend-new/src/components/permissions/RoleForm.tsx`**

```typescript
// БЫЛО:
const ROLE_LEVELS = [
  { value: 'SYSTEM_ADMIN', label: 'Системный администратор' },
  { value: 'COMPANY_ADMIN', label: 'Администратор компании' },
  ...
];

const [formData, setFormData] = useState({
  level: role?.level || 'CUSTOM',
  ...
});

// СТАЛО:
const ROLE_SCOPES = [
  { value: 'SYSTEM', label: 'Вся система' },
  { value: 'COMPANY', label: 'Компания' },
  { value: 'DEPARTMENT', label: 'Отдел' },
  { value: 'OWN', label: 'Только свои данные' },
];

const ROLE_CATEGORIES = [
  { value: 'ADMINISTRATIVE', label: 'Административная' },
  { value: 'MANAGEMENT', label: 'Управленческая' },
  { value: 'OPERATIONAL', label: 'Операционная' },
  { value: 'READONLY', label: 'Только просмотр' },
  { value: 'CUSTOM', label: 'Пользовательская' },
];

const [formData, setFormData] = useState({
  scope: role?.scope || 'OWN',
  category: role?.category || 'CUSTOM',
  ...
});
```

**UI изменения:**
- Одно поле "Уровень роли" → Два поля: "Область действия" и "Категория роли"

---

## 🎯 Преимущества новой архитектуры

### 1. Ясная семантика
```
scope = ЧТО может делать роль (функциональная область)
category = КАК группировать роль в UI (категоризация)
```

### 2. Гибкость
Теперь можно создать:
- Административную роль на уровне отдела (`scope=DEPARTMENT, category=ADMINISTRATIVE`)
- Операционную роль на уровне компании (`scope=COMPANY, category=OPERATIONAL`)
- Любые комбинации!

### 3. Расширяемость
Легко добавить новые категории без изменения логики доступа:
```python
class RoleCategory(models.TextChoices):
    ...
    TECHNICAL = 'TECHNICAL', 'Техническая'  # Новая категория
    FINANCIAL = 'FINANCIAL', 'Финансовая'   # Новая категория
```

### 4. Понятная логика проверок
```python
# Проверка области действия (функциональная)
if user.roles.filter(scope=Role.RoleScope.COMPANY).exists():
    # Доступ к данным компании

# Фильтрация по категории (UI)
admin_roles = Role.objects.filter(category=Role.RoleCategory.ADMINISTRATIVE)
```

---

## 🚀 Примеры использования

### Создание ролей

```python
# 1. Директор отдела
Role.objects.create(
    name='Директор отдела продаж',
    code='SALES_DIRECTOR',
    scope=Role.RoleScope.DEPARTMENT,    # Видит весь отдел
    category=Role.RoleCategory.MANAGEMENT,  # Категория "Управленческая"
    ...
)

# 2. Старший менеджер
Role.objects.create(
    name='Старший менеджер',
    code='SENIOR_MANAGER',
    scope=Role.RoleScope.OWN,           # Видит только свои данные
    category=Role.RoleCategory.OPERATIONAL,  # Категория "Операционная"
    ...
)

# 3. Аналитик компании
Role.objects.create(
    name='Аналитик',
    code='ANALYST',
    scope=Role.RoleScope.COMPANY,       # Видит всю компанию
    category=Role.RoleCategory.READONLY,    # Только просмотр
    ...
)
```

### Проверка доступа

```python
# UserProfile.get_accessible_companies()
if self.roles.filter(scope=Role.RoleScope.SYSTEM).exists():
    return Company.objects.all()  # Вся система

if self.roles.filter(scope=Role.RoleScope.COMPANY).exists():
    return Company.objects.filter(id=self.company.id)  # Своя компания

# UserProfile.get_accessible_departments()
if self.roles.filter(scope=Role.RoleScope.COMPANY).exists():
    return Department.objects.filter(company=self.company)  # Все отделы компании

if self.roles.filter(scope=Role.RoleScope.DEPARTMENT).exists():
    return Department.objects.filter(id=self.department.id)  # Свой отдел
```

### Фильтрация в UI

```typescript
// По области действия
const systemRoles = await getRoles({ scope: 'SYSTEM' });

// По категории
const adminRoles = await getRoles({ category: 'ADMINISTRATIVE' });

// Комбинация
const deptManagers = await getRoles({ 
  scope: 'DEPARTMENT', 
  category: 'MANAGEMENT' 
});
```

---

## ⚠️ Breaking Changes

### API изменения

❌ **Удалено:**
- `GET /api/permissions/roles/?level=MANAGER`
- `role.level`
- `role.level_display`

✅ **Добавлено:**
- `GET /api/permissions/roles/?scope=OWN&category=OPERATIONAL`
- `role.scope` / `role.scope_display`
- `role.category` / `role.category_display`

### Код миграции

Если у вас есть custom код, использующий `level`:

```python
# НУЖНО ИЗМЕНИТЬ:
role = Role.objects.get(level='MANAGER')

# НА:
role = Role.objects.filter(
    scope=Role.RoleScope.OWN,
    category=Role.RoleCategory.OPERATIONAL
).first()
```

---

## 🧪 Тестирование

### Checklist

- [ ] Миграция применилась успешно
- [ ] Все существующие роли сохранили данные
- [ ] Backend API возвращает `scope` и `category`
- [ ] Frontend форма создания роли имеет 2 dropdown
- [ ] Проверка доступа работает корректно
- [ ] Admin панель отображает новые поля
- [ ] Тестовые пользователи работают

### Команды для проверки

```bash
# Backend
cd backend
py.exe manage.py migrate permissions
py.exe manage.py runserver

# Проверка ролей
py.exe manage.py shell
>>> from permissions.models import Role
>>> Role.objects.all().values('name', 'scope', 'category')

# Frontend
cd frontend-new
npm run dev
```

---

## 📚 Дополнительная информация

### Таблица соответствий

| Старый level | Новый scope | Новый category | Описание |
|-------------|------------|---------------|----------|
| SYSTEM_ADMIN | SYSTEM | ADMINISTRATIVE | Полный доступ к системе |
| COMPANY_ADMIN | COMPANY | ADMINISTRATIVE | Администратор компании |
| DEPARTMENT_MANAGER | DEPARTMENT | MANAGEMENT | Руководитель отдела |
| MANAGER | OWN | OPERATIONAL | Менеджер (свои данные) |
| VIEWER | COMPANY | READONLY | Наблюдатель компании |
| CUSTOM | OWN | CUSTOM | Пользовательская роль |

### Философия дизайна

**Scope (Область действия)** = **ЧТО**
- Определяет функциональные возможности
- Используется в бизнес-логике
- Влияет на доступ к данным

**Category (Категория)** = **КАК**
- Определяет группировку в UI
- Используется для фильтрации
- Помогает пользователям ориентироваться

---

## ✅ Статус

**ЗАВЕРШЕНО** ✅

- ✅ Backend модель обновлена
- ✅ Миграция создана и применена
- ✅ Serializers обновлены
- ✅ Frontend интерфейс обновлен
- ✅ TypeScript интерфейсы обновлены
- ✅ Admin панель обновлена
- ✅ Команды управления обновлены
- ✅ Документация создана

**Дата завершения:** 05.10.2025

---

**🎉 Система ролей теперь логична, расширяема и удобна!**
