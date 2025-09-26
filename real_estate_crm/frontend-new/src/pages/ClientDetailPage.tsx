import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClientById, updateClient, type ClientDetail } from '../api/clients';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
    Typography, CircularProgress, Alert, Paper, Grid, Box, Button, TextField,
    IconButton, Stack, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Link as MuiLink,
    Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import HumanizedLog from '../components/logs/HumanizedLog';
import MeetingForm from '../components/meetings/MeetingForm';
import type { Meeting } from '../api/meetings'; // <-- Исправлено здесь

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
    valueGetter: (value) => value ? new Date(value) : null,
  },
];

// Колонки для таблицы встреч
const meetingColumns: GridColDef<Meeting>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'status', headerName: 'Статус', width: 150 },
    { field: 'planned_date', headerName: 'План. дата', type: 'dateTime', width: 180, valueGetter: (value) => value ? new Date(value) : null },
    { field: 'executor', headerName: 'Исполнитель', width: 150 },
];


export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const { data: client, isLoading, isError, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(Number(clientId)),
    enabled: !!clientId,
  });

  const { register, control, handleSubmit, reset } = useForm<ClientDetail>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phone_numbers",
  });

  useEffect(() => {
    if (client) {
      reset(client);
    }
  }, [client, reset]);

  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      alert('Данные клиента успешно обновлены!');
    },
    onError: (err) => {
      alert(`Ошибка: ${err.message}`);
    }
  });

  const onSubmit = (data: ClientDetail) => {
    updateClientMutation.mutate({ id: Number(clientId), payload: data });
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Paper sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ p: 3, pb: 0 }}>
        {client?.full_name}
      </Typography>
      <Typography color="text.secondary" sx={{ px: 3 }}>
        {client?.phone_numbers.find(p => p.is_primary)?.phone_number || client?.phone_numbers[0]?.phone_number}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)}>
          <Tab label="Основная информация" />
          <Tab label={`Заявки (${client?.applications.length || 0})`} />
          <Tab label={`Встречи (${client?.meetings?.length || 0})`} />
          <Tab label={`Логи (${client?.logs.length || 0})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Личные данные</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} md={4}><TextField fullWidth label="ФИО" {...register('full_name')} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Email" type="email" {...register('email')} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Дата рождения" type="date" InputLabelProps={{ shrink: true }} {...register('date_of_birth')} /></Grid>

                <Grid item xs={12} md={4}>
                    <Controller
                      name="status"
                      control={control}
                      defaultValue={'ACTIVE'}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Статус клиента</InputLabel>
                          <Select {...field} label="Статус клиента">
                            <MenuItem value="ACTIVE">Активный</MenuItem>
                            <MenuItem value="INACTIVE">Неактивный</MenuItem>
                            <MenuItem value="ARCHIVED">В архиве</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                </Grid>
                <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Комментарий" multiline rows={1} {...register('comment')} />
                </Grid>
              </Grid>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Телефоны</Typography>
              {fields.map((field, index) => (
                <Stack direction="row" spacing={2} key={field.id} sx={{ mb: 2 }}>
                  <TextField
                    label={`Телефон ${index + 1}`}
                    fullWidth
                    {...register(`phone_numbers.${index}.phone_number`)}
                  />
                  <IconButton onClick={() => remove(index)}>
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => append({ phone_number: '', is_primary: fields.length === 0 })}
              >
                Добавить телефон
              </Button>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Паспортные данные и адреса</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}><TextField fullWidth label="Серия паспорта" {...register('passport_series')} /></Grid>
                    <Grid item xs={6} md={3}><TextField fullWidth label="Номер паспорта" {...register('passport_number')} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Кем выдан паспорт" {...register('passport_issued_by')} /></Grid>
                    <Grid item xs={6} md={3}><TextField fullWidth label="ИНН" {...register('inn')} /></Grid>
                    <Grid item xs={6} md={3}><TextField fullWidth label="ПИНФЛ" {...register('pinfl')} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Адрес прописки" {...register('registration_address')} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Расчетный адрес" {...register('billing_address')} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Ссылка на файлы" {...register('file_storage_link')} /></Grid>
                </Grid>
            </Paper>

            <Box>
                <Button type="submit" variant="contained" disabled={updateClientMutation.isPending}>
                    {updateClientMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </Box>
          </Stack>
        </form>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={client?.applications || []}
            columns={applicationColumns}
            disableRowSelectionOnClick
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => setIsMeetingModalOpen(true)}>
            Назначить встречу
        </Button>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={client?.meetings || []}
            columns={meetingColumns}
            disableRowSelectionOnClick
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Timeline position="right">
            {client?.logs.map((log) => (
                <TimelineItem key={log.id}>
                    <TimelineSeparator>
                        <TimelineDot />
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {new Date(log.created_at).toLocaleString()} - {log.user || 'Система'}
                        </Typography>
                        <HumanizedLog log={log} />
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
      </TabPanel>

      <Dialog open={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Новая встреча для клиента: {client?.full_name}</DialogTitle>
          <DialogContent>
              {client && (
                  <MeetingForm
                      clientId={client.id}
                      onSuccess={() => {
                          setIsMeetingModalOpen(false);
                          queryClient.invalidateQueries({ queryKey: ['client', clientId] });
                      }}
                  />
              )}
          </DialogContent>
      </Dialog>
    </Paper>
  );
}