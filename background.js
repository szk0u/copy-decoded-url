// コンテキストメニューを2つ以上追加すると、自動的にサブメニューになる
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/menus#Creating_menu_items

browser.contextMenus.create({
    id: "copy-only-url",
    title: browser.i18n.getMessage("copyOnlyUrl"),
    contexts: ["page", "tab"]
});

browser.contextMenus.create({
    id: "copy-as-markdown",
    title: browser.i18n.getMessage("copyAsMarkdown"),
    contexts: ["page", "tab"]
});

browser.contextMenus.create({
    id: "copy-as-rst",
    title: browser.i18n.getMessage("copyAsRst"),
    contexts: ["page", "tab"]
});

browser.contextMenus.create({
    id: "copy-as-textile",
    title: browser.i18n.getMessage("copyAsTextile"),
    contexts: ["page", "tab"]
});

browser.contextMenus.create({
    id: "copy-as-text",
    title: browser.i18n.getMessage("copyAsText"),
    contexts: ["page", "tab"]
});

browser.contextMenus.create({
    id: "copy-link",
    title: browser.i18n.getMessage("copyLink"),
    contexts: ["link"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    const decodedUrl = decodeURI(tab.url);
    const title = tab.title;

    const executeCopy = (code) => {
        browser.tabs.executeScript({
            code: "typeof copyToClipboard === 'function';",
        }).then((results) => {
            // The content script's last expression will be true if the function
            // has been defined. If this is not the case, then we need to run
            // clipboard-helper.js to define function copyToClipboard.
            if (!results || results[0] !== true) {
                return browser.tabs.executeScript(tab.id, {
                    file: "clipboard-helper.js",
                });
            }
        }).then(() => {
            return browser.tabs.executeScript(tab.id, {
                code,
            });
        }).catch((error) => {
            // This could happen if the extension is not allowed to run code in
            // the page, for example if the tab is a privileged page.
            console.error("Failed to copy text: " + error);
        });
    };

    let code = "";
    if (info.menuItemId === "copy-link") {
        code = `copyToClipboard(${JSON.stringify(decodeURI(info.linkUrl))});`;
    } else if (info.menuItemId === "copy-only-url") {
        code = `copyToClipboard(${JSON.stringify(decodedUrl)});`;
    } else {
        // プレーンテキストのtextをデフォルトでセット
        let text = `${title} <${decodedUrl}>`;

        if (info.menuItemId === "copy-as-markdown") {
            text = `[${title}](${decodedUrl})`;
        } else if (info.menuItemId === "copy-as-rst") {
            text = `\`${title} <${decodedUrl}>\`_`;
        } else if (info.menuItemId === "copy-as-textile") {
            text = `"${title}":${decodedUrl}`;
        }

        code = `copyToClipboard(${JSON.stringify(text)});`;
    }
    executeCopy(code);
});
