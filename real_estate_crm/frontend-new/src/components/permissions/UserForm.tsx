import { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  updateUserProfile, 
  getCompanies, 
  getDepartments, 
  getRoles,
  type UserProfile 
} from '../../api/permissions';

interface UserFormProps {
  userProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ userProfile, onSuccess, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    company: userProfile?.company || null,
    department: userProfile?.department || null,
    roles: userProfile?.roles?.map(r => r.id) || [],
    position: userProfile?.position || '',
    phone: userProfile?.phone || '',
    is_system_admin: userProfile?.is_system_admin || false,
    is_active: userProfile?.is_active ?? true,
  });

  const [error, setError] = useState<string | null>(null);

  // Загрузка компаний
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => getCompanies(),
  });

  // Загрузка отделов для выбранной компании
  const { data: departments } = useQuery({
    queryKey: ['departments', formData.company],
    queryFn: () => getDepartments({ company: formData.company || undefined }),
    enabled: !!formData.company,
  });

  // Загрузка ролей
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
  });

  // Сброс отдела при смене компании
  useEffect(() => {
    if (formData.company !== userProfile?.company) {
      setFormData(prev => ({ ...prev, department: null }));
    }
  }, [formData.company, userProfile?.company]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateUserProfile(userProfile.id, data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.message || 'Ошибка при сохранении профиля');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Информация о пользователе */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Пользователь
          </Typography>
          <Typography variant="h6">{userProfile.user_username}</Typography>
          {userProfile.user_full_name && (
            <Typography variant="body2" color="text.secondary">
              {userProfile.user_full_name}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Компания */}
        <FormControl fullWidth>
          <InputLabel>Компания</InputLabel>
          <Select
            value={formData.company || ''}
            onChange={(e) => setFormData({ ...formData, company: e.target.value ? Number(e.target.value) : null })}
            label="Компания"
          >
            <MenuItem value="">Не назначена</MenuItem>
            {companies?.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Отдел */}
        <FormControl fullWidth disabled={!formData.company}>
          <InputLabel>Отдел</InputLabel>
          <Select
            value={formData.department || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value ? Number(e.target.value) : null })}
            label="Отдел"
          >
            <MenuItem value="">Не назначен</MenuItem>
            {departments?.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Роли */}
        <Autocomplete
          multiple
          options={roles || []}
          getOptionLabel={(option) => option.name}
          value={roles?.filter(r => formData.roles.includes(r.id)) || []}
          onChange={(_, newValue) => {
            setFormData({ ...formData, roles: newValue.map(r => r.id) });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Роли"
              placeholder="Выберите роли"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
                color="primary"
                size="small"
              />
            ))
          }
        />

        {/* Должность */}
        <TextField
          label="Должность"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          fullWidth
        />

        {/* Телефон */}
        <TextField
          label="Телефон"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          fullWidth
          placeholder="+7 (___) ___-__-__"
        />

        <Divider />

        {/* Флаги */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_system_admin}
                onChange={(e) => setFormData({ ...formData, is_system_admin: e.target.checked })}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Системный администратор</Typography>
                <Typography variant="caption" color="text.secondary">
                  Полный доступ ко всем функциям системы
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Активный пользователь"
          />
        </Box>

        {/* Кнопки */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
