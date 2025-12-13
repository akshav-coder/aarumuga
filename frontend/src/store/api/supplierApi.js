import { apiSlice } from './apiSlice';

export const supplierApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url: '/suppliers',
        params: { page, limit, search },
      }),
      providesTags: ['Supplier'],
    }),
    getSupplier: builder.query({
      query: (id) => `/suppliers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({
        url: '/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Supplier'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;

