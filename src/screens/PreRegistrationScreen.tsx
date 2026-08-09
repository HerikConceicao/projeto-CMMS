import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CatalogTab } from '../components/preRegistration/CatalogTab';
import { ModelosTab } from '../components/preRegistration/ModelosTab';
import type { Fabricante } from '../types';

interface PreRegistrationScreenProps {
  onExit: () => void;
}

type Tab = 'setores' | 'tipos' | 'fabricantes' | 'modelos' | 'funcoes' | 'problemas';

const TABS: { id: Tab; label: string }[] = [
  { id: 'setores', label: 'Setores' },
  { id: 'tipos', label: 'Tipos de Equipamento' },
  { id: 'fabricantes', label: 'Fabricantes' },
  { id: 'modelos', label: 'Modelos' },
  { id: 'funcoes', label: 'Funções' },
  { id: 'problemas', label: 'Tipos de Problema' },
];

function nextId(items: { id: number }[]): number {
  return (items.length > 0 ? Math.max(...items.map((i) => i.id)) : 0) + 1;
}

export function PreRegistrationScreen({ onExit }: PreRegistrationScreenProps) {
  const {
    isDesktopMode,
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
  } = useAppContext();

  const [tab, setTab] = useState<Tab>('setores');

  const modelCountFor = (fabricante: Fabricante) =>
    modelos.filter((m) => m.manufacturerId === fabricante.id).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-5 p-4 sm:p-6 ${isDesktopMode ? 'max-w-4xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Voltar ao início"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold text-zinc-100">Pré-cadastro do Sistema</h1>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'setores' && (
          <CatalogTab
            items={setores}
            addPlaceholder="Nome do setor"
            emptyMessage="Nenhum setor cadastrado."
            countLabel={(count) => `${count} ativo${count === 1 ? '' : 's'} vinculado${count === 1 ? '' : 's'}`}
            blockDeleteMessage={(item) =>
              item.count > 0 ? `Não é possível excluir: há ${item.count} ativo(s) vinculado(s) a este setor.` : null
            }
            onAdd={(name) => setSetores((prev) => [...prev, { id: nextId(prev), name, count: 0 }])}
            onRename={(id, name) =>
              setSetores((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
            }
            onDelete={(id) => setSetores((prev) => prev.filter((s) => s.id !== id))}
          />
        )}

        {tab === 'tipos' && (
          <CatalogTab
            items={tipos}
            addPlaceholder="Nome do tipo de equipamento"
            emptyMessage="Nenhum tipo de equipamento cadastrado."
            countLabel={(count) => `${count} ativo${count === 1 ? '' : 's'} vinculado${count === 1 ? '' : 's'}`}
            blockDeleteMessage={(item) =>
              item.count > 0 ? `Não é possível excluir: há ${item.count} ativo(s) vinculado(s) a este tipo.` : null
            }
            onAdd={(name) => setTipos((prev) => [...prev, { id: nextId(prev), name, count: 0 }])}
            onRename={(id, name) =>
              setTipos((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
            }
            onDelete={(id) => setTipos((prev) => prev.filter((t) => t.id !== id))}
          />
        )}

        {tab === 'fabricantes' && (
          <CatalogTab
            items={fabricantes}
            addPlaceholder="Nome do fabricante"
            emptyMessage="Nenhum fabricante cadastrado."
            countLabel={(count) => `${count} ativo${count === 1 ? '' : 's'} vinculado${count === 1 ? '' : 's'}`}
            renderExtra={(item) => ` · ${modelCountFor(item)} modelo${modelCountFor(item) === 1 ? '' : 's'}`}
            blockDeleteMessage={(item) =>
              modelCountFor(item) > 0
                ? `Não é possível excluir: há ${modelCountFor(item)} modelo(s) vinculado(s). Remova-os na aba Modelos primeiro.`
                : null
            }
            onAdd={(name) =>
              setFabricantes((prev) => [...prev, { id: nextId(prev), name, modelCount: 0, count: 0 }])
            }
            onRename={(id, name) =>
              setFabricantes((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
            }
            onDelete={(id) => setFabricantes((prev) => prev.filter((f) => f.id !== id))}
          />
        )}

        {tab === 'modelos' && (
          <ModelosTab
            modelos={modelos}
            fabricantes={fabricantes}
            onAdd={(name, manufacturerId) =>
              setModelos((prev) => [...prev, { id: nextId(prev), name, manufacturerId }])
            }
            onRename={(id, name, manufacturerId) =>
              setModelos((prev) => prev.map((m) => (m.id === id ? { ...m, name, manufacturerId } : m)))
            }
            onDelete={(id) => setModelos((prev) => prev.filter((m) => m.id !== id))}
          />
        )}

        {tab === 'funcoes' && (
          <CatalogTab
            items={funcoes}
            addPlaceholder="Nome da função"
            emptyMessage="Nenhuma função cadastrada."
            countLabel={(count) => `${count} usuário${count === 1 ? '' : 's'} vinculado${count === 1 ? '' : 's'}`}
            blockDeleteMessage={(item) =>
              item.count > 0
                ? `Não é possível excluir: há ${item.count} usuário(s) vinculado(s) a esta função.`
                : null
            }
            onAdd={(name) => setFuncoes((prev) => [...prev, { id: nextId(prev), name, count: 0 }])}
            onRename={(id, name) =>
              setFuncoes((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
            }
            onDelete={(id) => setFuncoes((prev) => prev.filter((f) => f.id !== id))}
          />
        )}

        {tab === 'problemas' && (
          <CatalogTab
            items={problemas}
            addPlaceholder="Nome do tipo de problema"
            emptyMessage="Nenhum tipo de problema cadastrado."
            countLabel={(count) => `${count} ocorrência${count === 1 ? '' : 's'} registrada${count === 1 ? '' : 's'}`}
            onAdd={(name) => setProblemas((prev) => [...prev, { id: nextId(prev), name, count: 0 }])}
            onRename={(id, name) =>
              setProblemas((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
            }
            onDelete={(id) => setProblemas((prev) => prev.filter((p) => p.id !== id))}
          />
        )}
      </div>
    </div>
  );
}
