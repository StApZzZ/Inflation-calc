import { BUILTIN_COUNTRIES } from '@/lib/inflation-data';

export async function GET() {
  return Response.json({ countries: BUILTIN_COUNTRIES });
}
