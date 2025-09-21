import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // Используем localStorage
import { persistReducer, persistStore } from 'redux-persist';
import authReducer from './authSlice';

// Конфигурация для сохранения
const persistConfig = {
  key: 'root', // Ключ для хранения в localStorage
  storage,
  whitelist: ['auth'], // Указываем, какой "слайс" состояния нужно сохранять
};

// Создаем "персистентный" редьюсер
const persistedReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  // Используем наш новый редьюсер
  reducer: {
    auth: persistedReducer,
  },
  // Отключаем проверку на сериализуемость для redux-persist
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Создаем persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;