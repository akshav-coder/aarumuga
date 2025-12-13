import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use environment variable for production, fallback to /api for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Debug: Log the API URL being used (only in development)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('VITE_API_URL env var:', import.meta.env.VITE_API_URL);
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['Purchase', 'Sales', 'Stock', 'Customer', 'Supplier', 'Payment'],
  endpoints: (builder) => ({}),
});

