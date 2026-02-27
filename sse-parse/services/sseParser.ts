
import { SSEEvent } from '../types';

export const parseRawSSE = (rawText: string): SSEEvent[] => {
  const lines = rawText.split('\n');
  const events: SSEEvent[] = [];
  
  let currentEvent: Partial<SSEEvent> = {};
  
  // Skip potential HTTP headers by looking for the first "event:" or "data:"
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!started && (line.startsWith('event:') || line.startsWith('data:'))) {
      started = true;
    }
    
    if (!started) continue;

    if (line === '') {
      // Empty line indicates end of an event block in SSE
      if (currentEvent.event || currentEvent.data) {
        try {
          if (currentEvent.data) {
            currentEvent.parsedData = JSON.parse(currentEvent.data);
          }
        } catch (e) {
          // Keep as string if not JSON
        }
        events.push({
          event: currentEvent.event || 'message',
          data: currentEvent.data || '',
          parsedData: currentEvent.parsedData,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(7)
        });
        currentEvent = {};
      }
      continue;
    }

    if (line.startsWith('event:')) {
      currentEvent.event = line.replace('event:', '').trim();
    } else if (line.startsWith('data:')) {
      const dataPart = line.replace('data:', '').trim();
      currentEvent.data = (currentEvent.data || '') + dataPart;
    } else if (line.startsWith('id:')) {
      currentEvent.id = line.replace('id:', '').trim();
    }
  }

  // Handle last block if it didn't end with a newline
  if (currentEvent.event || currentEvent.data) {
    try {
      if (currentEvent.data) {
        currentEvent.parsedData = JSON.parse(currentEvent.data);
      }
    } catch (e) {}
    events.push({
      event: currentEvent.event || 'message',
      data: currentEvent.data || '',
      parsedData: currentEvent.parsedData,
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(7)
    });
  }

  return events;
};

export const reconstructMessage = (events: SSEEvent[]) => {
  const state: any = {
    blocks: [],
    usage: null,
    model: null,
    stop_reason: null
  };

  events.forEach(ev => {
    const data = ev.parsedData;
    if (!data) return;

    switch (data.type) {
      case 'message_start':
        state.model = data.message?.model;
        state.role = data.message?.role;
        state.usage = data.message?.usage;
        break;

      case 'content_block_start':
        const newBlock: any = {
          type: data.content_block?.type,
          index: data.index,
          content: '',
          id: data.content_block?.id,
          name: data.content_block?.name,
          input: '',
          signature: ''
        };
        state.blocks[data.index] = newBlock;
        break;

      case 'content_block_delta':
        const block = state.blocks[data.index];
        if (block) {
          if (data.delta?.type === 'thinking_delta') {
            block.content += data.delta.thinking || '';
          } else if (data.delta?.type === 'text_delta') {
            block.content += data.delta.text || '';
          } else if (data.delta?.type === 'input_json_delta') {
            block.input += data.delta.partial_json || '';
          } else if (data.delta?.type === 'signature_delta') {
            block.signature = data.delta.signature;
          }
        }
        break;

      case 'message_delta':
        state.stop_reason = data.delta?.stop_reason;
        if (data.usage) {
          state.usage = { ...state.usage, ...data.usage };
        }
        break;
    }
  });

  return state;
};
