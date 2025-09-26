import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import type { Property } from '../../api/buildings';
import { updateProperty } from '../../api/properties';
import { createDeal } from '../../api/deals';
import type { DealPayload } from '../../api/deals';
import BookingForm from '../deals/BookingForm';

interface ModalProps {
  property: Property | null;
  buildingId: number;
  open: boolean;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, buildingId, open, onClose }: ModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const { register, handleSubmit, setValue } = useForm<{ description: string }>();

  useEffect(() => {
    if (property) {
      setValue('description', property.description || '');
    }
  }, [property, setValue]);

  const updatePropMutation = useMutation({
    mutationFn: updateProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', String(buildingId)] });
      onClose();
    },
  });

  const createDealMutation = useMutation({
      mutationFn: createDeal,
      onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['building', String(buildingId)] });
          setBookingModalOpen(false);
          onClose();
          navigate(`/deals/${data.id}`);
      }
  });

  const handleStatusChange = (status: 'SELECTION' | 'RESERVE') => {
    if (!property) return;
    updatePropMutation.mutate({ buildingId, propertyId: property.id, payload: { status } });
  };

  const onCommentSave = (data: { description: string }) => {
    if (!property) return;
    updatePropMutation.mutate({ buildingId, propertyId: property.id, payload: { description: data.description } });
  };

  const onBookingSubmit = (data: DealPayload) => {
      if (!property) return;
      createDealMutation.mutate({ ...data, property: property.id });
  };

  if (!property) return null;

  return (
    <>
      <Dialog open={open && !isBookingModalOpen} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Объект №{property.unit_number}</DialogTitle>
        <DialogContent>
          <Stack direction={{xs: 'column', md: 'row'}} spacing={3} sx={{ mt: 1 }}>
            <Box flex={1}>
              <img
                src={property.layout?.main_layout_image || 'https://placehold.co/400x300/eee/ccc?text=No+Image'}
                alt={`Планировка`}
                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
              />
            </Box>
            <Box flex={1}>
              <Typography variant="h6">Детали</Typography>
              <Typography>Статус: {property.status}</Typography>
              <Typography>Площадь: {property.area} м²</Typography>
              <Typography>Цена: {property.price}</Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2, flexWrap: 'wrap' }}>
                {property.active_deal_id ? (
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to={`/deals/${property.active_deal_id}`}
                  >
                    Перейти в сделку
                  </Button>
                ) : (
                  <>
                    {property.status === 'SELECTION' &&
                      <Button variant="contained" onClick={() => handleStatusChange('RESERVE')} disabled={updatePropMutation.isPending}>Резервировать</Button>}
                    {property.status === 'RESERVE' &&
                      <Button variant="outlined" onClick={() => handleStatusChange('SELECTION')} disabled={updatePropMutation.isPending}>Снять резерв</Button>}
                    {(property.status === 'SELECTION' || property.status === 'RESERVE') &&
                      <Button variant="contained" color="secondary" onClick={() => setBookingModalOpen(true)}>Забронировать</Button>}
                  </>
                )}
              </Stack>

              <Box component="form" onSubmit={handleSubmit(onCommentSave)}>
                <TextField
                  label="Комментарий"
                  fullWidth
                  multiline
                  rows={4}
                  defaultValue={property.description}
                  {...register('description')}
                />
                <Button type="submit" sx={{ mt: 1 }} disabled={updatePropMutation.isPending}>
                  {updatePropMutation.isPending ? <CircularProgress size={24} /> : 'Сохранить комментарий'}
                </Button>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookingModalOpen} onClose={() => setBookingModalOpen(false)}>
          <DialogTitle>Забронировать объект №{property.unit_number}</DialogTitle>
          <DialogContent>
              <BookingForm onSubmit={onBookingSubmit} isPending={createDealMutation.isPending} />
          </DialogContent>
      </Dialog>
    </>
  );
}