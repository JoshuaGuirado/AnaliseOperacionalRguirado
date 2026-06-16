import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { Step1MacroFlow } from './components/Step1MacroFlow';
import { Step2OrgChart } from './components/Step2OrgChart';
import { Step3Functions } from './components/Step3Functions';
import { Step4ProcessList } from './components/Step4ProcessList';
import { Step5Processes } from './components/Step5Processes';
import { Loader2, Plus, FolderOpen, Trash2, Home, Save, ChevronLeft } from 'lucide-react';

export type Attachment = {
  name: string;
  mimeType: string;
  data: string;
};

export type ProjectState = {
  macroFlowInput: string;
  macroFlowAttachments: Attachment[];
  macroFlowResult: string;
  orgChartResult: any;
  functionsInput: Record<string, string>;
  functionsAttachments: Record<string, Attachment[]>;
  functionsResult: Record<string, string>;
  processListResult: any;
  processesInput: Record<string, string>;
  processesAttachments: Record<string, Attachment[]>;
  processesResult: Record<string, string>;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: number;
  state: ProjectState;
};

const defaultProjectState: ProjectState = {
  macroFlowInput: '',
  macroFlowAttachments: [],
  macroFlowResult: '',
  orgChartResult: null,
  functionsInput: {},
  functionsAttachments: {},
  functionsResult: {},
  processListResult: null,
  processesInput: {},
  processesAttachments: {},
  processesResult: {},
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const stored = await localforage.getItem<Project[]>('guirado_projects');
      if (stored) setProjects(stored);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = async (newProjects: Project[]) => {
    setProjects(newProjects);
    await localforage.setItem('guirado_projects', newProjects);
  };

  const handleCreateProject = async () => {
    const name = prompt('Nome do novo projeto:') || 'Novo Projeto';
    if (!name.trim()) return;
    
    const newProj: Project = {
      id: crypto.randomUUID(),
      name,
      updatedAt: Date.now(),
      state: { ...defaultProjectState }
    };
    const updated = [newProj, ...projects];
    await saveProjects(updated);
    setCurrentProject(newProj);
    setCurrentStep(1);
  };

  const handleOpenProject = (proj: Project) => {
    setCurrentProject(proj);
    setCurrentStep(1);
  };

  const handleDeleteProject = async (id: string) => {
    if(!confirm('Tem certeza que deseja excluir este projeto?')) return;
    const updated = projects.filter(p => p.id !== id);
    await saveProjects(updated);
  };

  const handleSaveCurrentProject = async () => {
    if (!currentProject) return;
    setIsSaving(true);
    try {
      const updatedProj = { ...currentProject, updatedAt: Date.now() };
      const updatedProjects = projects.map(p => p.id === updatedProj.id ? updatedProj : p);
      await saveProjects(updatedProjects);
      setCurrentProject(updatedProj);
      alert('Projeto salvo com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o projeto.');
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const updateState = (updates: Partial<ProjectState>) => {
    if (!currentProject) return;
    const newState = { ...currentProject.state, ...updates };
    const updatedProj = { ...currentProject, state: newState, updatedAt: Date.now() };
    setCurrentProject(updatedProj);
    
    // Auto-save silently
    setProjects(prevProjects => {
      const updated = prevProjects.map(p => p.id === updatedProj.id ? updatedProj : p);
      localforage.setItem('guirado_projects', updated).catch(console.error);
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-neutral-50 px-8 py-12 font-sans text-neutral-900">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark text-brand-gold shadow-md font-bold text-2xl">
                  R
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-brand-dark">Guirado AI</h1>
              </div>
              <p className="text-neutral-500">Biblioteca de Projetos de Consultoria</p>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 rounded-xl bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-gold-hover shadow-sm transition-all"
            >
              <Plus size={20} />
              Novo Projeto
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {projects.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-500 flex flex-col items-center justify-center min-h-[300px]">
                <FolderOpen className="h-14 w-14 text-neutral-300 mb-4" />
                <p className="text-xl font-medium text-neutral-700">Nenhum projeto encontrado</p>
                <p className="text-sm mt-2 max-w-md text-neutral-500">Crie um novo projeto para começar uma análise operacional, ou adicionar processos autônomos.</p>
              </div>
            ) : (
              projects.map(proj => (
                <div key={proj.id} className="group relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all flex flex-col h-full items-start text-left">
                  <div className="flex justify-between w-full items-start mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/5 text-brand-dark">
                      <FolderOpen size={24} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                      className="text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors p-2"
                      title="Excluir projeto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex-1 w-full mb-6">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2 line-clamp-2 leading-tight">{proj.name}</h3>
                    <p className="text-xs font-medium text-neutral-500">
                      Última edição: {new Date(proj.updatedAt).toLocaleDateString()} às {new Date(proj.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleOpenProject(proj)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-dark text-brand-gold px-4 py-3 text-sm font-semibold hover:bg-brand-dark/90 transition-all shadow-sm"
                  >
                    Abrir Projeto
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1MacroFlow state={currentProject.state} updateState={updateState} onNext={() => setCurrentStep(2)} />;
      case 2:
        return <Step2OrgChart state={currentProject.state} updateState={updateState} onNext={() => setCurrentStep(3)} />;
      case 3:
        return <Step3Functions state={currentProject.state} updateState={updateState} onNext={() => setCurrentStep(4)} />;
      case 4:
        return <Step4ProcessList state={currentProject.state} updateState={updateState} onNext={() => setCurrentStep(5)} />;
      case 5:
        return <Step5Processes state={currentProject.state} updateState={updateState} onRestart={() => {
          setCurrentProject(null);
        }} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900">
      <Sidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button 
                  onClick={() => setCurrentProject(null)}
                  className="p-1 hover:bg-neutral-100 rounded-md text-neutral-500 transition-colors"
                  title="Voltar para Biblioteca"
                >
                  <ChevronLeft size={20} />
                </button>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{currentProject.name}</h1>
              </div>
              <p className="text-sm text-neutral-500 pl-8">Guirado Consultoria - Análise Operacional AI</p>
            </div>
            
            <div className="flex items-center gap-3 pl-8 md:pl-0">
              <button 
                onClick={handleSaveCurrentProject}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 shadow-sm transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Projeto
              </button>
            </div>
          </header>
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
