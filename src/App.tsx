import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import { LoginScreen } from './screens/LoginScreen';
import { Dashboard } from './screens/Dashboard';
import { OpenOSScreen } from './screens/OpenOSScreen';
import { OSListScreen } from './screens/OSListScreen';
import { ManageOSScreen } from './screens/ManageOSScreen';
import { TechnicianPanelScreen } from './screens/TechnicianPanelScreen';
import { PreRegistrationScreen } from './screens/PreRegistrationScreen';
import { AssetManagementScreen } from './screens/AssetManagementScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { QUICK_ACTIONS } from './data/navigation';
import type { ScreenId } from './types';

function App() {
  const { currentUser } = useAppContext();
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (screen === 'dashboard') {
    return <Dashboard onNavigate={setScreen} />;
  }

  if (screen === 'open-os') {
    return <OpenOSScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'os-list') {
    return <OSListScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'manage-os') {
    return <ManageOSScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'technician-panel') {
    return <TechnicianPanelScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'pre-registration') {
    return <PreRegistrationScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'asset-management') {
    return <AssetManagementScreen onExit={() => setScreen('dashboard')} />;
  }

  const title = QUICK_ACTIONS.find((action) => action.id === screen)?.label ?? '';
  return <PlaceholderScreen title={title} onBack={() => setScreen('dashboard')} />;
}

export default App
