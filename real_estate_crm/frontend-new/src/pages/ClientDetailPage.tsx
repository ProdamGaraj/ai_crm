import { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClientById } from '../api/clients';
import { Typography, CircularProgress, Alert, Paper, Box, Tabs, Tab, Link as MuiLink } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

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

// Колонки для таблицы заявок
const applicationColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90,
    renderCell: (params) => (
      <MuiLink component={RouterLink} to={`/applications/${params.id}`} underline="hover">
        {params.id}
      </MuiLink>
    )
  },
  { field: 'status', headerName: 'Статус', width: 150 },
  { field: 'source', headerName: 'Источник', width: 150 },
  {
    field: 'created_at',
    headerName: 'Дата создания',
    type: 'dateTime',
    width: 200,
    valueGetter: (value) => new Date(value),
  },
];

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [tabValue, setTabValue] = useState(0);

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(Number(clientId)),
    enabled: !!clientId,
  });

  if (isLoading) return <CircularProgress />;
  if (isError || !client) return <Alert severity="error">Не удалось загрузить данные клиента.</Alert>;

  return (
    <Paper sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ p: 3, pb: 0 }}>
        {client.full_name}
      </Typography>
      <Typography color="text.secondary" sx={{ px: 3 }}>
        {client.phone_number}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)}>
          <Tab label="Основная информация" />
          <Tab label={`Заявки (${client.applications.length})`} />
          <Tab label={`Логи (${client.logs.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* TODO: Здесь будет детальная информация о клиенте (паспорт и т.д.) */}
        <Typography>Детальная информация о клиенте...</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={client.applications}
            columns={applicationColumns}
            disableRowSelectionOnClick
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Timeline position="right">
          {client.logs.map((log) => (
            <TimelineItem key={log.id}>
              <TimelineSeparator>
                <TimelineDot />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(log.created_at).toLocaleString()} - {log.user || 'Система'}
                </Typography>
                <Typography>{log.action}</Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </TabPanel>
    </Paper>
  );
}