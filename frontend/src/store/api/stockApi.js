import { apiSlice } from "./apiSlice";

export const stockApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query({
      query: () => "/stock",
      providesTags: ["Stock"],
    }),
    getStockItem: builder.query({
      query: () => "/stock/current",
      providesTags: [{ type: "Stock", id: "current" }],
    }),
    updateStock: builder.mutation({
      query: (data) => ({
        url: "/stock",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Stock"],
    }),
    adjustStock: builder.mutation({
      query: (data) => ({
        url: "/stock/adjust",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Stock"],
    }),
    deleteStock: builder.mutation({
      query: () => ({
        url: "/stock",
        method: "DELETE",
      }),
      invalidatesTags: ["Stock"],
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
