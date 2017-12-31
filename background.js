browser.contextMenus.create({
    id: "copy-decoded-url",
    title: "このタブのURLを日本語のままコピー",
    contexts: ["all", "tab"]
});

// コンテキストメニューを2つ以上、追加すると、自動的にサブメニューになる
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/menus#Creating_menu_items

browser.contextMenus.create({
    id: "copy-decoded-url-markdown",
    title: "このタブのタイトルとURLをコピー(markdown形式)",
    contexts: ["all", "tab"]
});

browser.contextMenus.create({
    id: "copy-decoded-url-rst",
    title: "このタブのタイトルとURLをコピー(reStructuredText形式)",
    contexts: ["all", "tab"]
});

browser.contextMenus.create({
    id: "copy-decoded-url-textile",
    title: "このタブのタイトルとURLをコピー(textile形式)",
    contexts: ["all", "tab"]
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

    if (info.menuItemId === "copy-decoded-url") {
        const code = `copyToClipboard(${JSON.stringify(decodedUrl)});`;
        executeCopy(code);
    } else {
        // markdownの場合のtextをデフォルトでセット
        let text = `[${title}](${decodedUrl})`;

        if (info.menuItemId === "copy-decoded-url-rst") {
            text = `\`${title} <${decodedUrl}>\`_`;
        } else if (info.menuItemId === "copy-decoded-url-textile") {
            text = `"${title}":${decodedUrl}`;
        }

        const code = `copyToClipboard(${JSON.stringify(text)});`;
        executeCopy(code);
    }
});
