import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, createBuilding } from '../api/projects';
import { Box, Button, CircularProgress, Paper, Tab, Tabs, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import BuildingForm from '../components/buildings/BuildingForm';
import type { BuildingPayload } from '../components/buildings/BuildingForm';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

// Вспомогательный компонент для панели вкладок, который вызывал ошибку
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(Number(projectId)),
    enabled: !!projectId,
  });

  const createBuildingMutation = useMutation({
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsModalOpen(false); // Закрываем окно при успехе
    },
  });

  const handleCreateBuilding = (data: BuildingPayload) => {
    if (!projectId) return;
    createBuildingMutation.mutate({ projectId: Number(projectId), payload: data });
  };

  if (isLoading || !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const buildingColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'name',
      headerName: 'Название/Номер',
      flex: 1,
      renderCell: (params) => (
        <MuiLink component={RouterLink} to={`/projects/${projectId}/buildings/${params.id}`} underline="hover">
          {params.value}
        </MuiLink>
      )
    },
    { field: 'floors_count', headerName: 'Этажей' },
    // Добавьте другие колонки для домов по необходимости
  ];

  return (
    <Paper>
      <Typography variant="h4" sx={{ p: 3, pb: 1 }}>{project.name}</Typography>
      <Typography color="text.secondary" sx={{ px: 3 }}>{project.address}</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tabValue} onChange={(_, newVal) => setTabValue(newVal)}>
          <Tab label="Детали проекта" />
          <Tab label={`Дома (${project.buildings.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Здесь будет форма для редактирования данных проекта */}
        <Typography>Информация о проекте...</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Button sx={{ mb: 2 }} variant="contained" onClick={() => setIsModalOpen(true)}>
          Добавить дом
        </Button>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={project.buildings}
            columns={buildingColumns}
            initialState={{
              sorting: {
                sortModel: [{ field: 'id', sort: 'desc' }],
              },
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </TabPanel>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новый дом</DialogTitle>
        <DialogContent>
          <BuildingForm
            onSubmit={handleCreateBuilding}
            isPending={createBuildingMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
}