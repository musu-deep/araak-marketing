const DEFAULT_CEO_API_URL = 'https://musu-deep-nexgen-executives-ar.vercel.app';

function normaliseBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getBaseUrl() {
  return normaliseBaseUrl(process.env.ARAAK_CEO_API_URL || DEFAULT_CEO_API_URL);
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return { detail: await response.text() };
}

export async function loginWithCeo(email, password) {
  const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ARAAK-Marketing-Institutional-Bridge/1.0',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await readResponse(response);
  if (!response.ok || !payload?.access_token || !payload?.user) {
    const message = payload?.detail || payload?.message || 'تعذر التحقق من بيانات الدخول المؤسسية.';
    const error = new Error(message);
    error.status = response.status || 401;
    throw error;
  }

  return payload;
}

export function ceoApiPublicConfig() {
  return {
    provider: 'araak-ceo',
    url: getBaseUrl(),
  };
}
