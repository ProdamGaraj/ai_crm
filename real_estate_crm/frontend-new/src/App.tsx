import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import BuildingDetailPage from './pages/BuildingDetailPage';
// Импорт макетов и страниц
import RootLayout from './layouts/RootLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import DealsPage from './pages/DealsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SettingsPage from './pages/SettingsPage';
import DealDetailPage from './pages/DealDetailPage';
import DiscountsPage from './pages/DiscountsPage';
import DiscountDetailPage from './pages/DiscountDetailPage';
import MeetingsPage from './pages/MeetingsPage';
import FinancesPage from './pages/FinancesPage';
import PaymentDetailPage from './pages/PaymentDetailPage';
import ReportsPage from './pages/ReportsPage'; // <-- Добавьте этот импорт

// Компонент-обертка для защиты маршрутов
const ProtectedRoute = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Определяем все маршруты приложения
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'clients', element: <ClientsPage /> },
          { path: 'clients/:clientId', element: <ClientDetailPage /> },
          { path: 'applications', element: <ApplicationsPage /> },
          { path: 'applications/:applicationId', element: <ApplicationDetailPage /> },
          { path: 'meetings', element: <MeetingsPage /> },
          { path: 'deals', element: <DealsPage /> },
          { path: 'deals/:dealId', element: <DealDetailPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
          { path: 'projects/:projectId/buildings/:buildingId', element: <BuildingDetailPage /> },
          { path: 'finances', element: <FinancesPage /> },
          { path: 'finances/:paymentId', element: <PaymentDetailPage /> },
          { path: 'reports', element: <ReportsPage /> }, // <-- Добавьте эту строку
          { path: 'settings', element: <SettingsPage /> },
          { path: 'discounts', element: <DiscountsPage /> },
          { path: 'discounts/:discountId', element: <DiscountDetailPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;