import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMeeting, type Meeting, type MeetingPayload } from '../../api/meetings';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  Typography, TextField, Alert, Grid
} from '@mui/material';

interface Props {
  meeting: Meeting | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type FormInputs = {
  status: 'COMPLETED' | 'CANCELLED';
  actual_date: string;
  result_comment: string;
};

export default function MeetingDetailModal({ meeting, open, onClose, onUpdate }: Props) {
  const { register, handleSubmit } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateMeeting,
    onSuccess: () => {
      onUpdate();
      onClose();
    },
    onError: (error) => alert(`Ошибка: ${error.message}`)
  });

  if (!meeting) return null;

  const handleStatusUpdate = (status: 'COMPLETED' | 'CANCELLED') => {
    const payload: Partial<MeetingPayload> = { status };
    if (status === 'COMPLETED') {
      payload.actual_date = new Date().toISOString();
    }
    mutation.mutate({ id: meeting.id, payload });
  };

  const handleResultSubmit = (data: { result_comment: string }) => {
     mutation.mutate({ id: meeting.id, payload: { result_comment: data.result_comment, status: 'COMPLETED' } });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Встреча №{meeting.id}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                    <Typography variant="h6">Детали встречи</Typography>
                    <Typography><strong>Клиент:</strong> {meeting.client.full_name}</Typography>
                    <Typography><strong>Статус:</strong> {meeting.is_overdue ? 'Просрочена' : meeting.status}</Typography>
                    <Typography><strong>План. дата:</strong> {new Date(meeting.planned_date).toLocaleString()}</Typography>
                    <Typography><strong>Исполнитель:</strong> {meeting.executor}</Typography>
                    <Typography><strong>Постановщик:</strong> {meeting.creator || 'Система'}</Typography>
                    {meeting.interested_building && <Typography><strong>Интерес:</strong> {meeting.interested_building.name}</Typography>}
                    {meeting.comment && <Typography><strong>Комментарий:</strong> {meeting.comment}</Typography>}
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                    <Typography variant="h6">Результат</Typography>
                    {meeting.status === 'COMPLETED' ? (
                         <form onSubmit={handleSubmit(handleResultSubmit)}>
                            <Stack spacing={2}>
                                <TextField
                                    label="Комментарий по результатам"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    defaultValue={meeting.result_comment}
                                    {...register('result_comment')}
                                />
                                <Button type="submit" variant="contained" disabled={mutation.isPending}>Сохранить результат</Button>
                            </Stack>
                         </form>
                    ) : (
                        <Alert severity="info">Заполните результат после завершения встречи.</Alert>
                    )}
                </Stack>
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        {meeting.status === 'NEW' && (
            <>
                <Button onClick={() => handleStatusUpdate('CANCELLED')} color="warning" disabled={mutation.isPending}>Не состоялась</Button>
                <Button onClick={() => handleStatusUpdate('COMPLETED')} color="success" variant="contained" disabled={mutation.isPending}>Состоялась</Button>
            </>
        )}
      </DialogActions>
    </Dialog>
  );
}