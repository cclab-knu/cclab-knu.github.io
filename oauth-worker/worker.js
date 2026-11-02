// CCLab CMS 로그인용 OAuth 중계기 (GitHub) — Decap / Sveltia CMS 호환
// Cloudflare Workers 에 배포하세요.
//
// 설정값(Worker → Settings → Variables and Secrets 에 등록):
//   GITHUB_CLIENT_ID      : GitHub OAuth App 의 Client ID
//   GITHUB_CLIENT_SECRET  : GitHub OAuth App 의 Client secret  (Secret 으로 등록 권장)
//
// GitHub OAuth App 의 "Authorization callback URL" 은
//   https://<이-워커-주소>/callback  로 지정합니다.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1) CMS 가 /auth 로 보냄 → GitHub 동의 화면으로 리다이렉트
    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      gh.searchParams.set("redirect_uri", redirectUri);
      gh.searchParams.set("scope", url.searchParams.get("scope") || "repo,user");
      gh.searchParams.set("state", crypto.randomUUID());
      return Response.redirect(gh.toString(), 302);
    }

    // 2) GitHub 가 /callback?code=... 로 돌려보냄 → 토큰 교환 후 opener 로 전달
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing ?code", { status: 400 });

      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const data = await res.json();
      const ok = Boolean(data.access_token);
      const status = ok ? "success" : "error";
      const payload = ok
        ? { token: data.access_token, provider: "github" }
        : { provider: "github", error: data.error_description || "OAuth failed" };
      const message = "authorization:github:" + status + ":" + JSON.stringify(payload);

      const body = `<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body>
<script>
(function () {
  function receive(e) {
    window.opener && window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener("message", receive, false);
    window.close();
  }
  window.addEventListener("message", receive, false);
  window.opener && window.opener.postMessage("authorizing:github", "*");
})();
</script>
<p>로그인 처리 중… 창이 자동으로 닫히지 않으면 닫아 주세요.</p>
</body></html>`;
      return new Response(body, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }

    return new Response("CCLab CMS OAuth relay is running.", {
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
  },
};
