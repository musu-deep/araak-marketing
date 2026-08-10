// Canonical ARAAK CEO gateway shim.
// The established institutional-access implementation is preserved in core.ts;
// all CEO identity/directory calls are forced through the adopted Render service.
const CEO_GATEWAY = 'https://ceo-office-platform.onrender.com';
const nativeFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const raw = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  try {
    const url = new URL(raw);
    const isCeoCall = url.pathname === '/api/auth/login' || url.pathname === '/api/employees';
    if (isCeoCall) {
      const target = new URL(`${url.pathname}${url.search}`, CEO_GATEWAY);
      if (input instanceof Request) {
        return nativeFetch(new Request(target, input), init);
      }
      return nativeFetch(target, init);
    }
  } catch {
    // Preserve native fetch behaviour for non-URL inputs.
  }

  return nativeFetch(input, init);
};

await import('./core.ts');
