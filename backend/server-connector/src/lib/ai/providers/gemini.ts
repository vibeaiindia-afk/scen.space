import { modelFrom } from '../safe';
import { ProviderAdapter, ProviderError, type GenerateInput, type ProviderResult } from '../types';

function extractText(body:any):string{
  const parts=body?.candidates?.[0]?.content?.parts||[];
  return parts.map((p:any)=>typeof p?.text==='string'?p.text:'').filter(Boolean).join('\n').trim();
}

export const geminiAdapter:ProviderAdapter={
  id:'gemini',envKey:'GEMINI_API_KEY',defaultModel:modelFrom(process.env.SCEN_GEMINI_MODEL,'gemini-3.5-flash'),isConfigured:()=>Boolean(process.env.GEMINI_API_KEY),
  async generate(input:GenerateInput, signal:AbortSignal, modelOverride?:string):Promise<ProviderResult>{
    const apiKey=process.env.GEMINI_API_KEY;
    if(!apiKey) throw new ProviderError('gemini','GEMINI_API_KEY is not configured',503,false,'missing_key');
    const model=modelOverride||modelFrom(process.env.SCEN_GEMINI_MODEL,'gemini-3.5-flash');
    const payload:any={contents:[{role:'user',parts:[{text:input.input}]}],generationConfig:{maxOutputTokens:Math.max(1,Math.min(input.maxOutputTokens||2048,8192))}};
    if(input.system) payload.systemInstruction={parts:[{text:input.system}]};
    if(typeof input.temperature==='number') payload.generationConfig.temperature=input.temperature;
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify(payload)});
    const raw=await res.text(); let body:any={}; try{body=raw?JSON.parse(raw):{}}catch{body={raw}}
    if(!res.ok){const message=body?.error?.message||`Gemini request failed (${res.status})`;throw new ProviderError('gemini',message,res.status,res.status===429||res.status>=500,String(body?.error?.status||''))}
    const text=extractText(body); if(!text) throw new ProviderError('gemini','Gemini returned no text',502,true,'empty_output');
    return {text,provider:'gemini',model,usage:{inputTokens:Number(body?.usageMetadata?.promptTokenCount||0),outputTokens:Number(body?.usageMetadata?.candidatesTokenCount||0)},providerRequestId:body?.responseId};
  }
};
