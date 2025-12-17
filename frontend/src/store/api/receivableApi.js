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
  }),
});

export const {
  useGetReceivablesSummaryQuery,
  useGetCustomerReceivablesQuery,
  useUpdateReceivablesPaymentMutation,
} = receivableApi;
