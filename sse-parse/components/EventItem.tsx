
import React, { useState } from 'react';
import { SSEEvent } from '../types';

interface EventItemProps {
  event: SSEEvent;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getEventColor = (name: string) => {
    switch (name) {
      case 'message_start': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'content_block_start': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'content_block_delta': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'content_block_stop': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'message_stop': return 'bg-red-100 text-red-700 border-red-200';
      case 'ping': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEventColor(event.event)}`}>
          {event.event}
        </span>
        <span className="flex-1 text-xs text-slate-600 truncate mono">
          {event.data.substring(0, 100)}{event.data.length > 100 ? '...' : ''}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
          <div className="mt-3 p-3 bg-slate-900 rounded-lg overflow-x-auto">
            <pre className="text-[11px] text-emerald-400 mono">
              {JSON.stringify(event.parsedData || event.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventItem;
