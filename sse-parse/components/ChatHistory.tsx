
import React from 'react';
import { ClaudeChatHistory, ClaudeMessage, ClaudePart } from '../types';

interface ChatHistoryProps {
  history: ClaudeChatHistory;
}

const PartRenderer: React.FC<{ part: ClaudePart; role: string }> = ({ part, role }) => {
  const isUser = role === 'user';
  
  switch (part.type) {
    case 'text':
      const isCaveat = part.text?.includes('local-command-caveat');
      const isStdout = part.text?.includes('local-command-stdout');
      
      let textColorClass = 'text-slate-800';
      if (isCaveat) textColorClass = 'opacity-50 italic text-[11px]';
      if (isStdout) textColorClass = 'bg-slate-800 text-slate-200 p-2 rounded mono text-xs';

      return (
        <div className={`text-sm leading-relaxed mb-3 ${textColorClass}`}>
          <div dangerouslySetInnerHTML={{ __html: part.text?.replace(/\n/g, '<br/>') || '' }} />
        </div>
      );
    
    case 'thinking':
      return (
        <details className="mb-4 bg-amber-50/50 border border-amber-100 rounded-lg overflow-hidden group">
          <summary className="px-4 py-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest cursor-pointer hover:bg-amber-100/50 transition-colors flex items-center justify-between">
            <span>Assistant Thinking Process</span>
            <svg className="w-3 h-3 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </summary>
          <div className="px-4 py-3 text-sm text-amber-900/80 italic whitespace-pre-wrap leading-relaxed border-t border-amber-100">
            {part.thinking}
            {part.signature && (
              <div className="mt-2 pt-2 border-t border-amber-200/50 text-[10px] mono opacity-50 truncate">
                SIG: {part.signature}
              </div>
            )}
          </div>
        </details>
      );

    case 'tool_use':
      return (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-indigo-100/50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Tool Call: {part.name}</span>
            <span className="text-[10px] mono text-indigo-400">{part.id}</span>
          </div>
          <div className="p-3 bg-slate-900">
            <pre className="text-xs text-indigo-300 mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        </div>
      );

    case 'tool_result':
      return (
        <div className={`mb-4 border rounded-lg overflow-hidden ${part.is_error ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className={`px-4 py-2 border-b flex items-center justify-between ${part.is_error ? 'bg-red-100/50 border-red-100 text-red-700' : 'bg-emerald-100/50 border-emerald-100 text-emerald-700'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Tool Result</span>
            <span className="text-[10px] mono opacity-50">{part.tool_use_id}</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className={`text-xs mono whitespace-pre-wrap leading-relaxed ${part.is_error ? 'text-red-600' : 'text-slate-700'}`}>
              {typeof part.content === 'string' ? part.content : JSON.stringify(part.content, null, 2)}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-slate-400 italic mb-2">Unknown part type: {part.type}</div>
      );
  }
};

const ChatHistory: React.FC<ChatHistoryProps> = ({ history }) => {
  return (
    <div className="space-y-12 pb-12">
      {/* Metadata Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Model</div>
          <div className="text-sm font-bold text-indigo-600 mono">{history.model}</div>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-slate-100 last:border-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Turns</div>
            <div className="text-sm font-bold text-slate-700">{history.messages.length}</div>
          </div>
          <div className="text-center px-4 border-r border-slate-100 last:border-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tools</div>
            <div className="text-sm font-bold text-slate-700">{history.tools?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-8">
        {history.messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-6 shadow-sm border ${
              msg.role === 'assistant' 
                ? 'bg-white border-slate-200 rounded-tl-none' 
                : 'bg-slate-100 border-slate-200 text-slate-900 rounded-tr-none'
            }`}>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${
                msg.role === 'assistant' ? 'text-indigo-500' : 'text-slate-400'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {msg.role}
              </div>
              
              <div>
                {msg.content.map((part, pIdx) => (
                  <PartRenderer key={pIdx} part={part} role={msg.role} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* System Information Section */}
      <div className="space-y-6">
        <details className="group border-t border-slate-200 pt-8">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">System Instructions ({history.system?.length || 0} Blocks)</h3>
            <svg className="w-4 h-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </summary>
          <div className="space-y-3 mt-4">
             {history.system?.map((item: any, i: number) => (
               <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 leading-relaxed shadow-sm">
                 <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Block {i+1} ({item.type})</div>
                 <div className="whitespace-pre-wrap">{item.text || JSON.stringify(item)}</div>
               </div>
             ))}
             {(!history.system || history.system.length === 0) && (
               <div className="text-sm text-slate-400 italic">No system instructions provided.</div>
             )}
          </div>
        </details>

        <details className="group border-t border-slate-200 pt-8">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Available Tools ({history.tools?.length || 0})</h3>
            <svg className="w-4 h-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             {history.tools?.map((tool: any, i: number) => (
               <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <div className="text-xs font-bold text-slate-800 mono">{tool.name}</div>
                 </div>
                 <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                   {tool.description}
                 </div>
                 {tool.input_schema && (
                   <details className="mt-3">
                     <summary className="text-[9px] font-bold text-slate-400 uppercase cursor-pointer hover:text-indigo-500">View Details & Schema</summary>
                     <div className="mt-2 text-[11px] text-slate-600 mb-2">{tool.description}</div>
                     <div className="mt-2 bg-slate-50 rounded p-2 overflow-x-auto">
                       <pre className="text-[10px] mono text-slate-600">{JSON.stringify(tool.input_schema, null, 2)}</pre>
                     </div>
                   </details>
                 )}
               </div>
             ))}
             {(!history.tools || history.tools.length === 0) && (
               <div className="text-sm text-slate-400 italic col-span-2">No tools defined in this session.</div>
             )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ChatHistory;
