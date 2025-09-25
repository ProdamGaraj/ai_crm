import { useState, useEffect, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getDealById, updateDeal } from '../api/deals';
import type { DealUpdatePayload } from '../api/deals';
import DiscountsModal from '../components/deals/DiscountsModal';
import PaymentSchedule from '../components/deals/PaymentSchedule';
import DocumentGeneration from '../components/deals/DocumentGeneration';

import {
  Typography, CircularProgress, Alert, Paper, Grid, Box, TextField, Button,
  Divider, Link as MuiLink, Stack, Stepper, Step, StepLabel, StepContent
} from '@mui/material';

type DealFormInputs = Pick<DealUpdatePayload, 'contract_price' | 'notes' | 'contract_number' | 'contract_date'>;

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}


export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const queryClient = useQueryClient();
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);

  const [activeStep, setActiveStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => getDealById(Number(dealId)),
    enabled: !!dealId,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<DealFormInputs>();
  const watchedContractPrice = watch('contract_price');

  useEffect(() => {
    if (deal && !isInitialized) {
      let initialStep = 0;
      if (deal.contract_price) initialStep = 1;
      if (deal.payments?.length > 0) initialStep = 2;
      if (deal.payments?.length > 0 && deal.contract_number && deal.contract_date) {
        initialStep = 3;
      }
      setActiveStep(initialStep);
      setIsInitialized(true);
    }
    if (deal) {
      reset({
        contract_price: Number(deal.contract_price || deal.initial_price),
        notes: deal.notes || '',
        contract_number: deal.contract_number || '',
        contract_date: deal.contract_date || '',
      });
    }
  }, [deal, isInitialized, reset]);

  const updateDealMutation = useMutation({
    mutationFn: updateDeal,
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(['deal', dealId], updatedDeal);
      alert('Изменения сохранены!');
      if(updatedDeal.contract_price && activeStep === 1) {
        setActiveStep(2);
      }
    },
    onError: (error: any) => {
        const serverError = error.response?.data?.contract_number?.[0] || error.response?.data?.detail;
        alert(`Ошибка обновления: ${serverError || error.message}`);
    }
  });

  // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
  const handleConditionsSubmit = (data: DealFormInputs) => {
    const payload: DealUpdatePayload = {
      notes: data.notes,
      contract_price: Number(data.contract_price),
      contract_number: data.contract_number,
      contract_date: data.contract_date,
      applied_discounts_ids: deal?.applied_discounts.map(d => d.id)
    };
    updateDealMutation.mutate({ id: Number(dealId), payload });
  };

  const handleDiscountsSave = (newPrice: number, selectedIds: number[]) => {
    setValue('contract_price', newPrice);
    const payload: DealUpdatePayload = {
      contract_price: newPrice,
      applied_discounts_ids: selectedIds,
      notes: watch('notes')
    };
    updateDealMutation.mutate({ id: Number(dealId), payload });
    setDiscountModalOpen(false);
  };

  const pricePerSqmByContract = useMemo(() => {
    const price = Number(watchedContractPrice);
    if (!deal || !price || !deal.property || deal.property.area <= 0) return '0.00';
    return (price / deal.property.area).toFixed(2);
  }, [deal, watchedContractPrice]);

  if (isLoading) return <CircularProgress />;
  if (isError || !deal) return <Alert severity="error">Не удалось загрузить данные сделки.</Alert>;

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Сделка №{deal.id} (Статус: {deal.status})</Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {/* === ШАГ 1: ИНФОРМАЦИЯ О СДЕЛКЕ === */}
        <Step>
          <StepLabel onClick={() => setActiveStep(0)} sx={{cursor: 'pointer'}}>Информация о сделке</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3, my: 2 }} variant="outlined">
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography><b>Клиент:</b> <MuiLink component={RouterLink} to={`/clients/${deal.client.id}`}>{deal.client.full_name}</MuiLink></Typography>
                        <Typography><b>Объект:</b> {deal.property.property_type} №{deal.property.unit_number}, {deal.property.area} м²</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography><b>Начало брони:</b> {new Date(deal.booking_start_date).toLocaleString()}</Typography>
                        <Typography><b>Окончание брони:</b> {new Date(deal.booking_end_date).toLocaleString()}</Typography>
                    </Grid>
                </Grid>
            </Paper>
            <Button onClick={() => setActiveStep(1)} variant="contained">Далее</Button>
          </StepContent>
        </Step>

        {/* === ШАГ 2: УСЛОВИЯ СДЕЛКИ === */}
        <Step>
          <StepLabel onClick={() => setActiveStep(1)} sx={{cursor: 'pointer'}}>Условия сделки</StepLabel>
          <StepContent>
            <form onSubmit={handleSubmit(handleConditionsSubmit)}>
              <Paper sx={{ p: 3, my: 2 }} variant="outlined">
                 <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}><TextField label="Стоимость (начальная)" value={Number(deal.initial_price).toLocaleString()} fullWidth InputProps={{ readOnly: true }}/></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField label="Цена за м² (начальная)" value={Number(deal.initial_price_per_sqm).toLocaleString()} fullWidth InputProps={{ readOnly: true }}/></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField label="Стоимость по договору" type="number" fullWidth {...register('contract_price')} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField label="Цена за м² (договорная)" value={Number(pricePerSqmByContract).toLocaleString()} fullWidth InputProps={{ readOnly: true }}/></Grid>
                    <Grid item xs={12}>
                        <Button variant="outlined" sx={{mb: 1}} onClick={() => setDiscountModalOpen(true)}>Применить скидки</Button>
                        <Typography>Применено: {deal.applied_discounts.map(d => `${d.name} (${d.percentage_value}%)`).join(', ') || 'нет'}</Typography>
                    </Grid>
                    <Grid item xs={12}><TextField label="Примечание к сделке" multiline rows={4} fullWidth {...register('notes')} /></Grid>
                 </Grid>
              </Paper>
              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" disabled={updateDealMutation.isPending}>Сохранить и перейти к графику</Button>
                <Button onClick={() => setActiveStep(0)}>Назад</Button>
              </Stack>
            </form>
          </StepContent>
        </Step>

        {/* === ШАГ 3: ГРАФИК ПЛАТЕЖЕЙ === */}
        <Step>
          <StepLabel onClick={() => deal.contract_price && setActiveStep(2)} error={!deal.contract_price} sx={{cursor: 'pointer'}}>График платежей</StepLabel>
          <StepContent>
             <Paper sx={{ p: 3, my: 2 }} variant="outlined">
                {deal.contract_price ? (
                    <PaymentSchedule
                        dealId={deal.id}
                        contractPrice={Number(deal.contract_price)}
                        existingPayments={deal.payments || []}
                    />
                ) : <Alert severity="warning">Сначала сохраните "Стоимость по договору" на предыдущем шаге.</Alert>}
            </Paper>
            <Stack direction="row" spacing={2}>
                <Button onClick={() => setActiveStep(1)}>Назад</Button>
                <Button variant="contained" onClick={() => setActiveStep(3)} disabled={!deal.payments || deal.payments.length === 0}>Далее</Button>
            </Stack>
          </StepContent>
        </Step>

        {/* === ШАГ 4: ДОКУМЕНТЫ === */}
        <Step>
          <StepLabel onClick={() => deal.payments?.length > 0 && setActiveStep(3)} error={!deal.payments || deal.payments.length === 0} sx={{cursor: 'pointer'}}>Документы</StepLabel>
          <StepContent>
            <form onSubmit={handleSubmit(handleConditionsSubmit)}>
                 <Paper sx={{ p: 3, my: 2 }} variant="outlined">
                    <Typography variant="h6" gutterBottom>Данные договора</Typography>
                     <Grid container spacing={2} sx={{mb: 2}}>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Номер договора" {...register('contract_number')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Дата договора" type="date" InputLabelProps={{ shrink: true }} {...register('contract_date')} />
                        </Grid>
                     </Grid>
                     <Button type="submit" variant="outlined" size="small" disabled={updateDealMutation.isPending}>Сохранить данные договора</Button>
                     <Divider sx={{my: 3}}/>

                    <Typography variant="h6" gutterBottom>Генерация</Typography>
                    {deal.contract_number && deal.contract_date ? (
                        <DocumentGeneration deal={deal} />
                    ) : (
                        <Alert severity="info">Сохраните номер и дату договора, чтобы сгенерировать документы.</Alert>
                    )}
                </Paper>
                <Button onClick={() => setActiveStep(2)}>Назад</Button>
            </form>
          </StepContent>
        </Step>
      </Stepper>

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