import { MAP } from './map.js';

// 缓存时间3600秒
const CACHE_DURATION = 3600;

async function handleRequest(request, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 移除开头的斜杠
  const fileName = pathname.substring(1);

  // 忽略 favicon 和其他图标文件请求
  if (fileName.endsWith('.ico') || fileName === 'favicon.ico') {
    return new Response(null, { status: 204 });
  }

  // 检查是否是请求的过滤器文件
  const targetUrl = MAP[fileName];

  if (!targetUrl) {
    return new Response('文件未找到', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 使用 Cloudflare Cache API
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);

  // 尝试从缓存中获取
  let response = await cache.match(cacheKey);

  if (response) {
    // 缓存命中，添加标识头
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Cache-Status', 'HIT');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // 缓存未命中，重新获取
  try {
    response = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Worker',
      },
    });

    // 检查响应是否成功
    if (!response.ok) {
      return new Response(`请求失败: ${response.status} ${response.statusText}`, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 克隆响应用于缓存（响应体只能读取一次）
    const responseToCache = response.clone();

    // 创建新的响应，添加适当的缓存头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
        'Access-Control-Allow-Origin': '*',
        'X-Cache-Status': 'MISS',
        'X-Cache-Time': new Date().toISOString(),
      },
    });

    // 使用 waitUntil 异步缓存响应，不阻塞返回
    ctx.waitUntil(cache.put(cacheKey, responseToCache));

    return newResponse;
  }
  catch (error) {
    return new Response(`请求失败: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  },
};
