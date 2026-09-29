import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Messages from './pages/Messages';
import Offers from './pages/Offers';
import Campaigns from './pages/Campaigns';
import Sims from './pages/Sims';
import Segments from './pages/Segments';
import Care from './pages/Care';
import Patterns from './pages/Patterns';
import Strategy from './pages/Strategy';
import Timeline from './pages/Timeline';
import Insights from './pages/Insights';
import Benchmark from './pages/Benchmark';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="messages" element={<Messages />} />
        <Route path="offers" element={<Offers />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="sims" element={<Sims />} />
        <Route path="segments" element={<Segments />} />
        <Route path="care" element={<Care />} />
        <Route path="patterns" element={<Patterns />} />
        <Route path="strategy" element={<Strategy />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="insights" element={<Insights />} />
        <Route path="benchmark" element={<Benchmark />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
