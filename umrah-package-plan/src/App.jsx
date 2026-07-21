import React from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import PatternGenerator from './PatternGenerator';
import PackageCalculator from './PackageCalculator';
import RoomManager from './RoomManager';
import Navbar from './Navbar';

function PageWrapper({ title, children }) {
  return (
    <div className="app">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

function HomePage() {
  return (
    <div className="app">
      <h1>🕋 Umrah Management System</h1>
      <p className="page-intro">
        Organize package planning, cost calculations, and room allocation from one connected workspace.
      </p>

      <div className="home-grid">
        <NavLink className="home-card" to="/pattern-generator">
          <h2>📋 Pattern Generator</h2>
          <p>Create and review room arrangement patterns for your package.</p>
        </NavLink>
        <NavLink className="home-card" to="/package-calculator">
          <h2>💰 Package Calculator</h2>
          <p>Estimate package totals and manage pricing details.</p>
        </NavLink>
        <NavLink className="home-card" to="/rooms">
          <h2>🏨 Room Manager</h2>
          <p>Track room assignments and occupancy in one place.</p>
        </NavLink>
      </div>

      <div className="dashboard-section">
        <PatternGenerator />
        <PackageCalculator />
        <RoomManager />
      </div>
    </div>
  );
}

function PackageCreationPage() {
  return (
    <div className="app">
      <h1>✏️ Package Creation</h1>
      <p className="page-intro">Combine planning and budgeting to build a complete Umrah package.</p>
      <div className="stacked-section">
        <PatternGenerator />
        <PackageCalculator />
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/package-creation" element={<PackageCreationPage />} />
          <Route path="/pattern-generator" element={<PageWrapper title="📋 Pattern Generator"><PatternGenerator /></PageWrapper>} />
          <Route path="/package-calculator" element={<PageWrapper title="💰 Package Calculator"><PackageCalculator /></PageWrapper>} />
          <Route path="/rooms" element={<PageWrapper ><RoomManager /></PageWrapper>} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;