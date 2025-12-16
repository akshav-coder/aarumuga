import { apiSlice } from "./apiSlice";

export const supplierPaymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recordSupplierPayment: builder.mutation({
      query: (data) => ({
        url: "/supplier-payments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SupplierPayment", "Purchase"],
    }),
    getOutstandingSupplierPayments: builder.query({
      query: (supplier = "") => ({
        url: "/supplier-payments/outstanding",
        params: supplier ? { supplier } : {},
      }),
      providesTags: ["SupplierPayment"],
    }),
    getPaymentsByPurchase: builder.query({
      query: (purchaseId) => `/supplier-payments/purchase/${purchaseId}`,
      providesTags: ["SupplierPayment"],
    }),
    deleteSupplierPayment: builder.mutation({
      query: (id) => ({
        url: `/supplier-payments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SupplierPayment", "Purchase"],
    }),
  }),
});

export const {
  useRecordSupplierPaymentMutation,
  useGetOutstandingSupplierPaymentsQuery,
  useGetPaymentsByPurchaseQuery,
  useDeleteSupplierPaymentMutation,
} = supplierPaymentApi;

