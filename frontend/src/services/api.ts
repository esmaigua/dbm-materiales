import axios from 'axios';

const api = axios.create({
  // Vercel inyectará la URL real aquí. Si no hay, usa localhost para cuando programes en tu PC.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});

export default api;