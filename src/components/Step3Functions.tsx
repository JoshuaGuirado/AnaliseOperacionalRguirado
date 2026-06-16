import { useState, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectState, Attachment } from '../App';
import { Loader2, Sparkles, ArrowRight, Users, Briefcase, Edit2, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AudioRecorder, FileUploader, AttachmentList } from './shared';

export function Step3Functions({ state, updateState, onNext }: { state: ProjectState; updateState: (s: Partial<ProjectState>) => void; onNext: () => void }) {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const roles = useMemo(() => {
    if (!state.orgChartResult || !state.orgChartResult.departments) return [];
    const allRoles: string[] = [];
    state.orgChartResult.departments.forEach((dept: any) => {
      dept.roles.forEach((role: string) => {
        if (!allRoles.includes(role)) allRoles.push(role);
      });
    });
    return allRoles;
  }, [state.orgChartResult]);

  const handleGenerate = async (role: string) => {
    const input = state.functionsInput[role] || '';
    const atts = state.functionsAttachments[role] || [];
    if (!input.trim() && atts.length === 0) return;
    
    setLoadingRole(role);
    try {
      const result = await geminiService.generateJobDescription(role, input, atts);
      updateState({
        functionsResult: { ...state.functionsResult, [role]: result }
      });
    } catch (error) {
      console.error(error);
      alert(`Erro ao gerar descritivo para ${role}.`);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleInputChange = (role: string, value: string) => {
    updateState({
      functionsInput: { ...state.functionsInput, [role]: value }
    });
  };

  const addAttachments = (role: string, newAtts: Attachment[]) => {
    const current = state.functionsAttachments[role] || [];
    updateState({
      functionsAttachments: { ...state.functionsAttachments, [role]: [...current, ...newAtts] }
    });
  };

  const removeAttachment = (role: string, index: number) => {
    const current = [...(state.functionsAttachments[role] || [])];
    current.splice(index, 1);
    updateState({
      functionsAttachments: { ...state.functionsAttachments, [role]: current }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark">
            <Users size={20} />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">3. Funções e Descritivos</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Para cada cargo identificado, grave um áudio, anexe documentos ou descreva as atividades executadas para gerar um Descritivo de Função formal.
        </p>

        {/* STANDALONE ROLE ADDER */}
        <div className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-800">Adicionar Função Avulsa</h4>
            <p className="text-xs text-neutral-500">Adicione um cargo diretamente para descrevê-lo, ignorando as outras etapas.</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('newRole') as HTMLInputElement;
            if (input.value.trim()) {
              const currentDepts = state.orgChartResult?.departments || [];
              let targetDept = currentDepts.find((d: any) => d.name === 'Cargos Extras');
              let newDepts = [...currentDepts];
              
              if (!targetDept) {
                targetDept = { name: 'Cargos Extras', roles: [input.value.trim()] };
                newDepts.push(targetDept);
              } else {
                targetDept.roles.push(input.value.trim());
              }
              
              updateState({ 
                orgChartResult: { departments: newDepts } 
              });
              input.value = '';
            }
          }} className="flex w-full sm:w-auto items-center gap-2">
            <input name="newRole" placeholder="Nome do Cargo..." className="flex-1 w-full sm:w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-dark outline-none" />
            <button type="submit" className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-all focus:ring-2 focus:ring-brand-gold">
              Adicionar
            </button>
          </form>
        </div>

        {roles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-500 text-sm">
            Nenhum cargo listado ainda. Use o campo acima para adicionar ou gere o Organograma na Etapa 2.
          </div>
        ) : (
          <div className="space-y-8">
            {roles.map((role) => {
              const atts = state.functionsAttachments[role] || [];
              const input = state.functionsInput[role] || '';
              const canGenerate = input.trim() || atts.length > 0;

              return (
                <div key={role} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase size={18} className="text-brand-dark" />
                    <h3 className="font-semibold text-neutral-800 text-lg">{role}</h3>
                  </div>
                  
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700">Coleta de Informações:</label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <AudioRecorder onRecordingComplete={(audio) => addAttachments(role, [audio])} />
                        <FileUploader onFilesAdded={(files) => addAttachments(role, files)} />
                      </div>
                      
                      <AttachmentList attachments={atts} onRemove={(idx) => removeAttachment(role, idx)} />

                      <textarea
                        className="w-full h-24 rounded-xl border border-neutral-300 p-3 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-none bg-white"
                        placeholder={`Anotações adicionais sobre o que o ${role} faz...`}
                        value={input}
                        onChange={(e) => handleInputChange(role, e.target.value)}
                      />
                      <button
                        onClick={() => handleGenerate(role)}
                        disabled={loadingRole === role || !canGenerate}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {loadingRole === role ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        Gerar Descritivo Formal
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-neutral-700">Descritivo Gerado:</label>
                        {state.functionsResult[role] && (
                          editingRole !== role ? (
                            <button onClick={() => { setEditValue(state.functionsResult[role]); setEditingRole(role); }} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-gold">
                              <Edit2 size={14} /> Editar
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingRole(null)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600">
                                <X size={14} /> Cancelar
                              </button>
                              <button onClick={() => { updateState({ functionsResult: { ...state.functionsResult, [role]: editValue } }); setEditingRole(null); }} className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover font-medium">
                                <Save size={14} /> Salvar
                              </button>
                            </div>
                          )
                        )}
                      </div>
                      
                      {editingRole === role ? (
                        <textarea
                          className="h-full min-h-[250px] w-full rounded-xl border border-brand-gold bg-brand-gold/10 p-4 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-y font-mono"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                      ) : (
                        <div className="h-full min-h-[250px] w-full rounded-xl border border-neutral-200 bg-white p-4 text-sm overflow-y-auto shadow-inner">
                          {state.functionsResult[role] ? (
                            <div className="prose prose-sm max-w-none text-neutral-700">
                              <ReactMarkdown>{state.functionsResult[role]}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-neutral-400 italic text-center mt-12">Aguardando geração...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {roles.length > 0 && (
          <div className="mt-8 flex justify-end border-t border-neutral-100 pt-6">
            <button
              onClick={() => {
                if (editingRole) {
                  updateState({ functionsResult: { ...state.functionsResult, [editingRole]: editValue } });
                  setEditingRole(null);
                }
                onNext();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 transition-all shadow-sm"
            >
              Avançar para Lista Mestre
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
