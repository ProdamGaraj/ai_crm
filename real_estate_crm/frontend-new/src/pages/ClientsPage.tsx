import { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, Link as MuiLink } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { getClients } from '../api/clients';
import ClientForm from '../components/clients/ClientForm';

// Определяем колонки для таблицы
const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90
  },
  {
    field: 'full_name',
    headerName: 'Полное имя',
    width: 250,
    renderCell: (params) => (
      <MuiLink component={RouterLink} to={`/clients/${params.id}`} underline="hover">
        {params.value}
      </MuiLink>
    ),
  },
  {
    field: 'phone_number',
    headerName: 'Телефон',
    width: 200
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 250
  },
  {
    field: 'created_at',
    headerName: 'Дата создания',
    width: 200,
    type: 'dateTime', // Указываем тип для корректной сортировки
    valueGetter: (value) => new Date(value), // Преобразуем строку в объект Date
  },
];

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Alert severity="error">Ошибка загрузки данных: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Клиенты
        </Typography>
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Создать клиента
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новый клиент</DialogTitle>
        <DialogContent>
          <ClientForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            // Сортировка по ID по убыванию по умолчанию
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}