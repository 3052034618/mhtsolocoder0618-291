import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BoardPage } from '@/pages/Board/BoardPage';
import { LeadDetailPage } from '@/pages/LeadDetail/LeadDetailPage';
import { CustomersPage } from '@/pages/Customers/CustomersPage';
import { AnalyticsPage } from '@/pages/Analytics/AnalyticsPage';
import { GoalsPage } from '@/pages/Goals/GoalsPage';
import { NotificationsPage } from '@/pages/Notifications/NotificationsPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/lead/:id" element={<LeadDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
