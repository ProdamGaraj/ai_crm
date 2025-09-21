// src/layouts/RootLayout.tsx

import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

// Иконки
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
const drawerWidth = 240; // Ширина бокового меню
import SettingsIcon from '@mui/icons-material/Settings';
const navItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, path: '/' },
  { text: 'Клиенты', icon: <PeopleIcon />, path: '/clients' },
  { text: 'Заявки', icon: <AssignmentIcon />, path: '/applications' },
  { text: 'Сделки', icon: <BusinessCenterIcon />, path: '/deals' },
  { text: 'Проекты', icon: <AccountBalanceIcon />, path: '/projects' },
  { text: 'Настройки', icon: <SettingsIcon />, path: '/settings' },
];

export default function RootLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Боковое меню */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Пустой тулбар для отступа сверху */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Основной контент */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Отступ, чтобы контент не уезжал под шапку (которой пока нет) */}
        <Outlet /> {/* Сюда React Router будет рендерить наши страницы */}
      </Box>
    </Box>
  );
}