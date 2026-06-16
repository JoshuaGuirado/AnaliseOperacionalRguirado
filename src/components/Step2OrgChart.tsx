import { useState, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectState } from '../App';
import { Loader2, Sparkles, ArrowRight, Network, Users, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { Mermaid } from './shared';

export function Step2OrgChart({ state, updateState, onNext }: { state: ProjectState; updateState: (s: Partial<ProjectState>) => void; onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!state.macroFlowResult) return;
    setLoading(true);
    try {
      const result = await geminiService.generateOrgChart(state.macroFlowResult);
      updateState({ orgChartResult: result });
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar organograma.');
    } finally {
      setLoading(false);
    }
  };

  const mermaidChart = useMemo(() => {
    if (!state.orgChartResult || !state.orgChartResult.departments) return '';
    
    let chart = 'graph TD\n';
    chart += '  Company[Empresa]\n';
    
    state.orgChartResult.departments.forEach((dept: any, dIndex: number) => {
      const deptId = `Dept${dIndex}`;
      chart += `  Company --> ${deptId}["${dept.name}"]\n`;
      
      dept.roles.forEach((role: string, rIndex: number) => {
        const roleId = `Role${dIndex}_${rIndex}`;
        chart += `  ${deptId} --> ${roleId}["${role}"]\n`;
      });
    });
    
    return chart;
  }, [state.orgChartResult]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark">
            <Network size={20} />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">2. Organograma</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Com base no Macro Fluxo gerado na etapa anterior, a IA irá sugerir a estrutura hierárquica e os departamentos da empresa.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !state.macroFlowResult}
            className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all shadow-sm"
            title={!state.macroFlowResult ? "Para usar a IA, preencha o Macro Fluxo na Etapa 1 primeiro." : ""}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Sugerir Organograma com IA
          </button>
          
          {!state.orgChartResult && (
            <button
              onClick={() => {
                updateState({ orgChartResult: { departments: [{ name: 'Novo Departamento', roles: ['Novo Cargo'] }] } });
                setEditData({ departments: [{ name: 'Novo Departamento', roles: ['Novo Cargo'] }] });
                setIsEditing(true);
              }}
              className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-white border border-brand-dark/20 px-6 py-2.5 text-sm font-medium text-brand-dark hover:bg-neutral-50 shadow-sm transition-all"
            >
              <Edit2 size={16} />
              Criar Manualmente
            </button>
          )}
        </div>
        {!state.macroFlowResult && !state.orgChartResult && (
          <p className="text-xs text-neutral-500 mt-3">Dica: Você pode criar a estrutura manualmente ou preencher a Etapa 1 para que a IA sugira automaticamente.</p>
        )}
      </div>

      {state.orgChartResult && state.orgChartResult.departments && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-2">
            <h3 className="text-lg font-medium text-neutral-900">Estrutura Sugerida</h3>
            {!isEditing ? (
              <button onClick={() => { setEditData(JSON.parse(JSON.stringify(state.orgChartResult))); setIsEditing(true); }} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-gold">
                <Edit2 size={16} /> Editar Estrutura
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={() => { updateState({ orgChartResult: editData }); setIsEditing(false); }} className="flex items-center gap-1 text-sm text-brand-gold hover:text-brand-gold-hover font-medium">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-6">
              {editData.departments.map((dept: any, dIndex: number) => (
                <div key={dIndex} className="rounded-xl border border-brand-dark/20 bg-brand-dark/5 p-5 shadow-sm relative">
                  <button onClick={() => {
                    const newData = { ...editData };
                    newData.departments.splice(dIndex, 1);
                    setEditData(newData);
                  }} className="absolute top-4 right-4 text-neutral-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-brand-dark mb-1">Nome do Departamento</label>
                    <input 
                      type="text" 
                      className="w-full max-w-md rounded-lg border border-brand-dark/20 px-3 py-1.5 text-sm focus:border-brand-gold outline-none"
                      value={dept.name}
                      onChange={(e) => {
                        const newData = { ...editData };
                        newData.departments[dIndex].name = e.target.value;
                        setEditData(newData);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-brand-dark">Cargos / Funções</label>
                    {dept.roles.map((role: string, rIndex: number) => (
                      <div key={rIndex} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          className="flex-1 max-w-md rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-brand-gold outline-none"
                          value={role}
                          onChange={(e) => {
                            const newData = { ...editData };
                            newData.departments[dIndex].roles[rIndex] = e.target.value;
                            setEditData(newData);
                          }}
                        />
                        <button onClick={() => {
                          const newData = { ...editData };
                          newData.departments[dIndex].roles.splice(rIndex, 1);
                          setEditData(newData);
                        }} className="text-neutral-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newData = { ...editData };
                      newData.departments[dIndex].roles.push("Novo Cargo");
                      setEditData(newData);
                    }} className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover font-medium mt-2">
                      <Plus size={14} /> Adicionar Cargo
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newData = { ...editData };
                newData.departments.push({ name: "Novo Departamento", roles: ["Novo Cargo"] });
                setEditData(newData);
              }} className="flex items-center gap-2 rounded-xl border border-dashed border-brand-dark/30 bg-brand-dark/5 px-4 py-3 text-sm font-medium text-brand-dark hover:bg-brand-dark/10 transition-all w-full justify-center">
                <Plus size={16} /> Adicionar Departamento
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm overflow-hidden">
                <h4 className="text-sm font-medium text-neutral-500 mb-4 text-center">Visualização do Organograma</h4>
                <Mermaid chart={mermaidChart} />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {state.orgChartResult.departments.map((dept: any, index: number) => (
                  <div key={index} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-neutral-200 pb-3">
                      <Users size={18} className="text-brand-dark" />
                      <h4 className="font-semibold text-neutral-800">{dept.name}</h4>
                    </div>
                    <ul className="space-y-2">
                      {dept.roles.map((role: string, rIndex: number) => (
                        <li key={rIndex} className="flex items-center gap-2 text-sm text-neutral-600 bg-white rounded-lg p-2 border border-neutral-100 shadow-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                          {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end border-t border-neutral-100 pt-4">
            <button
              onClick={() => {
                if (isEditing) {
                  updateState({ orgChartResult: editData });
                  setIsEditing(false);
                }
                onNext();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 transition-all shadow-sm"
            >
              Avançar para Funções
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
