/**
 * B2B_Patch_For_Existing.gs
 * ─────────────────────────────────────────────────────────────────────────────
 * 기존 B2B GAS 프로그램에 배포 견적요청 연동 기능을 추가하는 패치입니다.
 *
 * 적용 방법:
 *  1. 이 파일의 내용을 기존 GAS 프로젝트에 새 파일로 추가하세요.
 *  2. 기존 doGet(e) 함수 상단에 아래 코드를 추가하세요 (★ 표시 참조).
 *  3. 기존 저장(견적 저장) 함수에 linkDistRequest_ 호출을 추가하세요 (★ 표시 참조).
 *  4. HTML 템플릿의 <head> 또는 DOMContentLoaded 핸들러에 스크립트 삽입 코드를 추가하세요.
 *
 * ─── doGet() 수정 예시 ────────────────────────────────────────────────────────
 *
 *   function doGet(e) {
 *     // ★ 배포 견적요청 처리 (기존 코드 맨 위에 추가)
 *     var distResult = handleDistRequest(e);
 *
 *     // ... 기존 doGet 코드 ...
 *
 *     var html = HtmlService.createTemplateFromFile('index');
 *     // ★ 배포 견적 데이터 주입 (html.evaluate() 전에 추가)
 *     if (distResult) {
 *       html.distInitScript = getDistInitScript(distResult);
 *       html.distReqId = distResult.requestId;
 *     } else {
 *       html.distInitScript = '';
 *       html.distReqId = '';
 *     }
 *     return html.evaluate().setTitle('B2B 견적 프로그램');
 *   }
 *
 * ─── HTML 템플릿 수정 예시 (index.html) ──────────────────────────────────────
 *
 *   <head>
 *     ...
 *     <!-- ★ 배포 견적 자동입력 스크립트 -->
 *     <?= distInitScript ?>
 *   </head>
 *   <!-- distReqId는 저장 시 linkDistRequest_ 호출에 사용 -->
 *   <input type="hidden" id="distReqId" value="<?= distReqId ?>">
 *
 * ─── 저장 함수 수정 예시 ────────────────────────────────────────────────────
 *
 *   function saveQuote(quoteData) {
 *     // ... 기존 저장 코드 ...
 *     var quoteId = '...'; // 생성된 견적 ID
 *
 *     // ★ 배포 견적요청 연동 (저장 완료 후 추가)
 *     var reqId = quoteData.distReqId; // hidden input 값
 *     if (reqId) {
 *       linkDistRequest_(reqId, quoteId);
 *     }
 *     return quoteId;
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

var DIST_API_BASE = 'https://cahwindow-b2b-dist.pages.dev';

/**
 * doGet(e)에서 reqId 파라미터를 감지하고 견적요청 데이터를 로드합니다.
 * @param {Object} e - doGet 이벤트 객체
 * @returns {Object|null} 견적요청 데이터 또는 null
 */
function handleDistRequest(e) {
  var reqId = e && e.parameter && e.parameter.reqId;
  if (!reqId) return null;

  try {
    return loadDistRequest(reqId);
  } catch (err) {
    Logger.log('handleDistRequest error: ' + err.toString());
    return null;
  }
}

/**
 * 배포 견적요청 API에서 데이터를 로드합니다.
 * 호출 시 상태가 '대기' → '확인'으로 자동 변경됩니다.
 * @param {string} reqId - 견적요청 ID (예: 한솔인테리어-7890-01)
 * @returns {Object} 견적요청 데이터
 */
function loadDistRequest(reqId) {
  var url = DIST_API_BASE + '/api/requests/' + encodeURIComponent(reqId) + '/for-quote';
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();

  if (code !== 200) {
    throw new Error('견적요청 로드 실패: HTTP ' + code);
  }

  var data = JSON.parse(response.getContentText());
  if (!data.success) {
    throw new Error(data.error || '견적요청 로드 실패');
  }

  return data;
}

/**
 * 견적 저장 완료 후 배포 견적요청에 생성된 견적 ID를 연동합니다.
 * 상태가 '완료'로 변경됩니다.
 * @param {string} reqId - 견적요청 ID
 * @param {string} quoteId - 생성된 견적 ID
 */
function linkDistRequest_(reqId, quoteId) {
  var url = DIST_API_BASE + '/api/requests/' + encodeURIComponent(reqId) + '/link';
  var options = {
    method: 'PATCH',
    contentType: 'application/json',
    payload: JSON.stringify({ quoteId: quoteId }),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code !== 200) {
    Logger.log('linkDistRequest_ 실패: HTTP ' + code + ' / reqId=' + reqId + ' / quoteId=' + quoteId);
    return false;
  }

  var data = JSON.parse(response.getContentText());
  Logger.log('linkDistRequest_ 완료: reqId=' + reqId + ' → quoteId=' + quoteId);
  return data.success === true;
}

