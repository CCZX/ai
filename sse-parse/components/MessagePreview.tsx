
import React from 'react';
import { MessageState } from '../types';

interface MessagePreviewProps {
  state: MessageState;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({ state }) => {
  if (!state.model && state.blocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 italic">
        Paste stream content to see reconstruction...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Model</div>
          <div className="text-sm font-semibold text-slate-700">{state.model || 'Unknown'}</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stop Reason</div>
          <div className="text-sm font-semibold text-slate-700 capitalize">{state.stop_reason || 'Streaming...'}</div>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
        {state.blocks.map((block, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b flex justify-between items-center ${
              block.type === 'thinking' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              block.type === 'tool_use' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
              'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <span>{block.type} Block #{idx}</span>
              {block.name && <span className="mono normal-case text-xs">{block.name}</span>}
            </div>
            
            <div className="p-4">
              {block.type === 'thinking' && (
                <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic">
                  {block.content}
                </div>
              )}
              
              {block.type === 'text' && (
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {block.content}
                </div>
              )}

              {block.type === 'tool_use' && (
                <div className="space-y-2">
                   <div className="text-[10px] text-slate-400 font-bold uppercase">Arguments</div>
                   <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                     <pre className="text-xs text-indigo-300 mono whitespace-pre-wrap">
                       {block.input || '{}'}
                     </pre>
                   </div>
                </div>
              )}

              {block.signature && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Signature</div>
                  <div className="text-[10px] mono text-slate-400 truncate">{block.signature}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Usage */}
      {state.usage && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Token Usage</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-500">Input</div>
              <div className="text-lg font-bold text-slate-700">{state.usage.input_tokens}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Output</div>
              <div className="text-lg font-bold text-slate-700">{state.usage.output_tokens}</div>
            </div>
            {state.usage.cache_read_input_tokens !== undefined && (
              <div>
                <div className="text-[10px] text-slate-500">Cache Read</div>
                <div className="text-lg font-bold text-slate-700">{state.usage.cache_read_input_tokens}</div>
              </div>
            )}
            {state.usage.cache_creation_input_tokens !== undefined && (
              <div>
                <div className="text-[10px] text-slate-500">Cache Write</div>
                <div className="text-lg font-bold text-slate-700">{state.usage.cache_creation_input_tokens}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePreview;
