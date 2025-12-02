import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { BasicSettings } from './pages/BasicSettings';
import { AdvancedSettings } from './pages/AdvancedSettings';
import { AISettings } from './pages/AISettings';
import { ConfigProvider } from './contexts/ConfigContext';
import './App.css';

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-4">仪表板</h1>
      <p className="text-[#617589] dark:text-slate-400">选择左侧菜单配置机器人参数</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ConfigProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/basic" element={<BasicSettings />} />
            <Route path="/advanced" element={<AdvancedSettings />} />
            <Route path="/ai" element={<AISettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </ConfigProvider>
    </Router>
  );
}

export default App;
