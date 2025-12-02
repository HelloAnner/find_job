import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { BasicSettings } from './pages/BasicSettings';
import { AdvancedSettings } from './pages/AdvancedSettings';
import { AISettings } from './pages/AISettings';
import { ConfigProvider } from './contexts/ConfigContext';
import './App.css';

function App() {
  return (
    <Router>
      <ConfigProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/basic" replace />} />
            <Route path="/basic" element={<BasicSettings />} />
            <Route path="/advanced" element={<AdvancedSettings />} />
            <Route path="/ai" element={<AISettings />} />
            <Route path="*" element={<Navigate to="/basic" replace />} />
          </Routes>
        </Layout>
      </ConfigProvider>
    </Router>
  );
}

export default App;
