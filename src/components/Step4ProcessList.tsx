import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectState } from '../App';
import { Loader2, Sparkles, ArrowRight, ListChecks, CheckSquare, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

export function Step4ProcessList({ state, updateState, onNext }: { state: ProjectState; updateState: (s: Partial<ProjectState>) => void; onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!state.macroFlowResult || !state.orgChartResult) return;
    setLoading(true);
    try {
      const result = await geminiService.generateProcessList(state.macroFlowResult, state.orgChartResult);
      updateState({ processListResult: result });
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar lista mestre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark">
            <ListChecks size={20} />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">4. Lista Mestre de Processos</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Com base no Macro Fluxo e no Organograma, a IA irá identificar os principais processos que precisam ser padronizados.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !state.macroFlowResult || !state.orgChartResult}
            className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all shadow-sm"
            title={(!state.macroFlowResult || !state.orgChartResult) ? "Para usar a IA, preencha o Macro Fluxo e o Organograma primeiro." : ""}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Lista Mestre com IA
          </button>
          
          {!state.processListResult && (
            <button
              onClick={() => {
                updateState({ processListResult: [{ department: 'Novo Departamento', processes: ['Novo Processo'] }] });
                setEditData([{ department: 'Novo Departamento', processes: ['Novo Processo'] }]);
                setIsEditing(true);
              }}
              className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-white border border-brand-dark/20 px-6 py-2.5 text-sm font-medium text-brand-dark hover:bg-neutral-50 shadow-sm transition-all"
            >
              <Edit2 size={16} />
              Criar Manualmente
            </button>
          )}
        </div>
        {(!state.macroFlowResult || !state.orgChartResult) && !state.processListResult && (
          <p className="text-xs text-neutral-500 mt-3">Dica: Você pode criar a lista manualmente ou preencher as Etapas 1 e 2 para que a IA sugira automaticamente.</p>
        )}
      </div>

      {state.processListResult && Array.isArray(state.processListResult) && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-2">
            <h3 className="text-lg font-medium text-neutral-900">Processos Identificados</h3>
            {!isEditing ? (
              <button onClick={() => { setEditData(JSON.parse(JSON.stringify(state.processListResult))); setIsEditing(true); }} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-gold">
                <Edit2 size={16} /> Editar Lista
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={() => { updateState({ processListResult: editData }); setIsEditing(false); }} className="flex items-center gap-1 text-sm text-brand-gold hover:text-brand-gold-hover font-medium">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-6">
              {editData.map((dept: any, dIndex: number) => (
                <div key={dIndex} className="rounded-xl border border-brand-dark/20 bg-brand-dark/5 p-5 shadow-sm relative">
                  <button onClick={() => {
                    const newData = [...editData];
                    newData.splice(dIndex, 1);
                    setEditData(newData);
                  }} className="absolute top-4 right-4 text-neutral-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-brand-dark mb-1">Departamento</label>
                    <input 
                      type="text" 
                      className="w-full max-w-md rounded-lg border border-brand-dark/20 px-3 py-1.5 text-sm focus:border-brand-gold outline-none"
                      value={dept.department}
                      onChange={(e) => {
                        const newData = [...editData];
                        newData[dIndex].department = e.target.value;
                        setEditData(newData);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-brand-dark">Processos</label>
                    {dept.processes.map((process: string, pIndex: number) => (
                      <div key={pIndex} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          className="flex-1 max-w-md rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-brand-gold outline-none"
                          value={process}
                          onChange={(e) => {
                            const newData = [...editData];
                            newData[dIndex].processes[pIndex] = e.target.value;
                            setEditData(newData);
                          }}
                        />
                        <button onClick={() => {
                          const newData = [...editData];
                          newData[dIndex].processes.splice(pIndex, 1);
                          setEditData(newData);
                        }} className="text-neutral-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newData = [...editData];
                      newData[dIndex].processes.push("Novo Processo");
                      setEditData(newData);
                    }} className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover font-medium mt-2">
                      <Plus size={14} /> Adicionar Processo
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newData = [...editData];
                newData.push({ department: "Novo Departamento", processes: ["Novo Processo"] });
                setEditData(newData);
              }} className="flex items-center gap-2 rounded-xl border border-dashed border-brand-dark/30 bg-brand-dark/5 px-4 py-3 text-sm font-medium text-brand-dark hover:bg-brand-dark/10 transition-all w-full justify-center">
                <Plus size={16} /> Adicionar Departamento
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {state.processListResult.map((dept: any, index: number) => (
                <div key={index} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-neutral-200 pb-3">
                    <h4 className="font-semibold text-neutral-800">{dept.department}</h4>
                  </div>
                  <ul className="space-y-2">
                    {dept.processes.map((process: string, pIndex: number) => (
                      <li key={pIndex} className="flex items-start gap-2 text-sm text-neutral-600 bg-white rounded-lg p-3 border border-neutral-100 shadow-sm">
                        <CheckSquare size={16} className="text-brand-gold mt-0.5 shrink-0" />
                        <span>{process}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-end border-t border-neutral-100 pt-4">
            <button
              onClick={() => {
                if (isEditing) {
                  updateState({ processListResult: editData });
                  setIsEditing(false);
                }
                onNext();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 transition-all shadow-sm"
            >
              Avançar para Mapeamento
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
