import { apiSlice } from "./apiSlice";

export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        startDate = "",
        endDate = "",
        supplier = "",
        paymentStatus = "",
        paymentMethod = "",
      } = {}) => ({
        url: "/purchases",
        params: {
          page,
          limit,
          search,
          startDate,
          endDate,
          supplier,
          paymentStatus,
          paymentMethod,
        },
      }),
      providesTags: ["Purchase"],
    }),
    getPurchase: builder.query({
      query: (id) => `/purchases/${id}`,
      providesTags: (result, error, id) => [{ type: "Purchase", id }],
    }),
    createPurchase: builder.mutation({
      query: (data) => ({
        url: "/purchases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Purchase", "Stock"],
    }),
    updatePurchase: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchases/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Purchase", "Stock"],
    }),
    deletePurchase: builder.mutation({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Purchase", "Stock"],
    }),
    bulkDeletePurchases: builder.mutation({
      query: (ids) => ({
        url: "/purchases/bulk-delete",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["Purchase", "Stock"],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useBulkDeletePurchasesMutation,
} = purchaseApi;
