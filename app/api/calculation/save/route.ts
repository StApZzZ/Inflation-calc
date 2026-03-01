import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

function sanitizeUserId(rawValue: string): string {
  return rawValue.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 120) || 'anonymous';
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const timestamp = new Date().toISOString();
    const userId = sanitizeUserId(String(payload.anonymous_user_id ?? 'anonymous'));
    const rootDir = path.join(process.cwd(), 'data', 'calculations', userId);
    const fileId = `${timestamp.replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(rootDir, fileId);

    await mkdir(rootDir, { recursive: true });
    await writeFile(
      filePath,
      JSON.stringify(
        {
          timestamp,
          anonymous_user_id: userId,
          settings: payload.settings,
          income: payload.income,
          savings: payload.savings,
          assets: payload.assets,
          inflation_data: payload.inflation_data,
          results: payload.results,
        },
        null,
        2,
      ),
      'utf8',
    );

    return Response.json({ ok: true, fileId });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Не удалось сохранить расчёт.',
      },
      { status: 500 },
    );
  }
}
