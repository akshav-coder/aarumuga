import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use environment variable for production, fallback to /api for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['Purchase', 'Sales', 'Stock', 'Customer', 'Supplier', 'Payment'],
  endpoints: (builder) => ({}),
});

