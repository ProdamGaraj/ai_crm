import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Chip, Link as MuiLink } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMeetings, type Meeting } from '../api/meetings';
import MeetingDetailModal from '../components/meetings/MeetingDetailModal';
import { Link as RouterLink } from 'react-router-dom';

export default function MeetingsPage() {
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['meetings'],
        queryFn: getMeetings,
    });

    const sortedMeetings = [...(data || [])].sort((a, b) => {
        const aNeedsResult = a.is_auto_created && !a.result_comment;
        const bNeedsResult = b.is_auto_created && !b.result_comment;
        if (aNeedsResult && !bNeedsResult) return -1;
        if (!aNeedsResult && bNeedsResult) return 1;
        return new Date(b.planned_date).getTime() - new Date(a.planned_date).getTime();
    });

    const columns: GridColDef<Meeting>[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        {
            field: 'client', headerName: 'Клиент', width: 220,
            renderCell: (params) => (
                <MuiLink component={RouterLink} to={`/clients/${params.row.client.id}`} underline="hover">
                    {params.row.client.full_name}
                </MuiLink>
            )
        },
        {
            field: 'status',
            headerName: 'Статус',
            width: 180,
            renderCell: (params) => {
                const needsResult = params.row.is_auto_created && !params.row.result_comment;
                let label = params.row.status;
                let color: "default" | "success" | "warning" | "error" | "info" = "default";

                if (needsResult) {
                    label = "Нужен результат";
                    color = "info";
                } else if (params.row.is_overdue) {
                    label = 'Просрочена';
                    color = 'error';
                } else if (params.value === 'COMPLETED') {
                    color = 'success';
                } else if (params.value === 'CANCELLED') {
                    color = 'warning';
                }
                return <Chip label={label} color={color} size="small" variant={needsResult ? "outlined" : "filled"}/>;
            },
        },
        { field: 'planned_date', headerName: 'План. дата', width: 180, type: 'dateTime', valueGetter: (value) => new Date(value) },
        { field: 'executor', headerName: 'Исполнитель', width: 150 },
        { field: 'creator', headerName: 'Постановщик', width: 150, valueGetter: (value) => value || 'Система' },
    ];

    if (isLoading) return <CircularProgress />;
    if (isError) return <Alert severity="error">Ошибка загрузки встреч</Alert>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Встречи</Typography>
            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={sortedMeetings}
                    columns={columns}
                    onRowClick={(params) => setSelectedMeeting(params.row)}
                />
            </Box>
            <MeetingDetailModal
                meeting={selectedMeeting}
                open={!!selectedMeeting}
                onClose={() => setSelectedMeeting(null)}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['meetings'] })}
            />
        </Box>
    );
}