import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { agentService } from '../../services';
import type { AgentDefinition, AgentRun, AgentStatus } from '../../types';

// Adapter for normalized agent state
const agentsAdapter = createEntityAdapter<AgentDefinition>({
  selectId: (agent) => agent.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Async thunks
export const loadAgents = createAsyncThunk(
  'agents/loadAgents',
  async (_, { rejectWithValue }) => {
    try {
      return await agentService.listAgents();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load agents');
    }
  }
);

export const executeAgent = createAsyncThunk(
  'agents/executeAgent',
  async (
    { agentId, task }: { agentId: string; task: string },
    { rejectWithValue }
  ) => {
    try {
      return await agentService.executeAgent(agentId, task);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to execute agent');
    }
  }
);

export const installAgent = createAsyncThunk(
  'agents/installAgent',
  async (agentId: string, { rejectWithValue }) => {
    try {
      return await agentService.installAgent(agentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to install agent');
    }
  }
);

export const uninstallAgent = createAsyncThunk(
  'agents/uninstallAgent',
  async (agentId: string, { rejectWithValue }) => {
    try {
      return await agentService.uninstallAgent(agentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to uninstall agent');
    }
  }
);

interface AgentsState {
  installedAgents: ReturnType<typeof agentsAdapter.getInitialState>;
  availableAgents: AgentDefinition[];
  agentRuns: Record<string, AgentRun>;
  selectedAgentId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AgentsState = {
  installedAgents: agentsAdapter.getInitialState(),
  availableAgents: [],
  agentRuns: {},
  selectedAgentId: null,
  loading: false,
  error: null,
};

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    selectAgent: (state, action: PayloadAction<string | null>) => {
      state.selectedAgentId = action.payload;
    },
    updateAgentRun: (state, action: PayloadAction<{ runId: string; updates: Partial<AgentRun> }>) => {
      const existing = state.agentRuns[action.payload.runId];
      if (existing) {
        state.agentRuns[action.payload.runId] = { ...existing, ...action.payload.updates };
      }
    },
    addAgentRun: (state, action: PayloadAction<AgentRun>) => {
      state.agentRuns[action.payload.id] = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load agents
      .addCase(loadAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAgents.fulfilled, (state, action) => {
        state.loading = false;
        const { installed, available } = action.payload;
        agentsAdapter.setAll(state.installedAgents, installed);
        state.availableAgents = available;
      })
      .addCase(loadAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Execute agent
      .addCase(executeAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(executeAgent.fulfilled, (state, action) => {
        state.loading = false;
        const { agentId, run } = action.payload;
        state.agentRuns[run.id] = run;
        agentsAdapter.updateOne(state.installedAgents, {
          id: agentId,
          changes: { status: 'running' as AgentStatus },
        });
      })
      .addCase(executeAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Install agent
      .addCase(installAgent.pending, (state) => {
        state.loading = true;
      })
      .addCase(installAgent.fulfilled, (state, action) => {
        state.loading = false;
        agentsAdapter.addOne(state.installedAgents, action.payload);
      })
      .addCase(installAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Uninstall agent
      .addCase(uninstallAgent.fulfilled, (state, action) => {
        agentsAdapter.removeOne(state.installedAgents, action.payload);
      });
  },
});

export const { selectAgent, updateAgentRun, addAgentRun, clearError } = agentsSlice.actions;
export { agentsAdapter };
export const agentsSelectors = agentsAdapter.getSelectors((state: { agents: AgentsState }) => state.agents.installedAgents);
export default agentsSlice.reducer;
