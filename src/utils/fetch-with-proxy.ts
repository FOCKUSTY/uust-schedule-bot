import { ProxyAgent, fetch as undiciFetch } from "undici";

let proxyAgent: ProxyAgent | null = null;

/**
 * Возвращает настроенный ProxyAgent.
 * Поддерживает как HTTP(S), так и SOCKS-прокси (через URL-схему).
 */
function getProxyAgent(): ProxyAgent | undefined {
  if (proxyAgent) return proxyAgent;

  const proxyUrl =
    process.env.PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY;

  if (!proxyUrl) {
    return undefined;
  }

  try {
    proxyAgent = new ProxyAgent(proxyUrl);
    console.log(
      `[Proxy] Используется прокси: ${proxyUrl.replace(/\/\/.*@/, "//***@")}`,
    );
    return proxyAgent;
  } catch (error) {
    console.error("[Proxy] Не удалось создать ProxyAgent:", error);
    return undefined;
  }
}

/**
 * Аналог нативного fetch, но с автоматическим проксированием (если заданы переменные окружения).
 * Использует undici.fetch, который принимает dispatcher.
 */
export async function fetchWithProxy(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const agent = getProxyAgent();

  const undiciInit: any = { ...init };
  if (agent) {
    undiciInit.dispatcher = agent;
  }

  return undiciFetch(input as any, undiciInit) as unknown as Promise<Response>;
}
