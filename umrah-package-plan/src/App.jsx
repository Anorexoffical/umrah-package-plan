// App.jsx
import React, { useState } from 'react';
import './App.css';
import PatternGenerator from './PatternGenerator';
import PackageCalculator from './PackageCalculator';
import RoomManager from './RoomManager';

function App() {
  const [activeTab, setActiveTab] = useState('pattern');

  return (
    <div className="app">
      <h1>🕋 Umrah Management System</h1>
      
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => setActiveTab('pattern')}
        >
          📋 Pattern Generator
        </button>
        <button
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          💰 Package Calculator
        </button>
        <button
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          🏨 Room Manager
        </button>
      </div>

      {activeTab === 'pattern' && <PatternGenerator />}
      {activeTab === 'calculator' && <PackageCalculator />}
      {activeTab === 'rooms' && <RoomManager />}
    </div>
  );
}

export default App;