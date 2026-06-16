import { clsx } from 'clsx';
import { CheckCircle2, Circle, GitMerge, FileText, ListChecks, Network, Users } from 'lucide-react';

const steps = [
  { id: 1, name: 'Macro Fluxo', icon: GitMerge, description: 'Levantamento geral' },
  { id: 2, name: 'Organograma', icon: Network, description: 'Estrutura hierárquica' },
  { id: 3, name: 'Funções', icon: Users, description: 'Descritivo de cargos' },
  { id: 4, name: 'Lista Mestre', icon: ListChecks, description: 'Processos principais' },
  { id: 5, name: 'Processos', icon: FileText, description: 'Mapeamento detalhado' },
];

export function Sidebar({ currentStep, setCurrentStep }: { currentStep: number; setCurrentStep: (step: number) => void }) {
  return (
    <aside className="w-72 border-r border-brand-dark/10 bg-white p-6 flex flex-col h-full shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark text-brand-gold shadow-md font-bold text-xl">
          R
        </div>
        <div>
          <h2 className="font-semibold text-brand-dark">Guirado AI</h2>
          <p className="text-xs text-neutral-500">Consultoria Empresarial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={clsx(
                'flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all duration-200',
                isActive ? 'bg-brand-dark text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'
              )}
            >
              <div className={clsx('flex h-8 w-8 items-center justify-center rounded-lg', isActive ? 'bg-white/10 text-brand-gold' : 'bg-neutral-100 text-neutral-400')}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <p className={clsx('text-sm font-medium', isActive ? 'text-white' : 'text-neutral-700')}>{step.name}</p>
                <p className={clsx('text-xs', isActive ? 'text-white/70' : 'text-neutral-500')}>{step.description}</p>
              </div>
              {isPast && <CheckCircle2 size={16} className="text-brand-gold" />}
              {!isPast && !isActive && <Circle size={16} className="text-neutral-300" />}
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-neutral-100">
        <p className="text-xs text-neutral-400 text-center">Powered by Google Gemini</p>
      </div>
    </aside>
  );
}