/**
 * 클라이언트 측 자동입력 및 오렌지 배너를 렌더링하는 HTML 스크립트를 반환합니다.
 * HTML 템플릿의 <?= distInitScript ?> 위치에 삽입하세요.
 * @param {Object} distData - loadDistRequest()의 반환값
 * @returns {string} <script> 태그 포함 HTML 문자열
 */
function getDistInitScript(distData) {
  var json = JSON.stringify(distData);
  // JSON에 </script> 가 포함될 경우를 대비해 이스케이프
  json = json.replace(/<\/script>/gi, '<\\/script>');

  return '<script>\n' +
    '(function() {\n' +
    '  var DIST_DATA = ' + json + ';\n' +
    '\n' +
    '  // ─── 오렌지 배너 ──────────────────────────────────────────\n' +
    '  function showDistBanner() {\n' +
    '    var banner = document.createElement("div");\n' +
    '    banner.id = "dist-request-banner";\n' +
    '    banner.style.cssText = [\n' +
    '      "position:fixed", "top:0", "left:0", "right:0", "z-index:9999",\n' +
    '      "background:#f97316", "color:#fff", "padding:10px 16px",\n' +
    '      "font-size:14px", "font-weight:600", "display:flex",\n' +
    '      "align-items:center", "justify-content:space-between",\n' +
    '      "box-shadow:0 2px 8px rgba(0,0,0,.2)"\n' +
    '    ].join(";");\n' +
    '    var clientName = (DIST_DATA.clientInfo && DIST_DATA.clientInfo.name) || "";\n' +
    '    var reqId = DIST_DATA.requestId || "";\n' +
    '    banner.innerHTML =\n' +
    '      "<span>📋 배포 견적요청 자동입력됨 — " + clientName + " (" + reqId + ")</span>" +\n' +
    '      "<button onclick=\\"document.getElementById(\'dist-request-banner\').remove()\\"" +\n' +
    '      " style=\\"background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px\\">×</button>";\n' +
    '    document.body.insertBefore(banner, document.body.firstChild);\n' +
    '    // 배너 높이만큼 본문 상단 여백 추가\n' +
    '    document.body.style.paddingTop = "44px";\n' +
    '  }\n' +
    '\n' +
    '  // ─── 폼 자동입력 ─────────────────────────────────────────\n' +
    '  function fillForm() {\n' +
    '    var c = DIST_DATA.clientInfo || {};\n' +
    '    var s = DIST_DATA.siteInfo   || {};\n' +
    '\n' +
    '    // 거래처 정보 — 기존 B2B 프로그램의 input id/name에 맞게 수정하세요\n' +
    '    setField("clientName",    c.name);\n' +
    '    setField("clientCeo",     c.ceo);\n' +
    '    setField("clientContact", c.contact);\n' +
    '    setField("clientPhone",   c.phone);\n' +
    '    setField("clientEmail",   c.email);\n' +
    '    setField("clientBizNo",   c.bizNo);\n' +
    '\n' +
    '    // 현장 정보\n' +
    '    setField("siteName",    s.name);\n' +
    '    setField("siteAddress", s.address);\n' +
    '    setField("siteDetail",  s.detail);\n' +
    '    setField("siteFloor",   s.floor);\n' +
    '    setField("constType",   s.constType);\n' +
    '    setField("resType",     s.resType);\n' +
    '    setField("wishDate",    s.wishDate);\n' +
    '\n' +
    '    // 메모\n' +
    '    setField("memo", DIST_DATA.memo);\n' +
    '\n' +
    '    // distReqId hidden input\n' +
    '    setField("distReqId", DIST_DATA.requestId);\n' +
    '  }\n' +
    '\n' +
    '  function setField(id, value) {\n' +
    '    if (!value && value !== 0) return;\n' +
    '    var el = document.getElementById(id);\n' +
    '    if (!el) return;\n' +
    '    el.value = value;\n' +
    '    el.dispatchEvent(new Event("change", { bubbles: true }));\n' +
    '    el.dispatchEvent(new Event("input",  { bubbles: true }));\n' +
    '  }\n' +
    '\n' +
    '  // DOM 준비 후 실행\n' +
    '  if (document.readyState === "loading") {\n' +
    '    document.addEventListener("DOMContentLoaded", function() {\n' +
    '      showDistBanner();\n' +
    '      fillForm();\n' +
    '    });\n' +
    '  } else {\n' +
    '    showDistBanner();\n' +
    '    fillForm();\n' +
    '  }\n' +
    '})();\n' +
    '</script>';
}
