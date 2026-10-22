const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export const logoUrls = {
  logo: `${baseUrl}/storage/v1/object/public/logo/logo`,
  miniLogo: `${baseUrl}/storage/v1/object/public/logo/miniLogo`,
  longLogo: `${baseUrl}/storage/v1/object/public/logo/longLogo`
}
