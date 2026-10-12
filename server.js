/* By링크 서버 시작 파일
 * - 보통 요청은 Next 가 그대로 처리 (byranmedia.com/bylink/...)
 * - 짧은 도메인(bylink.me)으로 온 요청은 앞에 /bylink 를 붙여서 넘김
 *   bylink.me/아이디 → /bylink/아이디 (공개 페이지), bylink.me → 바이란미디어 By링크 소개
 */
const http = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.BYLINK_HOST || '0.0.0.0';
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const LOUNGE = (process.env.NEXT_PUBLIC_LOUNGE_URL || 'https://byranmedia.com').replace(/\/$/, '');
const SHORT_HOSTS = (process.env.BYLINK_SHORT_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);
const SLUG = /^\/([a-z0-9_.-]{3,30})\/?(\?.*)?$/i;
// 짧은 도메인에서 편집 화면 주소로 들어오면 바이란미디어 쪽으로 보냄
const APP_PATHS = new Set(['dashboard', 'edit', 'admin', 'login', 'logout', 'auth', 'api', 'p', 'img', 'go']);

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

function redirect(res, to, code = 302) {
  res.writeHead(code, { Location: to, 'Cache-Control': 'no-store' });
  res.end();
}

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      const host = String(req.headers.host || '').toLowerCase().split(':')[0];
      if (BASE && SHORT_HOSTS.length) {
        const bare = host.replace(/^www\./, '');
        if (SHORT_HOSTS.includes(bare)) {
          if (host !== bare) return redirect(res, `https://${bare}${req.url}`, 301);
          const url = req.url || '/';
          if (url === BASE || url.startsWith(BASE + '/') || url.startsWith(BASE + '?')) return handle(req, res);
          if (url === '/' || url.startsWith('/?')) return redirect(res, `${LOUNGE}/bylink`);
          const first = url.split(/[/?#]/)[1] || '';
          if (APP_PATHS.has(first.toLowerCase())) return redirect(res, `${LOUNGE}${BASE}${url}`);
          const m = SLUG.exec(url);
          if (m) {
            req.url = `${BASE}/${m[1].toLowerCase()}${m[2] || ''}`;
            return handle(req, res);
          }
          return redirect(res, `${LOUNGE}/bylink`);
        }
      }
      handle(req, res);
    })
    .listen(port, hostname, () => console.log(`> By링크 준비됨 http://${hostname}:${port}`));
});
