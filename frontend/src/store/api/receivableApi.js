import { apiSlice } from "./apiSlice";

export const receivableApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReceivablesSummary: builder.query({
      query: () => "/receivables/summary",
      providesTags: ["Receivable", "Sales"],
    }),
    getCustomerReceivables: builder.query({
      query: (customer) => ({
        url: "/receivables/customer",
        params: { customer },
      }),
      providesTags: ["Receivable", "Sales"],
    }),
    updateReceivablesPayment: builder.mutation({
      query: (data) => ({
        url: "/receivables/payment",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Receivable", "Sales"],
    }),
    getCustomerPaymentHistory: builder.query({
      query: (customer) => ({
        url: "/receivables/history",
        params: { customer },
      }),
      providesTags: ["ReceivablePaymentHistory"],
    }),
  }),
});

export const {
  useGetReceivablesSummaryQuery,
  useGetCustomerReceivablesQuery,
  useUpdateReceivablesPaymentMutation,
  useGetCustomerPaymentHistoryQuery,
} = receivableApi;
