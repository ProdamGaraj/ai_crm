import { Box, Paper, Tooltip, Typography } from '@mui/material';
import type { Property } from '../../api/buildings';

interface ChessboardProps {
  properties: Property[];
}

// Новая, более сложная функция группировки: сначала по подъезду, потом по этажу
const groupProperties = (properties: Property[]) => {
  return properties.reduce((acc, prop) => {
    const entrance = prop.entrance || 0;
    const floor = prop.floor || 0;

    if (!acc[entrance]) {
      acc[entrance] = {};
    }
    if (!acc[entrance][floor]) {
      acc[entrance][floor] = [];
    }
    acc[entrance][floor].push(prop);
    return acc;
  }, {} as Record<number, Record<number, Property[]>>);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'success.light';
    case 'BOOKED': return 'warning.light';
    case 'SOLD': return 'error.light';
    default: return 'grey.300';
  }
};

export default function Chessboard({ properties }: ChessboardProps) {
  const propertiesByEntrance = groupProperties(properties);
  const entrances = Object.keys(propertiesByEntrance).map(Number).sort((a, b) => a - b);

  return (
    <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', p: 1 }}>
      {entrances.map(entrance => {
        const floors = Object.keys(propertiesByEntrance[entrance]).map(Number).sort((a, b) => b - a);
        return (
          <Paper key={entrance} sx={{ p: 1, minWidth: 300 }}>
            <Typography variant="h6" align="center" sx={{ mb: 1 }}>
              Подъезд {entrance}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              {floors.map((floor) => (
                <Box key={floor} sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                  <Box sx={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #eee' }}>
                    <Typography variant="subtitle2">{floor}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, p: 1 }}>
                    {propertiesByEntrance[entrance][floor]
                      .sort((a,b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
                      .map((prop) => (
                        <Tooltip key={prop.id} title={`№${prop.unit_number} - ${prop.status} - ${prop.area} м²`}>
                          <Box
                            sx={{
                              width: 80,
                              height: 60,
                              bgcolor: getStatusColor(prop.status),
                              borderRadius: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 },
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">{prop.unit_number}</Typography>
                            <Typography variant="caption">{prop.area} м²</Typography>
                          </Box>
                        </Tooltip>
                      ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}