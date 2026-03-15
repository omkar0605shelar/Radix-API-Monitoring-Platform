import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: string;
  user_id: string;
  repository_url: string;
  status: string;
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
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
  },
});

export const { setProjects, addProject, setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
