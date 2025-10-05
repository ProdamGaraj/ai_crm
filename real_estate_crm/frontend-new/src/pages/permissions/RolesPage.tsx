import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Stack,
  Chip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { getRoles } from '../../api/permissions';
import RoleForm from '../../components/permissions/RoleForm';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';

const ROLE_LEVEL_LABELS: Record<string, string> = {
  SYSTEM: 'Системный',
  COMPANY: 'Компания',
  DEPARTMENT: 'Отдел',
  PERSONAL: 'Личный',
};

// Маппинг кодов ролей на русские названия (на случай если приходит code вместо name)
const ROLE_NAME_MAPPING: Record<string, string> = {
  'SYSTEM_ADMIN': 'Системный администратор',
  'COMPANY_ADMIN': 'Администратор компании',
  'DEPARTMENT_MANAGER': 'Руководитель отдела',
  'MANAGER': 'Менеджер',
  'VIEWER': 'Наблюдатель',
};

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  {
    field: 'name',
    headerName: 'Название',
    width: 250,
    renderCell: (params) => {
      // Используем name если есть, иначе пытаемся перевести code
      const displayName = params.value || ROLE_NAME_MAPPING[params.row.code] || params.row.code;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" fontSize="small" />
          <MuiLink
            component={RouterLink}
            to={`/permissions/roles/${params.row.id}`}
            underline="hover"
          >
            {displayName}
          </MuiLink>
        </Box>
      );
    },
  },
  { field: 'code', headerName: 'Код', width: 150 },
  {
    field: 'level',
    headerName: 'Уровень',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={ROLE_LEVEL_LABELS[params.value] || params.value}
        color="info"
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: 'permissions_count',
    headerName: 'Разрешений',
    width: 120,
    type: 'number',
    renderCell: (params) => (
      <Chip
        label={params.value || 0}
        color="success"
        size="small"
      />
    ),
  },
  { field: 'description', headerName: 'Описание', width: 300 },
  {
    field: 'is_active',
    headerName: 'Статус',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value ? 'Активна' : 'Неактивна'}
        color={params.value ? 'success' : 'default'}
        size="small"
      />
    ),
  },
];

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  return (
    <Stack spacing={3}>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Роли
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление ролями и разрешениями системы
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
        >
          Создать роль
        </Button>
      </Box>

      {/* Таблица */}
      <Paper sx={{ p: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Ошибка загрузки: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={data || []}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            autoHeight
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* Модальное окно создания */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создать роль</DialogTitle>
        <DialogContent>
          <RoleForm onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
