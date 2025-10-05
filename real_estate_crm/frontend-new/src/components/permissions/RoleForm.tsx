import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createRole, updateRole, getPermissions, type Role } from '../../api/permissions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface RoleFormProps {
  role?: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

// Области действия роли
const ROLE_SCOPES = [
  { value: 'SYSTEM', label: 'Вся система' },
  { value: 'COMPANY', label: 'Компания' },
  { value: 'DEPARTMENT', label: 'Отдел' },
  { value: 'OWN', label: 'Только свои данные' },
];

// Категории ролей
const ROLE_CATEGORIES = [
  { value: 'ADMINISTRATIVE', label: 'Административная' },
  { value: 'MANAGEMENT', label: 'Управленческая' },
  { value: 'OPERATIONAL', label: 'Операционная' },
  { value: 'READONLY', label: 'Только просмотр' },
  { value: 'CUSTOM', label: 'Пользовательская' },
];

// Группировка разрешений по ресурсам
const groupPermissionsByResource = (permissions: any[]) => {
  const grouped: Record<string, any[]> = {};
  
  permissions.forEach((perm) => {
    const resource = perm.resource || 'OTHER';
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push(perm);
  });
  
  return grouped;
};

// Русские названия ресурсов
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

// Русские названия для action
const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Просмотр',
  ADD: 'Создание',
  EDIT: 'Редактирование',
  DELETE: 'Удаление',
};

// Русские названия для scope
const SCOPE_LABELS: Record<string, string> = {
  OWN: 'Свои',
  DEPARTMENT: 'Отдел',
  COMPANY: 'Компания',
  SYSTEM: 'Система',
};

// Мемоизированный компонент для группы разрешений
const PermissionResourceGroup = React.memo(({ 
  resource, 
  perms, 
  selectedPermissions,
  onPermissionToggle,
  onResourceToggle 
}: { 
  resource: string; 
  perms: any[]; 
  selectedPermissions: number[];
  onPermissionToggle: (id: number) => void;
  onResourceToggle: (perms: any[]) => void;
}) => {
  const resourcePermIds = useMemo(() => perms.map((p: any) => p.id), [perms]);
  const selectedCount = useMemo(
    () => resourcePermIds.filter((id: number) => selectedPermissions.includes(id)).length,
    [resourcePermIds, selectedPermissions]
  );
  const allSelected = selectedCount === resourcePermIds.length;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            onChange={() => onResourceToggle(perms)}
            onClick={(e) => e.stopPropagation()}
          />
          <Typography sx={{ flex: 1 }}>
            {RESOURCE_LABELS[resource] || resource}
          </Typography>
          <Chip
            label={`${selectedCount}/${resourcePermIds.length}`}
            size="small"
            color={selectedCount > 0 ? 'primary' : 'default'}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {perms.map((perm: any) => {
            const action = ACTION_LABELS[perm.action] || perm.action;
            const scope = SCOPE_LABELS[perm.scope] || perm.scope;
            
            return (
              <FormControlLabel
                key={perm.id}
                control={
                  <Checkbox
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => onPermissionToggle(perm.id)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      {action}
                      <Chip
                        label={scope}
                        size="small"
                        sx={{ ml: 1 }}
                        variant="outlined"
                        color="secondary"
                      />
                    </Typography>
                    {perm.description && (
                      <Typography variant="caption" color="text.secondary">
                        {perm.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    code: role?.code || '',
    scope: role?.scope || 'OWN',
    category: role?.category || 'CUSTOM',
    description: role?.description || '',
    is_active: role?.is_active ?? true,
    permissions: role?.permissions?.map(p => p.id) || [] as number[],
  });

  const [error, setError] = useState<string | null>(null);

  // Загрузка всех доступных разрешений
  const { data: allPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => getPermissions(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Преобразуем permissions в permission_ids для backend
      const payload = {
        ...data,
        permission_ids: data.permissions,
      };
      delete payload.permissions; // Удаляем старое поле
      
      if (role) {
        return updateRole(role.id, payload);
      }
      return createRole(payload);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.message || 'Ошибка при сохранении роли');
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(formData);
  }, [formData, mutation]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
  }, []);

  const handleScopeChange = useCallback((e: any) => {
    setFormData((prev) => ({ ...prev, scope: e.target.value }));
  }, []);

  const handleCategoryChange = useCallback((e: any) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  }, []);

  const handleIsActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_active: e.target.checked }));
  }, []);

  const handlePermissionToggle = useCallback((permissionId: number) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  }, []);

  const handleResourceToggle = useCallback((resourcePerms: any[]) => {
    const resourcePermIds = resourcePerms.map((p) => p.id);
    
    setFormData((prev) => {
      const allSelected = resourcePermIds.every((id) => prev.permissions.includes(id));
      let permissions;
      if (allSelected) {
        // Снять все
        permissions = prev.permissions.filter((id) => !resourcePermIds.includes(id));
      } else {
        // Выбрать все
        const newIds = resourcePermIds.filter((id) => !prev.permissions.includes(id));
        permissions = [...prev.permissions, ...newIds];
      }
      return { ...prev, permissions };
    });
  }, []);

  const groupedPermissions = useMemo(
    () => allPermissions ? groupPermissionsByResource(allPermissions) : {},
    [allPermissions]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Основная информация */}
        <TextField
          label="Название роли"
          value={formData.name}
          onChange={handleNameChange}
          required
          fullWidth
        />

        <TextField
          label="Код роли"
          value={formData.code}
          onChange={handleCodeChange}
          required
          fullWidth
          helperText="Уникальный код роли (например: MANAGER, ADMIN)"
        />

        <FormControl fullWidth>
          <InputLabel>Область действия</InputLabel>
          <Select
            value={formData.scope}
            onChange={handleScopeChange}
            label="Область действия"
          >
            {ROLE_SCOPES.map((scope) => (
              <MenuItem key={scope.value} value={scope.value}>
                {scope.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Категория роли</InputLabel>
          <Select
            value={formData.category}
            onChange={handleCategoryChange}
            label="Категория роли"
          >
            {ROLE_CATEGORIES.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Описание"
          value={formData.description}
          onChange={handleDescriptionChange}
          multiline
          rows={2}
          fullWidth
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.is_active}
              onChange={handleIsActiveChange}
            />
          }
          label="Активная роль"
        />

        <Divider />

        {/* Выбор разрешений */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Разрешения ({formData.permissions.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Выберите разрешения для этой роли
          </Typography>

          {permissionsLoading ? (
            <Typography>Загрузка разрешений...</Typography>
          ) : (
            <Stack spacing={1}>
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <PermissionResourceGroup
                  key={resource}
                  resource={resource}
                  perms={perms}
                  selectedPermissions={formData.permissions}
                  onPermissionToggle={handlePermissionToggle}
                  onResourceToggle={handleResourceToggle}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Кнопки */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !formData.name || !formData.code}
          >
            {mutation.isPending ? 'Сохранение...' : role ? 'Обновить' : 'Создать'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
