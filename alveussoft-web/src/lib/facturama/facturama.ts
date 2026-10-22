import axios from "axios";

const env = process.env.FACTURAMA_ENV === "production" 
  ? "https://api.facturama.mx" 
  : "https://apisandbox.facturama.mx";

export const facturama = axios.create({
  baseURL: env,
  headers: {
    "Content-Type": "application/json",
     'Authorization': process.env.FACTURAMA_AUTH
  }
});
