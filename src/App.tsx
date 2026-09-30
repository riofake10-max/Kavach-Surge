import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { RightPanel } from './components/RightPanel/RightPanel';
import { TimeScrubber } from './components/TimeScrubber';
import { Footer } from './components/Footer';
import { AssetDetailDrawer } from './components/Modals/AssetDetailDrawer';
import { ModelAssumptionsDrawer } from './components/Modals/ModelAssumptionsDrawer';
import { MultimodalModal } from './components/Modals/MultimodalModal';
import { DataSourcesModal } from './components/Modals/DataSourcesModal';
import { DemoNarrator } from './components/DemoNarrator';

export default function App() {
  const { setScenario } = useAppStore();

  // Initialize with Odisha (Fani preset) on first load
  useEffect(() => {
    setScenario('fani');
  }, [setScenario]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* Top Bar Header */}
      <Header />

      {/* Main Workspace (Sidebar + Map Hero + Tabbed Panel) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <Sidebar />
        <MapView />
        <RightPanel />
      </div>

      {/* T-Minus Timeline Scrubber */}
      <TimeScrubber />

      {/* Persistent Disclaimer Footer */}
      <Footer />

      {/* Modals & Slide-out Drawers */}
      <AssetDetailDrawer />
      <ModelAssumptionsDrawer />
      <MultimodalModal />
      <DataSourcesModal />
      <DemoNarrator />
    </div>
  );
}
