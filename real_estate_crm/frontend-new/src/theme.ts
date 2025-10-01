// frontend-new/src/theme.ts

import { createTheme } from '@mui/material/styles';

// Создаем нашу кастомную тему
export const theme = createTheme({
  palette: {
    primary: {
      main: '#D4A017', // Элегантный золотой/янтарный
    },
    secondary: {
      main: '#2c3e50', // Глубокий серо-синий для контраста
    },
    background: {
      default: '#f4f6f8', // Очень светло-серый фон
      paper: '#ffffff',
    },
    text: {
        primary: '#34495e',
        secondary: '#7f8c8d',
    }
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
     h6: {
      fontWeight: 600,
    }
  },
  components: {
    // Стилизуем все карточки и панели в приложении
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }
        }
    },
    // Делаем кнопки чуть мягче
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none', // Убираем ЗАГЛАВНЫЕ буквы
                fontWeight: 600,
            }
        }
    }
  },
});