import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuildingById, uploadProperties, getPropertyTemplateUrl } from '../api/buildings';
import type { Property } from '../api/buildings';
import apiClient from '../api/axios';
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Link as MuiLink,
  Stack,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import Chessboard from '../components/buildings/Chessboard';
import LayoutsTab from '../components/buildings/LayoutsTab';
import PropertyDetailModal from '../components/buildings/PropertyDetailModal';

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

export default function BuildingDetailPage() {
  const { projectId, buildingId } = useParams<{ projectId: string; buildingId: string }>();
  const [tabValue, setTabValue] = useState(1); // Начинаем со вкладки "Объекты"
  const [viewMode, setViewMode] = useState<'table' | 'chessboard'>('table');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: building, isLoading, isError } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => getBuildingById({ projectId: Number(projectId), buildingId: Number(buildingId) }),
    enabled: !!projectId && !!buildingId,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadProperties,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
      alert(data.status); // Временное уведомление
    },
    onError: (error) => {
      alert(`Ошибка загрузки: ${error.message}`); // Временное уведомление
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && projectId && buildingId) {
      uploadMutation.mutate({ projectId: Number(projectId), buildingId: Number(buildingId), file });
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!projectId || !buildingId) return;
    try {
      const url = getPropertyTemplateUrl(Number(projectId), Number(buildingId));
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'property_template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
      alert("Не удалось скачать шаблон.");
    }
  };

  const propertyTypes = useMemo(() => {
    if (!building?.properties) return [];
    return [...new Set(building.properties.map(p => p.property_type))];
  }, [building]);

  useEffect(() => {
    if (!selectedType && propertyTypes.length > 0) {
      setSelectedType(propertyTypes[0]);
    }
  }, [propertyTypes, selectedType]);

  const filteredProperties = useMemo(() => {
    if (!building?.properties) return [];
    if (!selectedType) return [];
    return building.properties.filter(p => p.property_type === selectedType);
  }, [building, selectedType]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !building) {
    return <Alert severity="error">Не удалось загрузить данные о доме.</Alert>;
  }

  const propertyColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'unit_number', headerName: 'Номер объекта', flex: 1 },
    { field: 'status', headerName: 'Статус', flex: 1 },
    { field: 'area', headerName: 'Площадь (м²)', type: 'number' },
    { field: 'price', headerName: 'Цена', type: 'number', flex: 1 },
  ];

  return (
    <Paper>
      <Typography variant="h4" sx={{ p: 3, pb: 1 }}>{building.name}</Typography>
      <Typography color="text.secondary" sx={{ px: 3 }}>
        Проект: <MuiLink component={RouterLink} to={`/projects/${projectId}`} underline="hover">{building.project.name}</MuiLink>
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tabValue} onChange={(_, newVal) => setTabValue(newVal)}>
          <Tab label="Детали дома" />
          <Tab label={`Объекты (${building.properties.length})`} />
          <Tab label="Планировки" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography>Здесь будет форма для редактирования деталей дома (высота потолков, материал и т.д.)...</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <ToggleButtonGroup
              value={selectedType}
              exclusive
              onChange={(_, newValue) => { if (newValue) setSelectedType(newValue); }}
            >
              {propertyTypes.map(type => (
                <ToggleButton key={type} value={type}>{type}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }}
            >
              <ToggleButton value="table"><ViewListIcon /></ToggleButton>
              <ToggleButton value="chessboard"><ViewModuleIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="contained">Добавить объект вручную</Button>
            <Button variant="outlined" onClick={handleDownload}>
              Скачать шаблон
            </Button>
            <Button variant="outlined" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить Excel'}
            </Button>
          </Stack>
        </Stack>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".xlsx, .xls"
        />
        <Box sx={{ mt: 2 }}>
          {viewMode === 'table' ? (
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid rows={filteredProperties} columns={propertyColumns} />
            </Box>
          ) : (
            <Chessboard
              properties={filteredProperties}
              onCellClick={(property) => setSelectedProperty(property)}
            />
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <LayoutsTab buildingId={Number(buildingId)} />
      </TabPanel>

      <PropertyDetailModal
        property={selectedProperty}
        buildingId={Number(buildingId)}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </Paper>
  );
}