import axios from 'axios';
import { DocumentContents } from '../models/CustomDocument';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export async function fetchRetrievalData(year: number, month: number, company: string): Promise<DocumentContents> {
  const response = await api.post<DocumentContents>('/retrieval', { year, month, company });
  console.log('response from API:', response.data);
  console.log('Type of response:', typeof response.data);
  return response.data;
}
