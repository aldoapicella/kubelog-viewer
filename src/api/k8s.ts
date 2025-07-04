import axios from 'axios';

export const k8s = axios.create({ baseURL: '/api', timeout: 15000 });
