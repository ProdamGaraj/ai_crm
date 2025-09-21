import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuildingById, uploadProperties, getPropertyTemplateUrl } from '../api/buildings';
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
  Button
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import Chessboard from '../components/buildings/Chessboard';

export default function BuildingDetailPage() {
  const { projectId, buildingId } = useParams<{ projectId: string; buildingId: string }>();
  const [viewMode, setViewMode] = useState<'table' | 'chessboard'>('table');
  const [selectedType, setSelectedType] = useState<string | null>(null);
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
      alert(data.status);
    },
    onError: (error) => {
      alert(`Ошибка загрузки: ${error.message}`);
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
    try {
      const response = await apiClient.get(getPropertyTemplateUrl(), {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'property_template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
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
          </Box>
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
            <Chessboard properties={filteredProperties} />
          )}
        </Box>
      </Box>
    </Paper>
  );
}