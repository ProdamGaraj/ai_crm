import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

// Иконки
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ

const drawerWidth = 240;

const navItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, path: '/' },
  { text: 'Клиенты', icon: <PeopleIcon />, path: '/clients' },
  { text: 'Заявки', icon: <AssignmentIcon />, path: '/applications' },
  { text: 'Сделки', icon: <BusinessCenterIcon />, path: '/deals' },
  { text: 'Проекты', icon: <AccountBalanceIcon />, path: '/projects' },
  { text: 'Настройки', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Скидки', icon: <LocalOfferIcon />, path: '/discounts' },
];

export default function RootLayout() {
  // ... остальной код файла без изменений ...
  return (
    <Box sx={{ display: 'flex' }}>
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
        <Toolbar />
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
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}