import { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage, type SetStoredValue } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/storageKeys';
import {
  seedFabricantes,
  seedFinancialSettings,
  seedFuncoes,
  seedModelos,
  seedOrdersOfService,
  seedProblemas,
  seedProvisionalAssets,
  seedSetores,
  seedTipos,
  seedUsers,
  seedValidatedAssets,
} from '../data/seed';
import type {
  Asset,
  Fabricante,
  FinancialSettings,
  Funcao,
  Modelo,
  OrderOfService,
  Setor,
  TipoEquipamento,
  TipoProblema,
  User,
} from '../types';

interface AppContextValue {
  isDesktopMode: boolean;
  setIsDesktopMode: SetStoredValue<boolean>;

  setores: Setor[];
  setSetores: SetStoredValue<Setor[]>;

  tipos: TipoEquipamento[];
  setTipos: SetStoredValue<TipoEquipamento[]>;

  fabricantes: Fabricante[];
  setFabricantes: SetStoredValue<Fabricante[]>;

  modelos: Modelo[];
  setModelos: SetStoredValue<Modelo[]>;

  funcoes: Funcao[];
  setFuncoes: SetStoredValue<Funcao[]>;

  problemas: TipoProblema[];
  setProblemas: SetStoredValue<TipoProblema[]>;

  provisionalAssets: Asset[];
  setProvisionalAssets: SetStoredValue<Asset[]>;

  validatedAssets: Asset[];
  setValidatedAssets: SetStoredValue<Asset[]>;

  ordersOfService: OrderOfService[];
  setOrdersOfService: SetStoredValue<OrderOfService[]>;

  users: User[];
  setUsers: SetStoredValue<User[]>;

  financialSettings: FinancialSettings;
  setFinancialSettings: SetStoredValue<FinancialSettings>;

  currentUser: User | null;
  login: (userId: number) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isDesktopMode, setIsDesktopMode] = useLocalStorage(STORAGE_KEYS.isDesktopMode, false);

  const [setores, setSetores] = useLocalStorage<Setor[]>(STORAGE_KEYS.setores, seedSetores);
  const [tipos, setTipos] = useLocalStorage<TipoEquipamento[]>(STORAGE_KEYS.tipos, seedTipos);
  const [fabricantes, setFabricantes] = useLocalStorage<Fabricante[]>(
    STORAGE_KEYS.fabricantes,
    seedFabricantes,
  );
  const [modelos, setModelos] = useLocalStorage<Modelo[]>(STORAGE_KEYS.modelos, seedModelos);
  const [funcoes, setFuncoes] = useLocalStorage<Funcao[]>(STORAGE_KEYS.funcoes, seedFuncoes);
  const [problemas, setProblemas] = useLocalStorage<TipoProblema[]>(
    STORAGE_KEYS.problemas,
    seedProblemas,
  );

  const [provisionalAssets, setProvisionalAssets] = useLocalStorage<Asset[]>(
    STORAGE_KEYS.provisionalAssets,
    seedProvisionalAssets,
  );
  const [validatedAssets, setValidatedAssets] = useLocalStorage<Asset[]>(
    STORAGE_KEYS.validatedAssets,
    seedValidatedAssets,
  );

  const [ordersOfService, setOrdersOfService] = useLocalStorage<OrderOfService[]>(
    STORAGE_KEYS.ordersOfService,
    seedOrdersOfService,
  );

  const [users, setUsers] = useLocalStorage<User[]>(STORAGE_KEYS.users, seedUsers);

  const [financialSettings, setFinancialSettings] = useLocalStorage<FinancialSettings>(
    STORAGE_KEYS.financialSettings,
    seedFinancialSettings,
  );

  const [currentUserId, setCurrentUserId] = useLocalStorage<number | null>(
    STORAGE_KEYS.currentUserId,
    null,
  );
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const login = (userId: number) => setCurrentUserId(userId);
  const logout = () => setCurrentUserId(null);

  const value: AppContextValue = {
    isDesktopMode,
    setIsDesktopMode,
    setores,
    setSetores,
    tipos,
    setTipos,
    fabricantes,
    setFabricantes,
    modelos,
    setModelos,
    funcoes,
    setFuncoes,
    problemas,
    setProblemas,
    provisionalAssets,
    setProvisionalAssets,
    validatedAssets,
    setValidatedAssets,
    ordersOfService,
    setOrdersOfService,
    users,
    setUsers,
    financialSettings,
    setFinancialSettings,
    currentUser,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de um <AppProvider>');
  }
  return context;
}
