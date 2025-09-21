import { useState, useEffect, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { getDealById, updateDeal } from '../api/deals';
import type { DealUpdatePayload } from '../api/deals';
import DiscountsModal from '../components/deals/DiscountsModal';
import {
  Typography, CircularProgress, Alert, Paper, Grid, Box, TextField, Button,
  Divider, Link as MuiLink, Stack
} from '@mui/material';

type DealFormInputs = {
  contract_price: number | string; // Может быть строкой из-за форматирования
  notes: string;
};

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const queryClient = useQueryClient();
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);

  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => getDealById(Number(dealId)),
    enabled: !!dealId,
  });

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<DealFormInputs>();

  const watchedContractPrice = watch('contract_price');

  useEffect(() => {
    if (deal) {
      reset({
        contract_price: parseFloat(deal.contract_price || deal.initial_price),
        notes: deal.notes || '',
      });
    }
  }, [deal, reset]);

  const updateDealMutation = useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      alert('Изменения сохранены!');
    },
    onError: (error) => {
      alert(`Ошибка обновления: ${error.message}`);
    }
  });

  // Эта функция теперь сохраняет все изменения на странице
  const onFormSubmit = (data: DealFormInputs) => {
    const payload: DealUpdatePayload = {
        ...data,
        contract_price: Number(data.contract_price), // Убедимся, что отправляем число
        applied_discounts_ids: deal?.applied_discounts.map(d => d.id) // Передаем текущие скидки
    };
    updateDealMutation.mutate({ id: Number(dealId), payload });
  };

  // Эта функция теперь только обновляет данные в форме, но не отправляет их на сервер
  const handleDiscountsSave = (newPrice: number, selectedIds: number[]) => {
    // Обновляем поле contract_price в форме
    setValue('contract_price', newPrice);

    // Сразу отправляем изменения на сервер, включая ID скидок
    const payload: DealUpdatePayload = {
      contract_price: newPrice,
      applied_discounts_ids: selectedIds,
      notes: watch('notes') // Захватываем текущее значение из поля заметок
    };
    updateDealMutation.mutate({ id: Number(dealId), payload });

    setDiscountModalOpen(false);
  };

  const pricePerSqmByContract = useMemo(() => {
    const price = Number(watchedContractPrice);
    if (!deal || !price || deal.property.area <= 0) {
      return '0.00';
    }
    return (price / deal.property.area).toFixed(2);
  }, [deal, watchedContractPrice]);


  if (isLoading) return <CircularProgress />;
  if (isError || !deal) return <Alert severity="error">Не удалось загрузить данные сделки.</Alert>;

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Stack spacing={4}>
          <Typography variant="h4">Сделка №{deal.id} (Статус: {deal.status})</Typography>

          {/* БЛОК 1: ИНФОРМАЦИЯ О СДЕЛКЕ */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Информация о сделке</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Дата начала брони"
                  value={new Date(deal.booking_start_date).toLocaleDateString()}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                 <TextField
                  label="Дата окончания брони"
                  value={new Date(deal.booking_end_date).toLocaleDateString()}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                 <TextField
                  label="Ответственный менеджер"
                  value={deal.created_by || 'Не назначен'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><b>Клиент:</b></Typography>
                <MuiLink component={RouterLink} to={`/clients/${deal.client.id}`} variant="body1">
                  {deal.client.full_name} ({deal.client.phone_number})
                </MuiLink>
              </Grid>
            </Grid>
          </Paper>

          {/* БЛОК 2: УСЛОВИЯ СДЕЛКИ */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Условия сделки</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Параметры объекта</Typography>
                <Typography>
                  <b>Объект:</b> {deal.property.property_type}, №{deal.property.unit_number}, {deal.property.area} м²
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Стоимость (начальная)"
                  value={new Intl.NumberFormat('ru-RU').format(Number(deal.initial_price))}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Цена за м² (начальная)"
                  value={new Intl.NumberFormat('ru-RU').format(Number(deal.initial_price_per_sqm))}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  name="contract_price"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Стоимость по договору" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                 <TextField
                  label="Цена за м² (договорная)"
                  value={new Intl.NumberFormat('ru-RU').format(Number(pricePerSqmByContract))}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">Скидки</Typography>
                <Button variant="outlined" sx={{mb: 1}} onClick={() => setDiscountModalOpen(true)}>
                    Применить скидки
                </Button>
                 {deal.applied_discounts.length > 0 ? (
                    <Typography>
                        Применено: {deal.applied_discounts.map(d => `${d.name} (${d.percentage_value}%)`).join(', ')}
                    </Typography>
                ) : (
                    <Typography color="text.secondary">Скидки не применены.</Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Примечание к сделке" multiline rows={4} fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          <Box>
            <Button type="submit" variant="contained" disabled={updateDealMutation.isPending}>
              {updateDealMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </Box>
        </Stack>
      </form>

      {isDiscountModalOpen && (
        <DiscountsModal
            open={isDiscountModalOpen}
            dealId={Number(dealId)}
            basePrice={Number(deal.initial_price)}
            appliedDiscountIds={deal.applied_discounts.map(d => d.id)}
            onClose={() => setDiscountModalOpen(false)}
            onSave={handleDiscountsSave}
        />
      )}
    </>
  );
}