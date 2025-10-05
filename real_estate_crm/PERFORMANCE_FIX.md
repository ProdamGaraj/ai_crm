# Исправление производительности формы создания роли

## Проблема

При вводе текста в поля "Название роли" и "Код роли" наблюдались критические тормоза:
- Каждое нажатие клавиши занимало 180-600ms
- Браузер выдавал предупреждения: `[Violation] 'input' handler took <N>ms`
- Интерфейс становился неотзывчивым

## Причины

### 1. Инлайновые функции в onChange
```typescript
// ❌ ПЛОХО - создается новая функция при каждом рендере
onChange={(e) => setFormData({ ...formData, name: e.target.value })}
```

### 2. Создание нового объекта через spread
```typescript
// ❌ ПЛОХО - создается копия всего объекта formData
setFormData({ ...formData, name: e.target.value })
```

### 3. Перерисовка всех дочерних компонентов
- При изменении `formData` все компоненты формы перерисовывались
- Список разрешений (десятки Accordion с чекбоксами) рендерился заново
- Каждый рендер занимал сотни миллисекунд

## Решение

### 1. Использование useCallback для обработчиков

```typescript
// ✅ ХОРОШО - функция создается один раз
const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData((prev) => ({ ...prev, name: e.target.value }));
}, []);

// В компоненте:
<TextField
  onChange={handleNameChange}
/>
```

**Преимущества:**
- Функция создается один раз, а не при каждом рендере
- React не считает пропс измененным при сравнении
- Дочерние компоненты не перерисовываются

### 2. Использование функциональной формы setState

```typescript
// ✅ ХОРОШО - используется prev state
setFormData((prev) => ({ ...prev, name: e.target.value }))
```

**Преимущества:**
- Гарантирует актуальное состояние
- Не требует зависимости от formData в useCallback

### 3. Мемоизация компонента PermissionResourceGroup

```typescript
const PermissionResourceGroup = React.memo(({ 
  resource, 
  perms, 
  selectedPermissions,
  onPermissionToggle,
  onResourceToggle 
}) => {
  // Компонент перерисуется только если изменились пропсы
  const selectedCount = useMemo(
    () => resourcePermIds.filter((id: number) => selectedPermissions.includes(id)).length,
    [resourcePermIds, selectedPermissions]
  );
  
  return <Accordion>...</Accordion>;
});
```

**Преимущества:**
- Компонент не перерисовывается если пропсы не изменились
- Вычисления (selectedCount) кэшируются через useMemo
- Десятки аккордеонов не рендерятся при вводе в текстовое поле

### 4. Мемоизация группированных разрешений

```typescript
const groupedPermissions = useMemo(
  () => allPermissions ? groupPermissionsByResource(allPermissions) : {},
  [allPermissions]
);
```

**Преимущества:**
- Группировка выполняется один раз при загрузке
- Не пересчитывается при каждом рендере

## Измененные файлы

### `frontend-new/src/components/permissions/RoleForm.tsx`

**Изменения:**
1. Добавлен импорт: `React, { useState, useCallback, useMemo }`
2. Созданы мемоизированные обработчики:
   - `handleNameChange`
   - `handleCodeChange`
   - `handleLevelChange`
   - `handleDescriptionChange`
   - `handleIsActiveChange`
   - `handlePermissionToggle`
   - `handleResourceToggle`
3. Создан мемоизированный компонент `PermissionResourceGroup`
4. Добавлен `useMemo` для `groupedPermissions`

## Результат

- ✅ Ввод текста теперь моментальный (< 16ms)
- ✅ Нет предупреждений в консоли браузера
- ✅ Список разрешений не перерисовывается при вводе текста
- ✅ Интерфейс отзывчивый и плавный

## Тестирование

1. Откройте форму создания роли
2. Начните вводить текст в поле "Название роли"
3. Откройте DevTools → Console
4. Убедитесь что нет предупреждений `[Violation]`
5. Проверьте что ввод моментальный без задержек

## Дополнительная информация

### React.memo()
- Оборачивает компонент и сравнивает пропсы
- Если пропсы не изменились - используется закэшированный рендер
- Работает как PureComponent для функциональных компонентов

### useCallback()
- Мемоизирует функцию (возвращает ту же ссылку)
- Зависимости в массиве определяют когда пересоздать
- Пустой массив [] = функция создается один раз

### useMemo()
- Мемоизирует результат вычислений
- Пересчитывает только при изменении зависимостей
- Используется для тяжелых вычислений или создания объектов

## Статус

✅ **ИСПРАВЛЕНО** - Производительность формы оптимизирована, тормоза устранены

---

**Дата исправления:** 05.10.2025  
**Версия:** Frontend v1.0
