import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';

export default function DealDetailPage() {
  const { dealId } = useParams();
  return <Typography variant="h4">Карточка Сделки №{dealId}</Typography>;
}