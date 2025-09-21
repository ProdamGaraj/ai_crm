// src/pages/ApplicationsPage.tsx

import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, CircularProgress, Alert } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApplications } from '../api/applications';
import ApplicationForm from '../components/applications/ApplicationForm';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    renderCell: (params) => (
      <MuiLink component={RouterLink} to={`/applications/${params.id}`} underline="hover">
        {params.id}
      </MuiLink>
    )
  },
  { field: 'status', headerName: 'Статус', width: 150 },
  { field: 'source', headerName: 'Источник', width: 150 },
  { field: 'client', headerName: 'Клиент', width: 250 },
  { field: 'created_by', headerName: 'Кем создана', width: 200 },
  {
    field: 'created_at',
    headerName: 'Дата создания',
    type: 'dateTime',
    width: 200,
    valueGetter: (value) => new Date(value),
  },
];

export default function ApplicationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Ошибка загрузки заявок</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Заявки</Typography>
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Создать заявку
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новая заявка</DialogTitle>
        <DialogContent>
          <ApplicationForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data || []}
          columns={columns}
          initialState={{ sorting: { sortModel: [{ field: 'id', sort: 'desc' }] } }}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}