// コンテキストメニューを2つ以上追加すると、自動的にサブメニューになる
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/menus#Creating_menu_items

const COPY_PAGE_URL_ONLY_URL = 'copyPageUrlOnlyUrl';
const COPY_PAGE_URL_AS_MD = 'copyPageUrlAsMd';
const COPY_PAGE_URL_AS_RST = 'copyPageUrlAsRst';
const COPY_PAGE_URL_AS_TEXTILE = 'copyPageUrlAsTextile';
const COPY_PAGE_URL_AS_ADOC = 'copyPageUrlAsAdoc';
const COPY_PAGE_URL_AS_TXT = 'copyPageUrlAsTxt';
const COPY_TAB_URL_ONLY_URL = 'copyTabUrlOnlyUrl';
const COPY_TAB_URL_AS_MD = 'copyTabUrlAsMd';
const COPY_TAB_URL_AS_RST = 'copyTabUrlAsRst';
const COPY_TAB_URL_AS_TEXTILE = 'copyTabUrlAsTextile';
const COPY_TAB_URL_AS_ADOC = 'copyTabUrlAsAdoc';
const COPY_TAB_URL_AS_TXT = 'copyTabUrlAsTxt';
const COPY_LINK_URL = 'copyLinkUrl';

// add page context menu
[COPY_PAGE_URL_ONLY_URL,
  COPY_PAGE_URL_AS_MD,
  COPY_PAGE_URL_AS_RST,
  COPY_PAGE_URL_AS_TEXTILE,
  COPY_PAGE_URL_AS_ADOC,
  COPY_PAGE_URL_AS_TXT
].forEach((id) => {
  browser.contextMenus.create({
    id: id,
    title: browser.i18n.getMessage(id),
    contexts: ['page']
  });
});

// add tab context menu
if (typeof (browser.runtime.getBrowserInfo) !== 'undefined') {
  let gettingInfo = browser.runtime.getBrowserInfo();
  gettingInfo.then((info) => {
    if (info.name === 'Firefox') {
      [COPY_TAB_URL_ONLY_URL,
        COPY_TAB_URL_AS_MD,
        COPY_TAB_URL_AS_RST,
        COPY_TAB_URL_AS_TEXTILE,
        COPY_TAB_URL_AS_ADOC,
        COPY_TAB_URL_AS_TXT
      ].forEach((id) => {
        browser.contextMenus.create({
          id: id,
          title: browser.i18n.getMessage(id),
          contexts: ['tab']
        });
      });
    }
  });
}

// add link context menu
browser.contextMenus.create({
  id: COPY_LINK_URL,
  title: browser.i18n.getMessage(COPY_LINK_URL),
  contexts: ['link']
});

const executeCopy = (code) => {
  // tabs.executeScriptをactive tab以外のタブで実行する場合、Host permissionsが必要なので、
  // active tabで実行する
  const tabId = browser.tabs.getCurrent().id;
  browser.tabs.executeScript(tabId, {
    code: "typeof copyToClipboard === 'function';"
  }).then((results) => {
    // The content script's last expression will be true if the function
    // has been defined. If this is not the case, then we need to run
    // clipboard-helper.js to define function copyToClipboard.
    if (!results || results[0] !== true) {
      return browser.tabs.executeScript(tabId, {
        file: 'src/clipboard-helper.js'
      });
    }
  }).then(() => {
    return browser.tabs.executeScript(tabId, {
      code
    });
  }).catch((error) => {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error('Failed to copy text: ' + error);
  });
};

browser.contextMenus.onClicked.addListener((info, tab) => {
  const decodedUrl = decodeURI(tab.url);
  const title = tab.title;
  let text = '';

  switch (info.menuItemId) {
    case COPY_LINK_URL:
      text = decodeURI(info.linkUrl);
      break;

    case COPY_PAGE_URL_ONLY_URL:
    case COPY_TAB_URL_ONLY_URL:
      text = decodedUrl;
      break;

    case COPY_PAGE_URL_AS_TXT:
    case COPY_TAB_URL_AS_TXT:
      text = `${title} <${decodedUrl}>`;
      break;

    case COPY_PAGE_URL_AS_MD:
    case COPY_TAB_URL_AS_MD:
      text = `[${title}](${decodedUrl})`;
      break;

    case COPY_PAGE_URL_AS_RST:
    case COPY_TAB_URL_AS_RST:
      text = `\`${title} <${decodedUrl}>\`_`;
      break;

    case COPY_PAGE_URL_AS_TEXTILE:
    case COPY_TAB_URL_AS_TEXTILE:
      text = `"${title}":${decodedUrl}`;
      break;

    case COPY_PAGE_URL_AS_ADOC:
    case COPY_TAB_URL_AS_ADOC:
      text = `${decodedUrl}[${title}]`;
      break;
  }

  const code = `copyToClipboard(${JSON.stringify(text)});`;
  executeCopy(code);
});

// chromeの場合には明示的にpageAction.showを呼び出す必要あり
browser.tabs.onUpdated.addListener((tabId) => {
  browser.pageAction.show(tabId);
});

browser.pageAction.onClicked.addListener((tab) => {
  const decodedUrl = decodeURI(tab.url);
  const code = `copyToClipboard(${JSON.stringify(decodedUrl)});`;
  executeCopy(code);
});
