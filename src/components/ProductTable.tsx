"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Product type
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  deleted?: boolean;
}

// Zod schema
const productSchema = z.object({
  name: z.string().nonempty("Name is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().min(0, "Stock cannot be negative"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductTable() {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch products with newest at top
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get("/api/products");
      return res.data
        .filter((p: Product) => !p.deleted)
        .sort((a: Product, b: Product) => parseInt(b.id) - parseInt(a.id)); // newest first
    },
  });

  const createMutation = useMutation({
    mutationFn: (product: ProductForm) => axios.post("/api/products", product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (product: Product & ProductForm) =>
      axios.put("/api/products", product).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete("/api/products", { data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  // Form with validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = (data: ProductForm) => {
    createMutation.mutate(data);
    reset();
  };

  const handleEdit = (product: Product) => {
    const name = prompt("Enter new name:", product.name);
    const price = prompt("Enter new price:", product.price.toString());
    const stock = prompt("Enter new stock:", product.stock.toString());
    if (!name || !price || !stock) return;

    updateMutation.mutate({
      ...product,
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) deleteMutation.mutate(id);
  };

  // Virtualizer for product rows
  const rowVirtualizer = useVirtualizer({
    count: allProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Approximate row height in px
  });

  return (
    <div className="p-4">
      {/* Add Product Form */}
      <form
        className="mb-4 grid grid-cols-4 gap-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <input
            className="border p-1 w-full"
            placeholder="Name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            className="border p-1 w-full"
            type="number"
            placeholder="Price"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price.message}</p>
          )}
        </div>

        <div>
          <input
            className="border p-1 w-full"
            type="number"
            placeholder="Stock"
            {...register("stock", { valueAsNumber: true })}
          />
          {errors.stock && (
            <p className="text-red-500 text-sm">{errors.stock.message}</p>
          )}
        </div>

        <button type="submit" className="bg-blue-500 text-white p-1">
          Add Product
        </button>
      </form>

      {/* Virtualized Product Table */}
      <div ref={parentRef} className="h-[600px] overflow-auto border">
        <div
          style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const product = allProducts[virtualRow.index];
            return (
              <div
                key={product.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-4 border-b p-2 items-center"
              >
                <span>{product.name}</span>
                <span>${product.price}</span>
                <span>{product.stock}</span>
                <span className="space-x-2">
                  <button
                    className="text-blue-500"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
