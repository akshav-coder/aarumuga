import { apiSlice } from './apiSlice';

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recordPayment: builder.mutation({
      query: (data) => ({
        url: '/payments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Sales'],
    }),
    getOutstandingPayments: builder.query({
      query: (customer) => ({
        url: '/payments/outstanding',
        params: customer ? { customer } : {},
      }),
      providesTags: ['Payment'],
    }),
    getPaymentsBySale: builder.query({
      query: (saleId) => `/payments/sale/${saleId}`,
      providesTags: ['Payment'],
    }),
    deletePayment: builder.mutation({
      query: (id) => ({
        url: `/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment', 'Sales'],
    }),
  }),
});

export const {
  useRecordPaymentMutation,
  useGetOutstandingPaymentsQuery,
  useGetPaymentsBySaleQuery,
  useDeletePaymentMutation,
} = paymentApi;

