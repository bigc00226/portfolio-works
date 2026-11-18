/*
 * The code and settings this video types — the single source for the video (VS Code) and for the capture
 * (tools/snapshots/ec-cagiana-migration/capture-ec.js puts exactly this into the local EC-CUBE 4.3 and runs it).
 *   PATCH      the data migration plugin (DataMigration42, 4.3 対応版) on SQLite: its "else" branches are PostgreSQL's
 *   SUBSCRIBER app/Customize/EventSubscriber/LegacyUrlSubscriber.php — EC-CUBE 3 URLs that changed → 301
 *   CHECK      scripts/check-urls.ps1 — every old URL against the new shop (status codes)
 */
(function (root) {
  'use strict';
  const PLUGIN = 'app/Plugin/DataMigration42/Controller/Admin/ConfigController.php';
  // 1. the "else" after MySQL is PostgreSQL's (SET session_replication_role …): only for PostgreSQL
  const RE_ELSE = /\} else \{(\s*\n\s*)\$em->exec\('SET session_replication_role = replica;'\);/g;
  const ELSE_NEW = "} elseif ($platform == 'postgresql') {$1$em->exec('SET session_replication_role = replica;');";
  // 2. setIdSeq(): PostgreSQL's sequences (pg_class, setval) — SQLite's AUTOINCREMENT follows the largest id by itself
  const SEQ_OLD = "    private function setIdSeq($em, $tableName)\n    {\n";
  const SEQ_GUARD = [
    "        if ($em->getDatabasePlatform()->getName() !== 'postgresql') {",
    '            return; // SQLite: AUTOINCREMENT continues from max(id)',
    '        }',
  ];
  function patch(src) {
    const n = (src.match(RE_ELSE) || []).length;
    let out = src.replace(RE_ELSE, ELSE_NEW);
    if (!out.includes(SEQ_GUARD[0])) out = out.replace(SEQ_OLD, SEQ_OLD + SEQ_GUARD.join('\n') + '\n');
    return { src: out, elses: n };
  }

  const SUBSCRIBER_PATH = 'app/Customize/EventSubscriber/LegacyUrlSubscriber.php';
  const SUBSCRIBER = [
    '<?php',
    '',
    'namespace Customize\\EventSubscriber;',
    '',
    'use Symfony\\Component\\EventDispatcher\\EventSubscriberInterface;',
    'use Symfony\\Component\\HttpFoundation\\RedirectResponse;',
    'use Symfony\\Component\\HttpKernel\\Event\\RequestEvent;',
    'use Symfony\\Component\\HttpKernel\\KernelEvents;',
    '',
    '/**',
    ' * EC-CUBE 3 の URL のうち、EC-CUBE 4 で変わったものを 301 で転送する',
    ' * （商品 /products/detail/{id}・カテゴリ /products/list?category_id= は ID を引き継いだので同じ URL）',
    ' */',
    'class LegacyUrlSubscriber implements EventSubscriberInterface',
    '{',
    '    /** 旧 URL（EC-CUBE 3） => 新 URL（EC-CUBE 4） */',
    '    private const MAP = [',
    "        '/help/guide' => '/guide',",
    "        '/ec' => '/products/list',",
    '    ];',
    '',
    '    public static function getSubscribedEvents(): array',
    '    {',
    '        // ルーティング（RouterListener：優先度 32）より先に',
    "        return [KernelEvents::REQUEST => ['onKernelRequest', 64]];",
    '    }',
    '',
    '    public function onKernelRequest(RequestEvent $event): void',
    '    {',
    '        if (!$event->isMainRequest()) {',
    '            return;',
    '        }',
    '        $request = $event->getRequest();',
    "        $path = rtrim($request->getPathInfo(), '/') ?: '/';",
    '        if (!isset(self::MAP[$path])) {',
    '            return;',
    '        }',
    '        $query = $request->getQueryString();',
    "        $url = $request->getBaseUrl() . self::MAP[$path] . ($query ? '?' . $query : '');",
    '        $event->setResponse(new RedirectResponse($url, 301));',
    '    }',
    '}',
    '',
  ].join('\n');

  const CHECK_PATH = 'scripts/check-urls.ps1';
  const CHECK = [
    '# 旧サイト（EC-CUBE 3）の URL を新しい EC-CUBE 4 に投げて、ステータスコードを確認する（リダイレクトは追わない）',
    'param([string]$Base = "http://localhost:8080", [string]$List = "scripts/old-urls.txt")',
    '',
    'Get-Content $List | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object {',
    '    $code = curl.exe -s -o NUL -w "%{http_code} %{redirect_url}" "$Base$_"',
    '    "$code $_"',
    '}',
    '',
  ].join('\n');

  const api = { PLUGIN, patch, SEQ_GUARD, ELSE_NEW_LINE: "} elseif ($platform == 'postgresql') {", SUBSCRIBER_PATH, SUBSCRIBER, CHECK_PATH, CHECK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CAGIANA_SRC = api;
})(typeof window !== 'undefined' ? window : globalThis);
