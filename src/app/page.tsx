import ProductTable from "@/components/ProductTable";
//main page
export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Product Management Table</h1>
      <ProductTable />
    </main>
  );
}
