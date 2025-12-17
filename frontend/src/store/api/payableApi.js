import { apiSlice } from "./apiSlice";

export const payableApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayablesSummary: builder.query({
      query: () => "/payables/summary",
      providesTags: ["Payable", "Purchase"],
    }),
    getSupplierPayables: builder.query({
      query: (supplier) => ({
        url: "/payables/supplier",
        params: { supplier },
      }),
      providesTags: ["Payable", "Purchase"],
    }),
    updatePayablesPayment: builder.mutation({
      query: (data) => ({
        url: "/payables/payment",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payable", "Purchase"],
    }),
    getSupplierPaymentHistory: builder.query({
      query: (supplier) => ({
        url: "/payables/history",
        params: { supplier },
      }),
      providesTags: ["PaymentHistory"],
    }),
  }),
});

export const {
  useGetPayablesSummaryQuery,
  useGetSupplierPayablesQuery,
  useUpdatePayablesPaymentMutation,
  useGetSupplierPaymentHistoryQuery,
} = payableApi;
