browser.contextMenus.create({
    id: "copy-decoded-url",
    title: "このページのURLを日本語のままコピー",
    contexts: ["all", "tab"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copy-decoded-url") {
        const decodedUrl = decodeURI(tab.url);

        // clipboard-helper.js defines function copyToClipboard.
        const code = "copyToClipboard(" + JSON.stringify(decodedUrl) + ");";

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
    }
});
