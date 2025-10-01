# 🎯 Real Estate CRM - Модуль разрешений

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Backend (уже установлено)
cd backend
pip install -r requirements.txt

# Frontend - добавить tree-view для отделов
cd ../frontend-new
npm install @mui/x-tree-view
```

### 2. Инициализация БД

```bash
cd backend
python manage.py migrate
python manage.py init_permissions
```

Будет создано:
- ✅ 352 разрешения
- ✅ 5 системных ролей
- ✅ Таблицы для компаний, отделов, профилей

### 3. Создание первого администратора

```bash
python manage.py createsuperuser
# Введите username, email, password
```

### 4. Запуск

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend-new
npm run dev
```

**Готово!** 🎉

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Admin: http://localhost:8000/admin

---

## 📋 Первые шаги

### Создайте компанию и профиль

#### Через Django Admin:
1. Откройте http://localhost:8000/admin
2. Перейдите в **Permissions** → **Companies** → **Add Company**
3. Создайте компанию (например, "ООО Моя компания")
4. Перейдите в **User Profiles** → **Add User Profile**
5. Выберите вашего пользователя, компанию и роль "Системный администратор"
6. Сохраните

#### Через Frontend UI:
1. Откройте http://localhost:5173
2. Авторизуйтесь
3. Перейдите в **Разрешения** (меню слева)
4. Создайте компанию через UI
5. Создайте отдел (если нужно)

---

## 🎭 Доступные роли

| Роль | Уровень доступа | Описание |
|------|----------------|----------|
| **Системный администратор** | SYSTEM | Полный доступ ко всей системе |
| **Администратор компании** | COMPANY | Управление всей компанией |
| **Руководитель отдела** | DEPARTMENT | Управление отделом |
| **Менеджер** | OWN + VIEW Department | Работа со своими объектами |
| **Наблюдатель** | VIEW only | Только просмотр |

---

## 📡 API Endpoints

### Базовый URL: `/api/permissions/`

```bash
# Компании
GET    /api/permissions/companies/
POST   /api/permissions/companies/
GET    /api/permissions/companies/{id}/
PATCH  /api/permissions/companies/{id}/
DELETE /api/permissions/companies/{id}/

# Отделы
GET    /api/permissions/departments/
POST   /api/permissions/departments/
GET    /api/permissions/departments/{id}/
PATCH  /api/permissions/departments/{id}/
DELETE /api/permissions/departments/{id}/

# Роли
GET    /api/permissions/roles/
POST   /api/permissions/roles/
GET    /api/permissions/roles/{id}/
PATCH  /api/permissions/roles/{id}/
POST   /api/permissions/roles/{id}/assign_permissions/

# Пользователи
GET    /api/permissions/user-profiles/
POST   /api/permissions/user-profiles/
GET    /api/permissions/user-profiles/{id}/
PATCH  /api/permissions/user-profiles/{id}/
GET    /api/permissions/user-profiles/{id}/permissions/
POST   /api/permissions/user-profiles/{id}/check_permission/

# Текущий пользователь
GET    /api/permissions/me/
PATCH  /api/permissions/me/

# Разрешения
GET    /api/permissions/permissions/
GET    /api/permissions/permissions/grouped_by_resource/

# Статистика
GET    /api/permissions/stats/

# Логи
GET    /api/permissions/logs/
```

---

## 🔧 Пример использования

### Backend (Python/Django)

```python
# В views добавлено:
from permissions.permissions import ClientPermission
from permissions.backends import get_filtered_queryset

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, ClientPermission]
    
    def get_queryset(self):
        # Автоматическая фильтрация по правам доступа
        return get_filtered_queryset(
            self.request.user,
            Client.objects.all(),
            'CLIENT'
        )
```

### Frontend (TypeScript/React)

```typescript
import { getCompanies, createCompany } from '@/api/permissions';
import { useQuery, useMutation } from '@tanstack/react-query';

// В компоненте
const { data: companies } = useQuery({
  queryKey: ['companies'],
  queryFn: getCompanies,
});

const createMutation = useMutation({
  mutationFn: createCompany,
  onSuccess: () => {
    // Обновить список
  },
});
```

---

## 🔍 Проверка работы

### Тест 1: Создание структуры

```python
# Python manage.py shell
from permissions.models import Company, Department, UserProfile, Role
from django.contrib.auth.models import User

# Создать компанию
company = Company.objects.create(name="Test Corp", code="TEST")

# Создать отдел
dept = Department.objects.create(
    company=company, 
    name="Sales", 
    code="SALES"
)

# Создать пользователя
user = User.objects.create_user(
    username="manager1", 
    password="test123"
)

# Создать профиль и назначить роль
profile = UserProfile.objects.create(
    user=user, 
    company=company, 
    department=dept
)
role = Role.objects.get(code='MANAGER')
profile.roles.add(role)

print(f"✅ Создан пользователь {user.username}")
print(f"✅ Компания: {company.name}")
print(f"✅ Отдел: {dept.name}")
print(f"✅ Роль: {role.name}")
print(f"✅ Разрешений: {profile.get_all_permissions().count()}")
```

### Тест 2: Проверка доступа

```python
# Войдите как manager1 через frontend
# Создайте клиента
# Войдите как другой менеджер
# Убедитесь, что НЕ видите клиента первого менеджера
```

---

## 📚 Документация

Подробная документация:

- **`backend/permissions/README.md`** - Полная документация API, модели, примеры
- **`PERMISSIONS_SETUP.md`** - Детальное руководство по установке
- **`INTEGRATION_SUMMARY.md`** - Обзор выполненной работы

---

## 🐛 Troubleshooting

### Ошибка: "No module named 'permissions'"

```bash
# Убедитесь, что 'permissions' в INSTALLED_APPS
# settings.py должен содержать:
INSTALLED_APPS = [
    # ...
    'permissions',
]
```

### Ошибка: "Permission matching query does not exist"

```bash
# Запустите инициализацию
python manage.py init_permissions
```

### Ошибка: "Cannot find module '@mui/x-tree-view'"

```bash
cd frontend-new
npm install @mui/x-tree-view
```

### Пользователь не видит данные

1. Проверьте наличие UserProfile: `UserProfile.objects.filter(user=user).exists()`
2. Проверьте роли: `user.profile.roles.all()`
3. Проверьте разрешения: `user.profile.get_all_permissions()`
4. Убедитесь, что компания/отдел активны (`is_active=True`)

---

## 🎯 Статус проекта

✅ **Готово к использованию** (75% завершено)

**Реализовано:**
- ✅ Backend модели и API
- ✅ Интеграция в CRM и Deals views
- ✅ Frontend для компаний и отделов
- ✅ Роутинг и навигация
- ✅ Документация

**TODO для полной функциональности:**
- ⏳ Frontend для ролей и пользователей
- ⏳ Интеграция в Realty/Finances/Documents/Reports views
- ⏳ Тестирование с реальными данными

---

## 📞 Следующие шаги

1. Установите `@mui/x-tree-view`
2. Запустите backend и frontend
3. Создайте компанию и профиль через Admin
4. Протестируйте доступ с разными ролями
5. При необходимости создайте компоненты для ролей/пользователей

---

**Система готова! Хорошей работы! 🚀**
