// 映射
const FILE_MAPPINGS = {
  '2.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_2_Base/filter.txt',
  '11.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_11_Mobile/filter.txt',
  '3.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_3_Spyware/filter.txt',
  '17.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_17_TrackParam/filter.txt',
  '14.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_14_Annoyances/filter.txt',
  '15.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_15_DnsFilter/filter.txt',
  '224.txt': 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_224_Chinese/filter.txt',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 移除开头的斜杠
  const fileName = pathname.substring(1);

  // 忽略 favicon 和其他图标文件请求
  if (fileName.endsWith('.ico') || fileName === 'favicon.ico') {
    return new Response(null, { status: 204 });
  }

  // 检查是否是请求的过滤器文件
  const targetUrl = FILE_MAPPINGS[fileName];

  try {
    // 代理请求到原始 URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Worker',
      },
    });

    // 创建新的响应，添加适当的缓存头
    const newResponse = new Response(response.body, response);

    // 设置响应头
    newResponse.headers.set('Content-Type', 'text/plain; charset=utf-8');
    newResponse.headers.set('Cache-Control', 'public, max-age=3600');
    newResponse.headers.set('Access-Control-Allow-Origin', '*');

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
    return handleRequest(request);
  },
};
