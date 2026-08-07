# Prompt de Reconstrução Completa do Projeto por IA (Especificação Técnica & Funcional)

> **Instruções para a IA geradora:**
> Utilize a especificação abaixo para construir do zero uma aplicação web completa de **Gestão de Ativos Industriais, Manutenção e Inteligência Estratégica (CMMS / EAM)**. A aplicação deve ser desenvolvida em **React 18 com TypeScript, Tailwind CSS, Recharts, Lucide React e qrcode.react**, utilizando arquitetura Single Page Application (SPA) com persistência em `localStorage`.

---

## 1. Visão Geral do Sistema
O sistema é uma plataforma de **Asset Intelligence & Maintenance Management** de nível industrial. Ela conecta o chão de fábrica (operadores e técnicos de manutenção) à gestão estratégica (gestores de manutenção e diretores industriais).

### Princípios de Design & UX
- **Estética Industrial Moderna:** Visual limpo, neutro e de alto contraste. Paleta baseada em tons de cinza/preto (#1a1a1a, #09090b), com destaques em laranja industrial (`#E67E22` / `orange-500`), verde para status positivo/concluído e vermelho para alertas críticos.
- **Modo Duplo Responsive:** Alternância dinâmica no topo entre visualização **Celular** (max-w-xl) e **Computador** (max-w-7xl ou full).
- **Sem "AI Slop":** Sem gradientes exagerados, sem botões de IA desnecessários ou sugestões automáticas intrusivas. Foco total em dados reais e acionáveis.
- **Salvamento Automático (LocalStorage):** Sincronização em tempo real de todos os dados no armazenamento do navegador.

---

## 2. Tech Stack e Dependências
- **Framework:** React 18+ (Vite)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v3/v4 (`@import "tailwindcss";`)
- **Gráficos:** `recharts` (BarChart, AreaChart, PieChart, LineChart, ComposedChart, ResponsiveContainer)
- **Ícones:** `lucide-react`
- **Geração de QR Code:** `qrcode.react` (`QRCodeSVG`)
- **Persistência:** `localStorage` nativo do navegador

---

## 3. Modelo de Dados e Tipagens (TypeScript)

### 3.1. Usuário (`User`)
```typescript
interface User {
  id: number;
  name: string;
  role: 'Gestor' | 'Técnico' | 'Liberador' | 'Operador';
  status: 'Ativo' | 'Inativo';
  phone: string;
  email?: string;
  osCreated?: number;
  osOpen?: number;
  permissions: {
    openOS: boolean;
    execOS: boolean;
    liberate: boolean;
    assets: boolean;
    manageUsers: boolean;
    reports: boolean;
    viewIntelligence?: boolean;
  };
}
```

### 3.2. Ativo (`Asset` - Provisório e Validado)
```typescript
interface Asset {
  id: number;
  name: string;
  sector: string;
  assetNumber: string; // Ex: PAT-0892 ou Tag de Inventário
  reportedBy?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  locationDetails?: string;
  criticality?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  healthScore?: number; // 0 - 100%
  photos?: string[];
  status: 'pending' | 'active' | 'maintenance' | 'decommissioned';
  date: string;
  osCount?: number;
  noTag?: boolean;
}
```

### 3.3. Ordem de Serviço (`OrderOfService`)
```typescript
interface OrderOfService {
  id: number; // Ex: 1023
  assetId: number;
  assetName: string;
  assetNumber: string;
  sector: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'Aberto' | 'Em Andamento' | 'Pendente Validação' | 'Concluído' | 'Cancelado';
  createdAt: string;
  createdBy: string;
  assignedTo?: number; // User ID do técnico
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  estimatedTime?: string;
  description: string;
  isMachineStopped: boolean;
  horimeterStart?: number;
  horimeterEnd?: number;
  executionReport?: string;
  executionPhotos?: string[];
  closedAt?: string;
  releasedBy?: string;
  laborCost?: number;
  partsCost?: number;
}
```

### 3.4. Configurações Financeiras (`FinancialSettings`)
```typescript
interface RoleCost {
  id: string;
  name: string;
  hourlyRate: number;
}

interface FinancialSettings {
  budgetMensal: number;
  roles: RoleCost[];
}
```

### 3.5. Pré-Cadastros (`PreRegistration`)
- **Setores:** `Array<{ id: number, name: string, count: number }>`
- **Tipos de Equipamento:** `Array<{ id: number, name: string, count: number }>`
- **Fabricantes:** `Array<{ id: number, name: string, modelCount: number, count: number }>`
- **Modelos:** `Array<{ id: number, name: string, manufacturerId: number }>`
- **Funções:** `Array<{ id: number, name: string, count: number }>`
- **Tipos de Problema:** `Array<{ id: number, name: string, count: number }>`

---

## 4. Estado Global e Persistência Automática

A aplicação deve inicializar seus estados verificando o `localStorage` com fallbacks para dados iniciais fictícios.

### Chaves do LocalStorage:
- `isDesktopMode`: boolean
- `setores`: JSON Array
- `tipos`: JSON Array
- `fabricantes`: JSON Array
- `modelos`: JSON Array
- `funcoes`: JSON Array
- `problemas`: JSON Array
- `provisionalAssets`: JSON Array
- `validatedAssets`: JSON Array
- `ordersOfService`: JSON Array
- `users`: JSON Array
- `financialSettings`: JSON Object

---

## 5. Módulos e Telas do Sistema (Especificação Detalhada)

### 5.1. Tela de Login e Autenticação OTP
- **Etapa 1 - Telefone:** Campo mascarado para telefone brasileiro `(XX) XXXXX-XXXX`. Validação de formato antes de prosseguir.
- **Etapa 2 - Código PIN/OTP:** 4 inputs individuais para código numérico. Foco automático no próximo input ao digitar.
- **Simulação de Perfis:** Login direto como Gestor/Liberador ou Técnico.

### 5.2. Dashboard Principal (Home Operacional)
- **Header:** Mensagem de boas-vindas customizada ("Olá, Herik!"), indicador de "Auto-save Ativo" no topo, e seletores de modo Celular/Computador.
- **Card de Notificação de OSs Pendentes:** Destaque para ordens pendentes de validação com ação rápida "Resolver agora".
- **Grid de Ações Rápidas:**
  1. Abrir ordem de serviço
  2. Gestão de Ordem de Serviço
  3. Lista de ordens de serviço
  4. Gerenciar usuários
  5. Pré-cadastro do sistema
  6. Gestão de ativos
  7. Reportar máquina (ativo)
  8. Liberação de Máquina
  9. Painel do Técnico
  10. Painel de Inteligência
  11. Auditoria

### 5.3. Reportar Ativo (Cadastro Provisório pelo Técnico)
- **Público:** Técnico ou Operador no chão de fábrica.
- **Fluxo:**
  - Captura/Upload de fotos da máquina e placa de identificação.
  - Nome do ativo, setor e número de inventário (se houver).
  - Checkbox para indicar máquina sem etiqueta ("Não possui placa de inventário").
  - Envio direto para a fila de validação do Gestor (`provisionalAssets`).

### 5.4. Gestão de Ativos e Wizard de Validação
- **Abas:** "Ativos Validados" e "Cadastros Pendentes (Provisórios)".
- **Wizard de Validação do Gestor (6 Passos):**
  - **Passo 1:** Classificação (Nome, Setor, Tipo de Equipamento).
  - **Passo 2:** Especificações Técnicas (Fabricante, Modelo, Número de Série).
  - **Passo 3:** Localização e Criticidade (Setor de destino, Grau de criticidade).
  - **Passo 4:** Saúde do Ativo (Health Score inicial de 0 a 100%).
  - **Passo 5:** Inventário e Tag (Confirmação ou geração de nova TAG/PAT).
  - **Passo 6:** Impressão de Etiqueta QR Code (Visualização da etiqueta gerada pronta para impressão em impressoras térmicas).

### 5.5. Abertura de Ordem de Serviço (3 Etapas)
1. **Identificação do Ativo:** Opção de escaneamento de QR Code pela câmera ou busca manual por TAG/Nome.
2. **Confirmação:** Exibição dos dados da máquina selecionada.
3. **Detalhamento do Problema:**
   - Seleção do tipo de manutenção (Corretiva / Preventiva).
   - Nível de prioridade (Baixa, Média, Alta, Urgente).
   - Lista de sintomas/problemas recorrentes cadastrados.
   - Pergunta se a máquina está parada ou produzindo com restrição.
   - Descrição em texto e fotos da falha.

### 5.6. Gestão de Ordens de Serviço (Visão do Supervisor)
- **Abas:** "Pendentes" e "Concluídas".
- **Filtros e Busca:** Por ID da OS, nome da máquina, setor ou TAG.
- **Atribuição de Técnico:** Modal para designar um técnico de manutenção cadastrado.
- **Modal de Conclusão / Baixa Manual:** Opção de finalizar a OS com registro de liberador e observações.

### 5.7. Painel do Técnico (Execução Mobile)
- **Visão de Trabalho:** Cards das OSs atribuídas ao técnico logado.
- **Etapa Pré-Manutenção:** Checklist obrigatorio de EPIs e procedimentos de segurança (Lockout/Tagout).
- **Tela de Execução:**
  - Cronômetro ao vivo com funções Iniciar, Pausar, Retomar.
  - Registro de Horímetro Inicial e Horímetro Final da máquina.
  - Laudo técnico final em texto e fotos da conclusão.
- **QR Finish Scan:** Confirmação presencial ao lado do equipamento escaneando o QR Code final.

### 5.8. Liberação de Máquina (Workflow de Segurança)
- Tela onde o supervisor/liberador inspeciona a máquina pós-manutenção.
- **Checklist de Liberação:** Limpeza do local, proteção de partes móveis, teste de funcionamento.
- **Aprovação ou Rejeição:** Se rejeitado, a OS volta para "Em Andamento" com o motivo da rejeição.

### 5.9. Painel de Dados e Inteligência (Dashboard Executivo)
- **Benchmarks e Metas de Saúde:**
  - **MTBF (Confiabilidade):** Média em horas entre falhas.
  - **Disponibilidade:** Percentual de tempo em produção vs. tempo parado.
  - **MTTR (Reparo):** Tempo médio em horas para conserto.
  - **Aderência Preventiva:** % do plano de preventivas cumprido.
- **Finanças da Manutenção:**
  - Gráfico ComposedChart / BarChart comparando Budget Mensal vs. Gasto Real (Mão de obra + Peças).
- **Ranking de Substituição de Ativos (CAPEX/OPEX):** Tabela ordenando as máquinas com maior custo acumulado de manutenção em relação ao seu valor residual, indicando a necessidade estratégica de substituição.
- **Distribuição de Saúde dos Ativos:** Gráfico de Rosca (PieChart) com ativos em estado Crítico, Alerta e Saudável.
- **Acesso ao Manual de Indicadores:** Botão de navegação direto para o manual educativo.

### 5.10. Painel de Auditoria Forense
- **Métricas de Resposta:** Tempo médio entre a abertura da OS e a chegada do técnico (Atendimento) vs. Tempo de Reparo.
- **Ranking de Performance Técnica:** Rendimento por funcionário, número de OSs resolvidas sem reincidência.
- **Qualidade de Preenchimento:** Avaliação do rigor dos relatórios técnicos e registros de horímetro.

### 5.11. Configurações Financeiras
- **Orçamento Mensal:** Definição do budget teto para a manutenção.
- **Custo de Mão de Obra por Função:**
  - Tabela dinâmica onde o gestor pode criar, editar ou remover funções (ex: *Técnico Senior, Técnico Junior, Líder, Eletricista*).
  - Definição da taxa horária (R$/hora) individual para cada função.
  - Dica de interface orientando a criação de variações de função para contemplar faixas salariais distintas.
- Sem sugestões de IA ou caixas promocionais.

### 5.12. Módulo de Pré-Cadastros
- Tela centralizadora para CRUD genérico das entidades auxiliares do sistema:
  - Setores
  - Tipos de Equipamento
  - Fabricantes (com vínculo para Modelos)
  - Modelos de Equipamento
  - Funções de Usuário
  - Tipos de Problema / Sintoma

### 5.13. Manual de Indicadores Estratégicos
Tela educativa e formal contendo os 6 parâmetros fundamentais:
1. **MTBF (Mean Time Between Failures):** Conceito, Fórmula (`Uptime / Paradas`) e Significado para a Gestão.
2. **Disponibilidade (Availability):** Conceito, Fórmula (`(Uptime / Tempo Total) * 100`) e Significado.
3. **MTTR (Mean Time To Repair):** Conceito, Fórmula (`Downtime / Intervenções`) e Significado.
4. **Aderência Preventiva:** Conceito, Fórmula (`(Realizadas / Planejadas) * 100`) e Significado.
5. **Uptime Total:** Conceito, Fórmula e Importância para a Capacidade Produtiva.
6. **Downtime Total:** Conceito, Fórmula e Custo de Oportunidade.

---

## 6. Instruções de Implementação para a IA
1. **Estrutura de Código:** Mantenha o código limpo, modular, fortemente tipado em TypeScript, e sem arquivos de estilo CSS externos além do Tailwind.
2. **Tratamento de Estado:** Certifique-se de que cada alteração nos estados de `ordersOfService`, `validatedAssets`, `users`, e `financialSettings` atualize o `localStorage`.
3. **Componentização:** Crie subcomponentes claros para modais, cartões de KPI, e wizards para evitar estouro de limite de contexto.
4. **Responsividade:** Utilize as classes utilitárias do Tailwind (`sm:`, `md:`, `lg:`, `xl:`) garantindo que telas no modo Celular permaneçam estritamente funcionais e confortáveis ao toque (min-height 44px para botões).
