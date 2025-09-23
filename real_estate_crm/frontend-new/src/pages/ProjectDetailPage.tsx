import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, createBuilding, getBuildings } from '../api/projects';
import {
    Box, Button, CircularProgress, Paper, Tab, Tabs, Typography,
    Dialog, DialogTitle, DialogContent, TextField, Stack, Link as MuiLink
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import BuildingForm from '../components/buildings/BuildingForm';
import type { BuildingPayload } from '../components/buildings/BuildingForm';
import { useForm } from 'react-hook-form';
import type { BuildingFilters, Building } from '../api/projects';

// Вспомогательный компонент для панели вкладок
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

  const [buildingFilters, setBuildingFilters] = useState<BuildingFilters>({});
  const { register: registerBuildingFilter, watch: watchBuildingFilter } = useForm<BuildingFilters>();

  // Запрос основной информации о проекте
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(Number(projectId)),
    enabled: !!projectId,
  });

  // Отдельный запрос для списка домов с фильтрацией
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings', projectId, buildingFilters],
    queryFn: () => getBuildings({ projectId: Number(projectId), filters: buildingFilters }),
    enabled: !!projectId,
  });

  // Отслеживаем ввод в поисковую строку для домов
  useEffect(() => {
    const subscription = watchBuildingFilter((value) => {
      const timer = setTimeout(() => {
        setBuildingFilters({ search: value.search });
      }, 500);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [watchBuildingFilter]);

  const createBuildingMutation = useMutation({
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['buildings', projectId] });
      setIsModalOpen(false);
    },
  });

  const handleCreateBuilding = (data: BuildingPayload) => {
    if (!projectId) return;
    createBuildingMutation.mutate({ projectId: Number(projectId), payload: data });
  };

  if (isLoadingProject || !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const buildingColumns: GridColDef<Building>[] = [
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
  ];

  return (
    <Paper>
      <Typography variant="h4" sx={{ p: 3, pb: 1 }}>{project.name}</Typography>
      <Typography color="text.secondary" sx={{ px: 3 }}>{project.address}</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tabValue} onChange={(_, newVal) => setTabValue(newVal)}>
          <Tab label="Детали проекта" />
          <Tab label={`Дома (${buildings?.length ?? 0})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography>Информация о проекте...</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={() => setIsModalOpen(true)}>
                Добавить дом
            </Button>
            <TextField
                label="Поиск по названию дома"
                fullWidth
                size="small"
                {...registerBuildingFilter('search')}
            />
        </Stack>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={buildings || []}
            columns={buildingColumns}
            loading={isLoadingBuildings}
            initialState={{
              sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
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