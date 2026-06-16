import { useState, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectState, Attachment } from '../App';
import { Loader2, Sparkles, FileText, CheckCircle2, Edit2, Save, X, Download, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AudioRecorder, FileUploader, AttachmentList, Mermaid } from './shared';

export function Step5Processes({ state, updateState, onRestart }: { state: ProjectState; updateState: (s: Partial<ProjectState>) => void; onRestart: () => void }) {
  const [loadingProcess, setLoadingProcess] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const processes = useMemo(() => {
    if (!state.processListResult || !Array.isArray(state.processListResult)) return [];
    const allProcesses: string[] = [];
    state.processListResult.forEach((dept: any) => {
      dept.processes.forEach((process: string) => {
        if (!allProcesses.includes(process)) allProcesses.push(process);
      });
    });
    return allProcesses;
  }, [state.processListResult]);

  const handleGenerate = async (processName: string) => {
    const input = state.processesInput[processName] || '';
    const atts = state.processesAttachments[processName] || [];
    if (!input.trim() && atts.length === 0) return;
    
    setLoadingProcess(processName);
    try {
      const result = await geminiService.generateProcessDetails(processName, input, atts);
      updateState({
        processesResult: { ...state.processesResult, [processName]: result }
      });
    } catch (error) {
      console.error(error);
      alert(`Erro ao mapear o processo ${processName}.`);
    } finally {
      setLoadingProcess(null);
    }
  };

  const handleInputChange = (processName: string, value: string) => {
    updateState({
      processesInput: { ...state.processesInput, [processName]: value }
    });
  };

  const addAttachments = (processName: string, newAtts: Attachment[]) => {
    const current = state.processesAttachments[processName] || [];
    updateState({
      processesAttachments: { ...state.processesAttachments, [processName]: [...current, ...newAtts] }
    });
  };

  const removeAttachment = (processName: string, index: number) => {
    const current = [...(state.processesAttachments[processName] || [])];
    current.splice(index, 1);
    updateState({
      processesAttachments: { ...state.processesAttachments, [processName]: current }
    });
  };

  const exportToWord = (processName: string) => {
    const element = document.getElementById(`sop-content-${processName}`);
    if (!element) return;
    
    const htmlContent = element.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `SOP_${processName.replace(/\s+/g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark">
            <FileText size={20} />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">5. Mapeamento de Processos (SOP)</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Para cada processo, grave o áudio do cliente, anexe documentos ou digite o passo a passo. A IA irá gerar o Procedimento Operacional Padrão (SOP).
        </p>

        {/* STANDALONE PROCESS ADDER */}
        <div className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-800">Mapear Processo Avulso</h4>
            <p className="text-xs text-neutral-500">Adicione um processo diretamente, ignorando as outras etapas.</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('newProcess') as HTMLInputElement;
            if (input.value.trim()) {
              const current = Array.isArray(state.processListResult) ? state.processListResult : [];
              let targetDept = current.find((d: any) => d.department === 'Processos Extras');
              let newList = [...current];
              
              if (!targetDept) {
                targetDept = { department: 'Processos Extras', processes: [input.value.trim()] };
                newList.push(targetDept);
              } else {
                targetDept.processes.push(input.value.trim());
              }
              
              updateState({ 
                processListResult: newList 
              });
              input.value = '';
            }
          }} className="flex w-full sm:w-auto items-center gap-2">
            <input name="newProcess" placeholder="Nome do Processo..." className="flex-1 w-full sm:w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-dark outline-none" />
            <button type="submit" className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-all focus:ring-2 focus:ring-brand-gold">
              Adicionar
            </button>
          </form>
        </div>

        {processes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-500 text-sm">
            Nenhum processo listado ainda. Use o campo acima para adicionar de forma autônoma ou gere uma Lista Mestre na Etapa 4.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {processes.map((processName) => {
              const atts = state.processesAttachments[processName] || [];
              const input = state.processesInput[processName] || '';
              const canGenerate = input.trim() || atts.length > 0;

              return (
                <div key={processName} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-gold"></div>
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 size={20} className="text-brand-dark" />
                    <h3 className="font-bold text-neutral-800 text-xl">{processName}</h3>
                  </div>
                  
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700">Coleta de Informações:</label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <AudioRecorder onRecordingComplete={(audio) => addAttachments(processName, [audio])} />
                        <FileUploader onFilesAdded={(files) => addAttachments(processName, files)} />
                      </div>
                      
                      <AttachmentList attachments={atts} onRemove={(idx) => removeAttachment(processName, idx)} />

                      <textarea
                        className="w-full h-24 rounded-xl border border-neutral-300 p-3 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-none bg-white"
                        placeholder={`Anotações sobre como o processo "${processName}" é executado...`}
                        value={input}
                        onChange={(e) => handleInputChange(processName, e.target.value)}
                      />
                      <button
                        onClick={() => handleGenerate(processName)}
                        disabled={loadingProcess === processName || !canGenerate}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {loadingProcess === processName ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        Gerar SOP Padronizado
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-neutral-700">Procedimento Gerado (SOP):</label>
                        {state.processesResult[processName] && (
                          editingProcess !== processName ? (
                            <div className="flex items-center gap-3">
                              <button onClick={() => exportToWord(processName)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-dark">
                                <Download size={14} /> Baixar Word
                              </button>
                              <button onClick={() => { setEditValue(state.processesResult[processName]); setEditingProcess(processName); }} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-gold">
                                <Edit2 size={14} /> Editar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingProcess(null)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600">
                                <X size={14} /> Cancelar
                              </button>
                              <button onClick={() => { updateState({ processesResult: { ...state.processesResult, [processName]: editValue } }); setEditingProcess(null); }} className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover font-medium">
                                <Save size={14} /> Salvar
                              </button>
                            </div>
                          )
                        )}
                      </div>
                      
                      {editingProcess === processName ? (
                        <textarea
                          className="h-full min-h-[250px] w-full rounded-xl border border-brand-gold bg-brand-gold/10 p-4 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-y font-mono"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                      ) : (
                        <div className="h-full min-h-[250px] w-full rounded-xl border border-neutral-200 bg-white p-4 text-sm overflow-y-auto shadow-inner">
                          {state.processesResult[processName] ? (
                            <div id={`sop-content-${processName}`} className="prose prose-sm max-w-none text-neutral-700">
                              <ReactMarkdown
                                components={{
                                  code(props) {
                                    const { children, className, node, ...rest } = props;
                                    const match = /language-(\w+)/.exec(className || '');
                                    if (match && match[1] === 'mermaid') {
                                      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                    }
                                    return <code {...rest} className={className}>{children}</code>;
                                  }
                                }}
                              >
                                {state.processesResult[processName]}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-neutral-400 italic text-center mt-16">Aguardando geração...</p>
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
        
        {processes.length > 0 && (
          <div className="mt-12 flex justify-center border-t border-neutral-100 pt-8">
            <button
              onClick={() => {
                if (editingProcess) {
                  updateState({ processesResult: { ...state.processesResult, [editingProcess]: editValue } });
                  setEditingProcess(null);
                }
                onRestart();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-dark px-8 py-3 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 transition-all shadow-md"
            >
              <RotateCcw size={18} />
              Voltar para Projetos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
