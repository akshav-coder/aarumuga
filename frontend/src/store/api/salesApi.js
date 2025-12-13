import { apiSlice } from './apiSlice';

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query({
      query: ({ page = 1, limit = 10, search = '', startDate = '', endDate = '' } = {}) => ({
        url: '/sales',
        params: { page, limit, search, startDate, endDate },
      }),
      providesTags: ['Sales'],
    }),
    getSale: builder.query({
      query: (id) => `/sales/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sales', id }],
    }),
    createSale: builder.mutation({
      query: (data) => ({
        url: '/sales',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sales', 'Stock'],
    }),
    updateSale: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sales/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Sales', 'Stock'],
    }),
    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales', 'Stock'],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} = salesApi;

