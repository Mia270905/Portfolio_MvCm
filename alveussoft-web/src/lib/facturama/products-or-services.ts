"use server";

import axios from "axios";

export async function searchProductsOrServices(keyword: string) {
  if (!keyword || keyword.trim().length <= 3) {
    return {
      success: false,
      message: "Keyword must have at least 3 characters",
      data: [],
    };
  }

  const cleanKeyword = keyword.trim();

  const user = process.env.FACTURAMA_USER!;
  const pass = process.env.FACTURAMA_PASSWORD!;

  const token = Buffer.from(`${user}:${pass}`).toString("base64");

  const api = axios.create({
    baseURL:
      process.env.FACTURAMA_ENV === "production"
        ? "https://api.facturama.mx"
        : "https://apisandbox.facturama.mx",
    headers: {
      Authorization: `Basic ${token}`,
    },
  });

  try {
    const res = await api.get(
      `/Catalogs/ProductsOrServices?keyword=${encodeURIComponent(cleanKeyword)}`
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error: any) {
    console.error("Facturama error:", error.response?.data);

    return {
      success: false,
      message: "Error searching products or services",
      error: error.response?.data || error.message,
    };
  }
}
