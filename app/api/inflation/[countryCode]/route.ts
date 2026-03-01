import { getBuiltinInflation } from '@/lib/inflation-data';

export async function GET(
  _request: Request,
  context: { params: Promise<{ countryCode: string }> },
) {
  const { countryCode } = await context.params;
  const data = getBuiltinInflation(countryCode.toUpperCase());

  if (data.length === 0) {
    return Response.json({ error: 'Страна не найдена.' }, { status: 404 });
  }

  return Response.json({ countryCode: countryCode.toUpperCase(), data });
}
