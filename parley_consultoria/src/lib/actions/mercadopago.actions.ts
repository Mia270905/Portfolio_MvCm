"use server";

import { MercadoPagoConfig, Preference } from "mercadopago";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export async function createPaymentPreference(
  items: CartItem[],
  orderId: string,
  orderNumber: string,
  shippingCost: number,
  name: string,
  phone: string | number,
  streetNumParsed: string,
  streetName: string
) {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const preference = new Preference(client);

  const phoneDigits = String(phone).replace(/\D/g, "");

  const result = await preference.create({
    body: {
      items: [
        {
          id: orderId,
          title: `Polleria orden: #${orderNumber}`,
          quantity: 1,
          unit_price:
            items.reduce((acc, item) => acc + item.price * item.quantity, 0) + shippingCost,
          currency_id: "MXN",
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/historial/order/${orderId}?success=true`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/historial/order/${orderId}?success=false`,
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },
          { id: "atm" }
        ]
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
      metadata: {
        orderId,
        products: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      },
      payer: {
        name: name,
        phone: { number: phoneDigits },
        address: {
          street_name: streetName,
          street_number: streetNumParsed,
        },
      },
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook?token=${process.env.MP_WEBHOOK_SECRET}`,
    },
  });

  return {
    id: result.id,
    init_point: result.init_point,
    sandbox_init_point: result.sandbox_init_point,
  };
}
