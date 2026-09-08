import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IncidentItem, IncidentStats } from '../../services/incidentService';

interface IncidentState {
  incidents: IncidentItem[];
  total: number;
  pages: number;
  currentIncident: IncidentItem | null;
  stats: IncidentStats | null;
  loading: boolean;
  error: string | null;
  filters: {
    severity?: string;
    status?: string;
    category?: string;
    search?: string;
  };
}

const initialState: IncidentState = {
  incidents: [],
  total: 0,
  pages: 1,
  currentIncident: null,
  stats: null,
  loading: false,
  error: null,
  filters: {}
};

const incidentSlice = createSlice({
  name: 'incident',
  initialState,
  reducers: {
    setIncidents: (state, action: PayloadAction<{ items: IncidentItem[]; total: number; pages: number }>) => {
      state.incidents = action.payload.items;
      state.total = action.payload.total;
      state.pages = action.payload.pages;
      state.loading = false;
    },
    addOrUpdateIncident: (state, action: PayloadAction<IncidentItem>) => {
      const idx = state.incidents.findIndex(i => i.id === action.payload.id);
      if (idx >= 0) {
        state.incidents[idx] = { ...state.incidents[idx], ...action.payload };
      } else {
        state.incidents.unshift(action.payload);
        state.total += 1;
      }
      if (state.currentIncident?.id === action.payload.id) {
        state.currentIncident = { ...state.currentIncident, ...action.payload };
      }
    },
    setCurrentIncident: (state, action: PayloadAction<IncidentItem | null>) => {
      state.currentIncident = action.payload;
      state.loading = false;
    },
    setStats: (state, action: PayloadAction<IncidentStats>) => {
      state.stats = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<IncidentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    }
  }
});

export const {
  setIncidents,
  addOrUpdateIncident,
  setCurrentIncident,
  setStats,
  setLoading,
  setError,
  setFilters
} = incidentSlice.actions;

export default incidentSlice.reducer;
