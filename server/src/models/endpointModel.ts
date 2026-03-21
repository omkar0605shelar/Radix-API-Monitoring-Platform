import mongoose, { Document, Schema } from 'mongoose';

export interface Endpoint extends Document {
  project_id: mongoose.Types.ObjectId;
  method: string;
  path: string;
  request_schema: any;
  response_schema: any;
}

const EndpointSchema: Schema = new Schema({
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  request_schema: { type: Schema.Types.Mixed },
  response_schema: { type: Schema.Types.Mixed }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const EndpointModel = mongoose.model<Endpoint>('Endpoint', EndpointSchema);

export const createEndpoint = async (
  projectId: string,
  method: string,
  path: string,
  requestSchema: any,
  responseSchema: any
): Promise<Endpoint> => {
  const endpoint = new EndpointModel({
    project_id: projectId,
    method,
    path,
    request_schema: requestSchema,
    response_schema: responseSchema
  });
  return await endpoint.save();
};

export const getEndpointsByProject = async (projectId: string): Promise<Endpoint[]> => {
  return await EndpointModel.find({ project_id: projectId });
};

export default EndpointModel;
