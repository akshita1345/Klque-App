import Response, { IResponse } from '../db/mongodb/response.model';

export async function createResponse(data: Partial<IResponse>): Promise<IResponse> {
  const response = new Response({...data });
  return await response.save();
}

export async function getResponseById(id: string): Promise<IResponse | null> {
  return await Response.findById(id);
}

export async function updateResponse(id: string, update: Partial<IResponse>): Promise<IResponse | null> {
  return await Response.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteResponse(id: string): Promise<IResponse | null> {
  return await Response.findByIdAndDelete(id);
}

export async function listResponsesByUser(userId: string): Promise<IResponse[]> {
  return await Response.find({ userId, isDeleted: false });
} 