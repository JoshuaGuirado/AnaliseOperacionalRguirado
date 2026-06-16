import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, X, FileAudio, FileText, File as FileIcon, Download } from 'lucide-react';
import { Attachment } from '../App';
import * as mammoth from 'mammoth';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1B2A47',
    primaryTextColor: '#fff',
    primaryBorderColor: '#E5C058',
    lineColor: '#1B2A47',
    secondaryColor: '#E5C058',
    tertiaryColor: '#f4f4f5',
  },
  securityLevel: 'loose',
});

export const Mermaid = ({ chart, isLarge = false }: { chart: string, isLarge?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
          setSvgContent(svg);
        }
      }).catch(e => {
        console.error("Mermaid error", e);
      });
    }
  }, [chart]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fluxograma.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative group ${isLarge ? 'w-full' : ''}`}>
      <div ref={ref} className={`mermaid-container flex justify-center overflow-x-auto my-4 w-full p-4 bg-white rounded-xl border border-brand-dark/10 ${isLarge ? 'min-h-[500px] [&>svg]:w-full [&>svg]:max-w-none [&>svg]:h-auto' : ''}`} />
      {svgContent && (
        <button 
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 bg-brand-dark text-brand-gold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-brand-dark/90"
          title="Baixar SVG"
        >
          <Download size={16} />
        </button>
      )}
    </div>
  );
};

export function AudioRecorder({ onRecordingComplete }: { onRecordingComplete: (audio: Attachment) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          onRecordingComplete({
            mimeType: 'audio/webm',
            data: base64data,
            name: `Audio_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-4 p-3 border border-neutral-200 rounded-xl bg-white shadow-sm">
      {!isRecording ? (
        <button onClick={startRecording} className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm px-2">
          <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
            <Mic size={16} />
          </div>
          Gravar Áudio
        </button>
      ) : (
        <div className="flex items-center gap-4 w-full px-2">
          <div className="flex items-center gap-2 text-rose-600 animate-pulse">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-600" />
            <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
          </div>
          <button onClick={stopRecording} className="ml-auto flex items-center gap-2 bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 text-sm">
            <Square size={14} />
            Parar
          </button>
        </div>
      )}
    </div>
  );
}

export function FileUploader({ onFilesAdded }: { onFilesAdded: (files: Attachment[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const promises = files.map(file => {
      return new Promise<Attachment>((resolve, reject) => {
        if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = async () => {
            try {
              const arrayBuffer = reader.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              const text = result.value;
              
              // Convert text to base64 properly in browser
              const encoder = new TextEncoder();
              const uint8Array = encoder.encode(text);
              let binary = '';
              for (let i = 0; i < uint8Array.byteLength; i++) {
                binary += String.fromCharCode(uint8Array[i]);
              }
              const base64data = btoa(binary);
              
              resolve({
                mimeType: 'text/plain',
                data: base64data,
                name: file.name + ' (Texto Extraído).txt'
              });
            } catch (err) {
              console.error("Erro ao ler docx:", err);
              reject(err);
            }
          };
          reader.onerror = reject;
        } else {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64data = (reader.result as string).split(',')[1];
            resolve({
              mimeType: file.type || 'application/octet-stream',
              data: base64data,
              name: file.name
            });
          };
          reader.onerror = error => reject(error);
        }
      });
    });

    Promise.all(promises).then(results => {
      onFilesAdded(results);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }).catch(err => {
      console.error("Error reading files:", err);
      alert("Erro ao ler arquivos.");
    });
  };

  return (
    <div 
      className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center hover:bg-neutral-50 transition-colors cursor-pointer bg-white" 
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
        accept=".pdf,.txt,.csv,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.png,.jpg,.jpeg,audio/*" 
      />
      <div className="flex flex-col items-center gap-1 text-neutral-500">
        <Upload size={20} className="mb-1" />
        <p className="text-sm font-medium">Anexar Documentos</p>
        <p className="text-xs">PDF, Word, Imagens, Áudios, etc.</p>
      </div>
    </div>
  );
}

export function AttachmentList({ attachments, onRemove }: { attachments: Attachment[], onRemove: (index: number) => void }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {attachments.map((att, index) => {
        const isAudio = att.mimeType.startsWith('audio/');
        const isPdf = att.mimeType === 'application/pdf';
        
        return (
          <div key={index} className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm">
            {isAudio ? <FileAudio size={14} className="text-rose-500" /> : 
             isPdf ? <FileText size={14} className="text-blue-500" /> : 
             <FileIcon size={14} className="text-neutral-500" />}
            <span className="truncate max-w-[150px] text-neutral-700 text-xs" title={att.name}>{att.name}</span>
            <button onClick={() => onRemove(index)} className="text-neutral-400 hover:text-red-500 ml-1">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
