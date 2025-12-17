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
  }),
});

export const {
  useGetPayablesSummaryQuery,
  useGetSupplierPayablesQuery,
  useUpdatePayablesPaymentMutation,
} = payableApi;
