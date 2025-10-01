# 🚀 Руководство по запуску модуля разрешений

## 📦 Установка зависимостей

### Backend

Все зависимости уже установлены. Убедитесь, что база данных инициализирована:

```bash
cd backend
python manage.py migrate
python manage.py init_permissions
```

### Frontend

Необходимо установить дополнительные пакеты для работы с деревом отделов:

```bash
cd frontend-new
npm install @mui/x-tree-view
```

## 🏃 Запуск приложения

### 1. Запуск Backend

```bash
cd backend
python manage.py runserver
```

Backend будет доступен на `http://localhost:8000`

### 2. Запуск Frontend

```bash
cd frontend-new
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## 🔧 Настройка

### Создание первого администратора

1. Создайте суперпользователя Django:
```bash
python manage.py createsuperuser
```

2. Зайдите в Django Admin: `http://localhost:8000/admin`

3. Создайте компанию через Admin или API

4. Создайте UserProfile для суперпользователя и назначьте роль "Системный администратор"

### API Endpoints

Все endpoints доступны по адресу `/api/permissions/`:

- **Компании**: `/api/permissions/companies/`
- **Отделы**: `/api/permissions/departments/`
- **Роли**: `/api/permissions/roles/`
- **Пользователи**: `/api/permissions/user-profiles/`
- **Разрешения**: `/api/permissions/permissions/`
- **Текущий пользователь**: `/api/permissions/me/`
- **Статистика**: `/api/permissions/stats/`
- **Логи**: `/api/permissions/logs/`

## 🎯 Frontend Routes

После интеграции будут доступны следующие маршруты:

- `/permissions/companies` - Управление компаниями
- `/permissions/departments` - Управление отделами (с деревом)
- `/permissions/roles` - Управление ролями
- `/permissions/users` - Управление пользователями
- `/permissions/stats` - Статистика системы разрешений

## 🔐 Тестирование разрешений

### 1. Создайте тестовую структуру:

```python
# В Django shell (python manage.py shell)
from django.contrib.auth.models import User
from permissions.models import Company, Department, UserProfile, Role

# Создать компанию
company = Company.objects.create(name="Тестовая компания", code="TEST")

# Создать отдел
dept = Department.objects.create(company=company, name="Отдел продаж", code="SALES")

# Создать пользователя
user = User.objects.create_user(username="manager1", password="test123")

# Создать профиль
profile = UserProfile.objects.create(user=user, company=company, department=dept)

# Назначить роль менеджера
manager_role = Role.objects.get(code='MANAGER')
profile.roles.add(manager_role)
```

### 2. Проверка доступа

Войдите как созданный пользователь и проверьте:

- ✅ Видит только своих клиентов (created_by = user)
- ✅ Не видит клиентов других менеджеров
- ✅ Может создавать новые записи
- ✅ Не может удалять записи других пользователей

### 3. Тест ролей

Создайте пользователей с разными ролями:

1. **Менеджер (MANAGER)**
   - Видит только свои объекты (OWN)
   - Может редактировать свои записи

2. **Руководитель отдела (DEPARTMENT_MANAGER)**
   - Видит объекты всего отдела
   - Может редактировать записи сотрудников отдела

3. **Администратор компании (COMPANY_ADMIN)**
   - Видит все объекты компании
   - Полный контроль над данными компании

4. **Системный администратор (SYSTEM_ADMIN)**
   - Видит все объекты системы
   - Полный контроль

## 📊 Структура файлов

### Backend
```
backend/
├── permissions/
│   ├── models.py              # Модели данных
│   ├── backends.py            # Логика проверки разрешений
│   ├── permissions.py         # DRF permission классы
│   ├── views.py               # API ViewSets
│   ├── serializers.py         # Сериализаторы
│   ├── urls.py                # Роутинг
│   ├── admin.py               # Django Admin
│   ├── README.md              # Документация
│   └── management/
│       └── commands/
│           └── init_permissions.py  # Инициализация
```

### Frontend
```
frontend-new/
├── src/
│   ├── api/
│   │   └── permissions.ts     # API клиент
│   ├── pages/
│   │   └── permissions/
│   │       ├── CompaniesPage.tsx
│   │       ├── DepartmentsPage.tsx
│   │       ├── RolesPage.tsx (TODO)
│   │       └── UsersPage.tsx (TODO)
│   └── components/
│       └── permissions/
│           ├── CompanyForm.tsx
│           ├── DepartmentForm.tsx
│           ├── RoleForm.tsx (TODO)
│           └── UserProfileForm.tsx (TODO)
```

## 🐛 Troubleshooting

### Проблема: Ошибка импорта в TypeScript

**Решение:**
```bash
cd frontend-new
npm install
npm install @mui/x-tree-view @tanstack/react-query
```

### Проблема: Пользователь не видит данные

**Решение:**
1. Проверьте наличие UserProfile: `UserProfile.objects.filter(user=user)`
2. Проверьте назначенные роли: `user.profile.roles.all()`
3. Проверьте разрешения: `user.profile.get_all_permissions()`

### Проблема: Permission denied при создании объекта

**Решение:**
1. Убедитесь, что у роли есть разрешение `ADD_RESOURCE_OWN`
2. Проверьте, что user.profile существует и активен
3. Проверьте, что компания/отдел активны

## 📈 Мониторинг

### Просмотр логов изменений

```python
from permissions.models import PermissionLog

# Последние изменения
recent_logs = PermissionLog.objects.order_by('-timestamp')[:10]

# Логи конкретного пользователя
user_logs = PermissionLog.objects.filter(user=user)

# Логи по типу сущности
role_logs = PermissionLog.objects.filter(entity_type='Role')
```

### Статистика через API

```bash
curl http://localhost:8000/api/permissions/stats/
```

Вернет:
```json
{
  "total_companies": 5,
  "total_departments": 12,
  "total_users": 45,
  "total_roles": 8,
  "total_permissions": 352,
  "active_users": 42
}
```

## 🎨 Кастомизация

### Добавление нового ресурса

1. Добавьте resource в `permissions/models.py`:
```python
class Permission(models.Model):
    RESOURCE_CHOICES = [
        # ... existing
        ('NEW_RESOURCE', 'Новый ресурс'),
    ]
```

2. Создайте permission класс в `permissions/permissions.py`:
```python
class NewResourcePermission(BaseResourcePermission):
    resource_type = 'NEW_RESOURCE'
```

3. Используйте в views:
```python
class NewResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, NewResourcePermission]
    
    def get_queryset(self):
        return get_filtered_queryset(
            self.request.user,
            NewResource.objects.all(),
            'NEW_RESOURCE'
        )
```

4. Добавьте разрешения через admin или management command

### Создание кастомной роли

```python
from permissions.models import Role, Permission

# Создать роль
role = Role.objects.create(
    name="Старший менеджер",
    code="SENIOR_MANAGER",
    level="MANAGER"
)

# Добавить разрешения
permissions = Permission.objects.filter(
    Q(action='VIEW', scope__in=['DEPARTMENT', 'OWN']) |
    Q(action='EDIT', scope='OWN')
)
role.permissions.set(permissions)
```

## 📞 Поддержка

При возникновении вопросов:

1. Проверьте README.md в папке permissions
2. Изучите примеры в документации API
3. Проверьте логи в Django Admin

---

**✨ Система готова к использованию!**
