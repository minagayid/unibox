import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TabType = 'code' | 'website' | 'pdf' | 'spreadsheet' | 'terminal' | 'whiteboard' | 'mindmap' | 'database';

export interface Tab {
  id: string;
  title: string;
  type: TabType;
  content?: unknown;
  dirty?: boolean;
  path?: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  icon?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  task?: string;
  progress?: number;
  output?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cohere';
  type: 'chat' | 'reasoning' | 'vision' | 'math';
  contextWindow: number;
  costPer1k: number;
}

interface WorkspaceState {
  // Sidebar
  activeSidebarTab: string;
  setActiveSidebarTab: (tab: string) => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id'>) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, 'id' | 'lastOpened'>) => void;

  // Agents
  agents: Agent[];
  activeAgents: string[];
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;

  // Task Queue
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  rightSidebarCollapsed: boolean;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        // Sidebar
        activeSidebarTab: 'explorer',
        setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

        // Tabs
        tabs: [],
        activeTabId: null,
        openTab: (tab) => {
          const id = uuidv4();
          const newTab: Tab = { ...tab, id };
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: id,
          }));
          return id;
        },
        closeTab: (id) =>
          set((state) => {
            const tabs = state.tabs.filter((t) => t.id !== id);
            const activeTabId = state.activeTabId === id
              ? tabs[tabs.length - 1]?.id ?? null
              : state.activeTabId;
            return { tabs, activeTabId };
          }),
        setActiveTab: (id) => set({ activeTabId: id }),
        updateTab: (id, updates) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          })),

        // Projects
        projects: [],
        currentProject: null,
        setCurrentProject: (project) => set({ currentProject: project }),
        addProject: (project) =>
          set((state) => ({
            projects: [
              ...state.projects,
              { ...project, id: uuidv4(), lastOpened: new Date() },
            ],
          })),

        // Agents
        agents: [],
        activeAgents: [],
        addAgent: (agent) =>
          set((state) => ({
            agents: [...state.agents, { ...agent, id: uuidv4() }],
          })),
        updateAgent: (id, updates) =>
          set((state) => ({
            agents: state.agents.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
          })),
        removeAgent: (id) =>
          set((state) => ({
            agents: state.agents.filter((a) => a.id !== id),
          })),

        // Tasks
        tasks: [],
        addTask: (task) =>
          set((state) => ({
            tasks: [...state.tasks, { ...task, id: uuidv4(), createdAt: new Date() }],
          })),
        updateTask: (id, updates) =>
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          })),

        // UI
        sidebarCollapsed: false,
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        rightSidebarCollapsed: false,
        setRightSidebarCollapsed: (collapsed) =>
          set({ rightSidebarCollapsed: collapsed }),
        theme: 'dark',
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'unibox-workspace',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          rightSidebarCollapsed: state.rightSidebarCollapsed,
          projects: state.projects,
        }),
      }
    )
  )
);
