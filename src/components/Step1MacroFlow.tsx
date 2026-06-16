import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectState, Attachment } from '../App';
import { Loader2, Sparkles, ArrowRight, Lightbulb, Edit2, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AudioRecorder, FileUploader, AttachmentList } from './shared';

export function Step1MacroFlow({ state, updateState, onNext }: { state: ProjectState; updateState: (s: Partial<ProjectState>) => void; onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState('');
  const [scriptResult, setScriptResult] = useState('');
  const [loadingScript, setLoadingScript] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleGenerate = async () => {
    if (!state.macroFlowInput.trim() && state.macroFlowAttachments.length === 0) return;
    setLoading(true);
    try {
      const result = await geminiService.generateMacroFlow(state.macroFlowInput, state.macroFlowAttachments);
      updateState({ macroFlowResult: result });
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar macro fluxo. Verifique se os arquivos não são muito grandes.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!industry.trim()) return;
    setLoadingScript(true);
    try {
      const result = await geminiService.generateInterviewScript(industry);
      setScriptResult(result);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar roteiro.");
    } finally {
      setLoadingScript(false);
    }
  };

  const addAttachments = (newAtts: Attachment[]) => {
    updateState({ macroFlowAttachments: [...state.macroFlowAttachments, ...newAtts] });
  };

  const removeAttachment = (index: number) => {
    const newAtts = [...state.macroFlowAttachments];
    newAtts.splice(index, 1);
    updateState({ macroFlowAttachments: newAtts });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Help / Script Generator Section */}
      <div className="rounded-2xl bg-brand-dark/5 p-6 shadow-sm border border-brand-dark/10">
        <div className="flex items-center gap-2 mb-3 text-brand-dark">
          <Lightbulb size={20} />
          <h3 className="text-lg font-medium">Ajuda & Roteiro de Coleta</h3>
        </div>
        <p className="text-sm text-brand-dark/80 mb-4">
          Precisa de ajuda para pedir as informações ao cliente? Digite o segmento da empresa e a IA criará um roteiro de perguntas e dicas de como ele deve gravar o áudio.
        </p>
        <div className="flex gap-3 mb-4">
          <input 
            type="text" 
            placeholder="Ex: Loja de Roupas, Clínica Odontológica, Restaurante..." 
            className="flex-1 rounded-xl border border-brand-dark/20 px-4 py-2 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
          <button 
            onClick={handleGenerateScript}
            disabled={loadingScript || !industry.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all"
          >
            {loadingScript ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Gerar Ideias
          </button>
        </div>
        
        {scriptResult && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-brand-dark/10 max-h-64 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown>{scriptResult}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">1. Macro Fluxo Empresarial</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Cole anotações, grave um áudio do cliente ou faça upload de documentos (PDF, imagens, manuais) sobre como a empresa funciona.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <AudioRecorder onRecordingComplete={(audio) => addAttachments([audio])} />
          <FileUploader onFilesAdded={addAttachments} />
        </div>

        <AttachmentList attachments={state.macroFlowAttachments} onRemove={removeAttachment} />
        
        <textarea
          className="w-full h-32 mt-4 rounded-xl border border-neutral-300 p-4 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-none"
          placeholder="Ou digite/cole as anotações aqui..."
          value={state.macroFlowInput}
          onChange={(e) => updateState({ macroFlowInput: e.target.value })}
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || (!state.macroFlowInput.trim() && state.macroFlowAttachments.length === 0)}
            className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Macro Fluxo com IA
          </button>
        </div>
      </div>

      {state.macroFlowResult && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
            <h3 className="text-lg font-medium text-neutral-900">Resultado Gerado</h3>
            {!isEditing ? (
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditValue(state.macroFlowResult); setIsEditing(true); }} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-gold">
                  <Edit2 size={16} /> Editar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={() => { updateState({ macroFlowResult: editValue }); setIsEditing(false); }} className="flex items-center gap-1 text-sm text-brand-gold hover:text-brand-gold-hover font-medium">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              className="w-full h-96 rounded-xl border border-brand-gold bg-brand-gold/10 p-4 text-sm focus:border-brand-gold focus:ring-brand-gold outline-none resize-y font-mono"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          ) : (
            <div id="macroflow-content" className="prose prose-sm max-w-none text-neutral-700">
              <ReactMarkdown>
                {state.macroFlowResult}
              </ReactMarkdown>
            </div>
          )}
          
          <div className="mt-8 flex justify-end border-t border-neutral-100 pt-4">
            <button
              onClick={() => {
                if (isEditing) {
                  updateState({ macroFlowResult: editValue });
                  setIsEditing(false);
                }
                onNext();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-dark/90 transition-all shadow-sm"
            >
              Avançar para Organograma
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
