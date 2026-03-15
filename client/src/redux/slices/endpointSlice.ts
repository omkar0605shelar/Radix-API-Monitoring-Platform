import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Endpoint {
  id: string;
  project_id: string;
  method: string;
  path: string;
  request_schema: any;
  response_schema: any;
}

interface EndpointState {
  endpoints: Endpoint[];
  selectedEndpoint: Endpoint | null;
}

const initialState: EndpointState = {
  endpoints: [],
  selectedEndpoint: null,
};

const endpointSlice = createSlice({
  name: 'endpoint',
  initialState,
  reducers: {
    setEndpoints: (state, action: PayloadAction<Endpoint[]>) => {
      state.endpoints = action.payload;
      state.selectedEndpoint = action.payload.length > 0 ? action.payload[0] : null;
    },
    setSelectedEndpoint: (state, action: PayloadAction<Endpoint | null>) => {
      state.selectedEndpoint = action.payload;
    },
  },
});

export const { setEndpoints, setSelectedEndpoint } = endpointSlice.actions;
export default endpointSlice.reducer;
