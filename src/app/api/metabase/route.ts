import jwt from 'jsonwebtoken';

const METABASE_SITE_URL = 'http://metabase.wfelipe.com.br';
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('id') || '36';  // default se quiser

  const payload = {
    resource: { dashboard: 36 },
    params: {
        "congrega%C3%A7%C3%A3o": [tenantId]
    },
    exp: Math.round(Date.now() / 1000) + (10 * 60) // expira em 10 minutos
  };

  const token = jwt.sign(payload, METABASE_SECRET_KEY);
  const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#background=false&bordered=false&titled=false`;

  return new Response(JSON.stringify({ iframeUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
