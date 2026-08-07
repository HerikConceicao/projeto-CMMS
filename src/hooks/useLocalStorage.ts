import { useCallback, useEffect, useState } from 'react';

export type SetStoredValue<T> = (value: T | ((prev: T) => T)) => void;

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;

  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.warn(`useLocalStorage: falha ao ler a chave "${key}"`, error);
    return initialValue;
  }
}

/**
 * Estado sincronizado automaticamente com o localStorage.
 * Mantém múltiplos componentes/abas em dia com a mesma chave.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetStoredValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue));

  const setValue = useCallback<SetStoredValue<T>>(
    (value) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`useLocalStorage: falha ao salvar a chave "${key}"`, error);
        }
        return valueToStore;
      });
    },
    [key],
  );

  // Mantém o estado em dia quando a mesma chave é alterada em outra aba/janela.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) return;
      setStoredValue(readValue(key, initialValue));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}
