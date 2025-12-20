import { apiSlice } from './apiSlice';

export const supplierPaymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSupplierOutstandingPurchases: builder.query({
      query: (supplierId) => `/supplier-payments/supplier/${supplierId}/outstanding`,
      providesTags: (result, error, supplierId) => [
        { type: 'SupplierPayment', id: supplierId },
        'Purchase',
      ],
    }),
    getSupplierPayments: builder.query({
      query: ({ supplierId, page = 1, limit = 10, startDate, endDate }) => ({
        url: `/supplier-payments/supplier/${supplierId}/payments`,
        params: { page, limit, startDate, endDate },
      }),
      providesTags: (result, error, { supplierId }) => [
        { type: 'SupplierPayment', id: `supplier-${supplierId}` },
      ],
    }),
    getAllPayments: builder.query({
      query: ({
        page = 1,
        limit = 10,
        supplierId,
        startDate,
        endDate,
        search,
      } = {}) => ({
        url: '/supplier-payments',
        params: { page, limit, supplierId, startDate, endDate, search },
      }),
      providesTags: ['SupplierPayment'],
    }),
    getPayment: builder.query({
      query: (id) => `/supplier-payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'SupplierPayment', id }],
    }),
    recordSupplierPayment: builder.mutation({
      query: (data) => ({
        url: '/supplier-payments/record',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Purchase', 'SupplierPayment'],
    }),
    deletePayment: builder.mutation({
      query: (id) => ({
        url: `/supplier-payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchase', 'SupplierPayment'],
    }),
  }),
});

export const {
  useGetSupplierOutstandingPurchasesQuery,
  useGetSupplierPaymentsQuery,
  useGetAllPaymentsQuery,
  useGetPaymentQuery,
  useRecordSupplierPaymentMutation,
  useDeletePaymentMutation,
} = supplierPaymentApi;

