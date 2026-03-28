import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Tools from './pages/Tools';
import Settings from './pages/Settings';
import Learning from './pages/Learning';
import Table from './pages/Table';
import CourseSettings from './pages/CourseSettings';
import UpsellSettings from './pages/UpsellSettings';
import TableHistory from './pages/TableHistory';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/table/:id" element={<Table />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/course-settings" element={<CourseSettings />} />
            <Route path="/upsell-settings" element={<UpsellSettings />} />
            <Route path="/table-history" element={<TableHistory />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
