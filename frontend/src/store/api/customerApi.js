import { apiSlice } from './apiSlice';

export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url: '/customers',
        params: { page, limit, search },
      }),
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;

