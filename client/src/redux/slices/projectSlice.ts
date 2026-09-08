import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: string;
  user_id: string;
  name?: string;
  repository_url: string;
  status: string;
  created_at: string;
  analytics?: any;
  versions?: any[];
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    setProjectAnalytics: (state, action: PayloadAction<{ projectId: string; analytics: any }>) => {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      if (project) {
        project.analytics = action.payload.analytics;
      }
      if (state.currentProject?.id === action.payload.projectId) {
        state.currentProject.analytics = action.payload.analytics;
      }
    },
    setProjectVersions: (state, action: PayloadAction<{ projectId: string; versions: any[] }>) => {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      if (project) {
        project.versions = action.payload.versions;
      }
      if (state.currentProject?.id === action.payload.projectId) {
        state.currentProject.versions = action.payload.versions;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    }
  },
});

export const { setProjects, addProject, removeProject, setCurrentProject, setProjectAnalytics, setProjectVersions, setLoading } = projectSlice.actions;
export default projectSlice.reducer;
