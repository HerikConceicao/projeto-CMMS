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
import { ReportAssetScreen } from './screens/ReportAssetScreen';
import { MachineReleaseScreen } from './screens/MachineReleaseScreen';
import { IntelligencePanelScreen } from './screens/IntelligencePanelScreen';
import { AuditScreen } from './screens/AuditScreen';
import { ManageUsersScreen } from './screens/ManageUsersScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { QUICK_ACTIONS } from './data/navigation';
import { clearAssetTagFromLocation, readAssetTagFromLocation } from './utils/qr';
import type { ScreenId } from './types';

function App() {
  const { currentUser, authLoading } = useAppContext();
  // Link do QR Code (?ativo=TAG): depois do login, abre direto a abertura de OS desse ativo.
  const [pendingAssetTag, setPendingAssetTag] = useState<string | null>(readAssetTagFromLocation);
  const [screen, setScreen] = useState<ScreenId>(pendingAssetTag ? 'open-os' : 'dashboard');

  const consumeAssetTag = () => {
    clearAssetTagFromLocation();
    setPendingAssetTag(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (screen === 'dashboard') {
    return <Dashboard onNavigate={setScreen} />;
  }

  if (screen === 'open-os') {
    return (
      <OpenOSScreen
        initialAssetTag={pendingAssetTag}
        onInitialAssetTagHandled={consumeAssetTag}
        onExit={() => {
          consumeAssetTag();
          setScreen('dashboard');
        }}
      />
    );
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

  if (screen === 'report-asset') {
    return <ReportAssetScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'machine-release') {
    return <MachineReleaseScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'intelligence-panel') {
    return <IntelligencePanelScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'audit') {
    return <AuditScreen onExit={() => setScreen('dashboard')} />;
  }

  if (screen === 'manage-users') {
    return <ManageUsersScreen onExit={() => setScreen('dashboard')} />;
  }

  const title = QUICK_ACTIONS.find((action) => action.id === screen)?.label ?? '';
  return <PlaceholderScreen title={title} onBack={() => setScreen('dashboard')} />;
}

export default App
