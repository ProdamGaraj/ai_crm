import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, CircularProgress, Alert, Link as MuiLink } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { getProjects } from '../api/projects';
import ProjectForm from '../components/projects/ProjectForm';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'name',
    headerName: 'Название проекта',
    flex: 1,
    renderCell: (params) => (
      <MuiLink component={RouterLink} to={`/projects/${params.id}`} underline="hover">
        {params.value}
      </MuiLink>
    ),
  },
  { field: 'address', headerName: 'Адрес', flex: 1 },
  {
    field: 'created_at',
    headerName: 'Дата создания',
    type: 'dateTime',
    width: 200,
    valueGetter: (value) => new Date(value),
  },
];

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Alert severity="error">Ошибка загрузки проектов: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Проекты
        </Typography>
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Создать проект
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новый проект</DialogTitle>
        <DialogContent>
          <ProjectForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data || []}
          columns={columns}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}