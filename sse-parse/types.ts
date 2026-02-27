
export interface SSEEvent {
  event: string;
  data: string;
  parsedData?: any;
  id?: string;
  timestamp: number;
}

export interface ContentBlock {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result';
  content: string;
  id?: string;
  name?: string;
  input?: any;
  signature?: string;
  is_error?: boolean;
}

export interface MessageState {
  model?: string;
  role?: string;
  blocks: ContentBlock[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  stop_reason?: string;
}

// New types for Dialogue History (Full HTTP JSON)
export interface ClaudePart {
  type: string;
  text?: string;
  thinking?: string;
  signature?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: string | any;
  is_error?: boolean;
  tool_use_id?: string;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: ClaudePart[];
}

export interface ClaudeChatHistory {
  model: string;
  messages: ClaudeMessage[];
  system?: any[];
  tools?: any[];
  usage?: any;
}
