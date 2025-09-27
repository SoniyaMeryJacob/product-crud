import { NextApiRequest, NextApiResponse } from "next";

// Toggle this flag:
// true  = only 2 products (dev mode)
// false = 100,000 products (submission mode)
const DEV_MODE = true;

let products = DEV_MODE
  ? [
      { id: "1", name: "Laptop", price: 1200, stock: 10, deleted: false },
      { id: "2", name: "Phone", price: 800, stock: 25, deleted: false },
    ]
  : Array.from({ length: 100000 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `Product ${i + 1}`,
      price: parseFloat((Math.random() * 100).toFixed(2)),
      stock: Math.floor(Math.random() * 50),
      deleted: false,
    }));

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json(products.filter(p => !p.deleted));
  } else if (req.method === "POST") {
    const { name, price, stock } = req.body;
    const newProduct = {
      id: `${products.length + 1}`,
      name,
      price,
      stock,
      deleted: false,
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  } else if (req.method === "PUT") {
    const { id, name, price, stock } = req.body;
    products = products.map(p =>
      p.id === id ? { ...p, name, price, stock } : p
    );
    res.status(200).json(products.find(p => p.id === id));
  } else if (req.method === "DELETE") {
    const { id } = req.body;
    products = products.map(p =>
      p.id === id ? { ...p, deleted: true } : p
    );
    res.status(200).json({ id });
  }
}
