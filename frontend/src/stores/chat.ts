import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { conversationService } from '../../services';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
  model?: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  context?: Record<string, unknown>;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  activeAgents: string[];
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isStreaming: false,
  error: null,
  activeAgents: [],
};

// Async thunks
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { content, conversationId }: { content: string; conversationId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await conversationService.sendMessage(content, conversationId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const streamMessage = createAsyncThunk(
  'chat/streamMessage',
  async (
    { content, conversationId }: { content: string; conversationId?: string },
    { rejectWithValue, signal }
  ) => {
    try {
      const response = await conversationService.streamMessage(content, conversationId, signal);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createConversation: (state) => {
      const newConversation: Conversation = {
        id: `${Date.now()}`,
  title: 'New Conversation',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
state.conversations.unshift(newConversation);
state.activeConversationId = newConversation.id;
},
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId
      );
      if (conversation) {
        conversation.messages.push(action.payload.message);
        conversation.updatedAt = new Date();
      }
    },
    setActiveAgents: (state, action: PayloadAction<string[]>) => {
      state.activeAgents = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isStreaming = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isStreaming = false;
        const { conversationId, message } = action.payload;
        const conversation = state.conversations.find((c) => c.id === conversationId);
        if (conversation) {
          conversation.messages.push(message);
          conversation.updatedAt = new Date();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isStreaming = false;
        state.error = action.payload as string;
      })
      .addCase(streamMessage.pending, (state) => {
        state.isStreaming = true;
        state.error = null;
      })
      .addCase(streamMessage.fulfilled, (state, action) => {
        state.isStreaming = false;
        const { conversationId, message } = action.payload;
        const conversation = state.conversations.find((c) => c.id === conversationId);
        if (conversation) {
          conversation.messages.push(message);
          conversation.updatedAt = new Date();
        }
      })
      .addCase(streamMessage.rejected, (state, action) => {
        state.isStreaming = false;
        state.error = action.payload as string;
      });
  },
});

export const { createConversation, setActiveConversation, clearError, addMessage, setActiveAgents } = chatSlice.actions;
export default chatSlice.reducer;
