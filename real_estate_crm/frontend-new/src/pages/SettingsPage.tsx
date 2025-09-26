// real_estate_crm/frontend-new/src/pages/SettingsPage.tsx

import { useState } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import ReasonManager from '../components/settings/ReasonManager';
import BuildingTypeManager from '../components/settings/BuildingTypeManager';
import PaymentTypeManager from '../components/settings/PaymentTypeManager';
import BeneficiaryAccountManager from '../components/settings/BeneficiaryAccountManager';
import TemplateManager from '../components/settings/TemplateManager'; // <--- ИСПРАВЛЕНИЕ: ДОБАВЛЕН ЭТОТ ИМПОРТ
import TemplateTagsCheatSheet from '../components/settings/TemplateTagsCheatSheet';

// Вспомогательный компонент TabPanel
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

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Настройки</Typography>
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Заявки" />
            <Tab label="Недвижимость" />
            <Tab label="Финансы" />
            <Tab label="Шаблоны" />
          </Tabs>
        </Box>

        {/* Вкладка "Заявки" */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Причины отказа / нецелевых заявок</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <ReasonManager title="Причины для статуса «Нецелевая»" reasonType="JUNK" />
            </Grid>
            <Grid item xs={12} md={6}>
              <ReasonManager title="Причины для статуса «Отказ»" reasonType="REJECTED" />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Вкладка "Недвижимость" */}
        <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>Типы домов</Typography>
            <BuildingTypeManager />
        </TabPanel>

        {/* Вкладка "Финансы" */}
        <TabPanel value={tabValue} index={2}>
           <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <PaymentTypeManager />
            </Grid>
            <Grid item xs={12} md={6}>
              <BeneficiaryAccountManager />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Вкладка "Шаблоны" */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <TemplateManager />
            </Grid>
            <Grid item xs={12} md={5}>
              <TemplateTagsCheatSheet />
            </Grid>
          </Grid>
        </TabPanel>

      </Paper>
    </Box>
  );
}