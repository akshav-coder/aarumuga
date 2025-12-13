import { apiSlice } from './apiSlice';

export const stockApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query({
      query: ({ page = 1, limit = 100, search = '', lowStock = false } = {}) => ({
        url: '/stock',
        params: { page, limit, search, lowStock: lowStock ? 'true' : '' },
      }),
      providesTags: ['Stock'],
    }),
    getStockItem: builder.query({
      query: (itemName) => `/stock/${itemName}`,
      providesTags: (result, error, itemName) => [{ type: 'Stock', id: itemName }],
    }),
    updateStock: builder.mutation({
      query: ({ itemName, ...data }) => ({
        url: `/stock/${itemName}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Stock'],
    }),
    adjustStock: builder.mutation({
      query: (data) => ({
        url: '/stock/adjust',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Stock'],
    }),
    deleteStock: builder.mutation({
      query: (itemName) => ({
        url: `/stock/${itemName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stock'],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockItemQuery,
  useUpdateStockMutation,
  useAdjustStockMutation,
  useDeleteStockMutation,
} = stockApi;

