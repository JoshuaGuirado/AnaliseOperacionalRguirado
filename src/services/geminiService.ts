import { GoogleGenAI, Type } from "@google/genai";
import { Attachment } from "../App";

// Use import.meta.env for Vite (browser) and process.env for Node
const apiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });
const MODEL = "gemini-2.5-flash";

export const geminiService = {
  async generateInterviewScript(industry: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Atuo como consultor empresarial e preciso fazer o levantamento do Macro Fluxo de uma empresa do segmento: "${industry}".
      Crie um roteiro de entrevista ou dicas de gravação de áudio para o dono da empresa (franqueado/cliente).
      O objetivo é que ele saiba exatamente o que falar e quais informações fornecer para que eu consiga mapear todo o funcionamento do negócio (abertura, vendas, atendimento, financeiro, logística, etc).
      Forneça perguntas chave e dicas de como ele deve gravar o áudio ou escrever o texto.
      Apresente em formato Markdown.`,
    });
    return response.text || "";
  },

  async generateMacroFlow(textContext: string, attachments: Attachment[] = []): Promise<string> {
    const parts: any[] = [];
    
    const promptInstructions = `Crie um Macro Fluxo Empresarial detalhado com base ESTRITAMENTE nos documentos, áudios e anotações fornecidos.
REGRA CRÍTICA E ABSOLUTA: VOCÊ NÃO DEVE INVENTAR NENHUMA INFORMAÇÃO, ETAPA OU SETOR. Utilize APENAS as informações explícitas fornecidas. Se uma etapa ou departamento não for mencionado nos anexos ou textos, não o inclua (não assuma o que uma empresa padrão teria). O relatório deve refletir fielmente apenas a realidade apresentada nos dados.

O macro fluxo deve descrever o funcionamento da empresa passo a passo com base nos dados.
Apresente em formato Markdown bem estruturado, com títulos e listas.

MUITO IMPORTANTE: O macro fluxo deve ser extremamente detalhado, contendo muito texto, descrições profundas e listas exaustivas para cada etapa do funcionamento da empresa que pôde ser identificada. Não inclua fluxogramas ou imagens, apenas texto rico e detalhado.`;

    if (textContext.trim()) {
      parts.push({
        text: `${promptInstructions}
        
Informações brutas/Anotações:
${textContext}`
      });
    } else {
      parts.push({
        text: promptInstructions
      });
    }

    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts },
    });
    return response.text || "";
  },

  async generateOrgChart(macroFlow: string): Promise<any> {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Com base no seguinte Macro Fluxo Empresarial, sugira um Organograma formal para a empresa.
      Retorne APENAS um JSON válido seguindo a estrutura solicitada.
      
      Macro Fluxo:
      ${macroFlow}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            departments: {
              type: Type.ARRAY,
              description: "Lista de departamentos ou áreas da empresa",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome do departamento (ex: Comercial, Logística)" },
                  roles: {
                    type: Type.ARRAY,
                    description: "Cargos ou funções dentro deste departamento",
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "roles"]
              }
            }
          },
          required: ["departments"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async generateJobDescription(roleName: string, activities: string, attachments: Attachment[] = []): Promise<string> {
    const parts: any[] = [];
    
    if (activities.trim()) {
      parts.push({
        text: `Crie um Descritivo de Função formal para o cargo "${roleName}".
        Utilize as seguintes atividades descritas pelo colaborador e os documentos/áudios anexados como base.
        Se possível, faça uma correlação com o padrão CBO (Classificação Brasileira de Ocupações).
        Apresente em formato Markdown, contendo:
        - Título do Cargo
        - Missão do Cargo
        - Responsabilidades e Atribuições (passo a passo)
        - Requisitos/Qualificações sugeridas
        
        Atividades relatadas:
        ${activities}`
      });
    } else {
      parts.push({
        text: `Crie um Descritivo de Função formal para o cargo "${roleName}".
        Utilize os documentos/áudios anexados como base para entender as atividades do colaborador.
        Se possível, faça uma correlação com o padrão CBO (Classificação Brasileira de Ocupações).
        Apresente em formato Markdown, contendo:
        - Título do Cargo
        - Missão do Cargo
        - Responsabilidades e Atribuições (passo a passo)
        - Requisitos/Qualificações sugeridas`
      });
    }

    attachments.forEach(att => {
      parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts },
    });
    return response.text || "";
  },

  async generateProcessList(macroFlow: string, orgChart: any): Promise<any> {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Com base no Macro Fluxo e no Organograma abaixo, crie uma Lista Mestre de Processos.
      Identifique os processos principais que precisam ser padronizados para cada área.
      Retorne APENAS um JSON válido.
      
      Macro Fluxo:
      ${macroFlow}
      
      Organograma:
      ${JSON.stringify(orgChart)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Lista de processos mestre",
          items: {
            type: Type.OBJECT,
            properties: {
              department: { type: Type.STRING, description: "Departamento responsável" },
              processes: {
                type: Type.ARRAY,
                description: "Lista de nomes de processos para este departamento",
                items: { type: Type.STRING }
              }
            },
            required: ["department", "processes"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async generateProcessDetails(processName: string, rawInput: string, attachments: Attachment[] = []): Promise<string> {
    const parts: any[] = [];
    
    const promptInstructions = `Mapeie o processo "${processName}" de forma detalhada e padronizada.
REGRA CRÍTICA E ABSOLUTA: VOCÊ NÃO DEVE INVENTAR NENHUMA INFORMAÇÃO. Utilize APENAS as informações explícitas fornecidas nas anotações de texto, áudios e documentos anexados. Se uma informação (como responsável, frequência, ferramenta) não existir nos dados fornecidos, preencha o campo exclusivamente com "Não informado" ou omita o detalhe em vez de inventar um.

Siga ESTRITAMENTE a estrutura Markdown abaixo para a saída (mantenha exatamente esses mesmos títulos e ordem, destaque o nome do processo em H1 e o conteúdo do Controle de Qualidade):

# **Processo:** ${processName}

**Objetivo:** [Descreva o objetivo do processo baseado SOMENTE nos dados]

**Passo a Passo:**
[Siga este formato numérico e de bullets]
1. [Nome do Passo]
   - [Detalhe baseado nos dados]
   - [Detalhe baseado nos dados]
2. [Nome do Passo]
   - [Detalhe baseado nos dados]

**Responsável:** [Função e Setor baseados nos dados, ou "Não informado"]

**Frequência:** [Quando ocorre, com base nos dados, ou "Não informado"]

**Registros/Formulários:** [Quaisquer sistemas ou formulários mencionados nos dados, ou "Não informado"]

**Observações Práticas:**
- [Dica, observação prática ou aviso baseado nos dados]
- [Dica, observação prática ou aviso baseado nos dados]

### 🎯 **Controle de Qualidade:**
| Etapa | Verificação Obrigatória | Critério de Sucesso |
|---|---|---|
| [Nome da Etapa mapeada] | [O que deve ser verificado obrigatoriamente] | [Quando a etapa é considerada concluída corretamente] |
| [Nome da Etapa mapeada] | [O que deve ser verificado obrigatoriamente] | [Quando a etapa é considerada concluída corretamente] |

MUITO IMPORTANTE: Após toda a estrutura de texto acima, gere também um fluxograma sequencial do processo utilizando a sintaxe do Mermaid.js (coloque-o dentro de um bloco de código \`\`\`mermaid ... \`\`\`).
REGRA CRÍTICA PARA O MERMAID: Você DEVE obrigatoriamente colocar ABSOLUTAMENTE TODOS os textos dos nós entre aspas duplas para evitar erros de sintaxe com caracteres especiais ou parênteses. 
Exemplo correto: A["Lote (300)"] --> B{"Abaixo do lote mínimo (300 unidades)?"}
Exemplo INCORRETO (gera erro): A[Lote (300)] --> B{Abaixo do lote mínimo (300 unidades)?}
Você está PROIBIDO de gerar textos de nós sem aspas duplas.`;

    if (rawInput.trim()) {
      parts.push({
        text: `${promptInstructions}
        
Informações brutas a serem utilizadas (não invente nada fora disso):
${rawInput}`
      });
    } else {
      parts.push({
        text: promptInstructions
      });
    }

    attachments.forEach(att => {
      parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts },
    });
    return response.text || "";
  }
};
