if (typeof initMessageEventListener === 'undefined') {
    window.addEventListener('message', function (event) {
        initMessageEventListener = true;
        // We only accept messages from ourselves
        if (event.source !== window) {
            return;
        }

        if (event.data.type && (event.data.type === "FROM_EXTENSION_CONTENT_SCRIPT")) {
            console.log("Content script received message: " + JSON.stringify(event.data));

            if (event.data.payload) {
                chrome.runtime.sendMessage(event.data.payload, (response) => {
                    console.log(response);
                });
            }
        }
    });

    function injectScript(rawScriptText) {
        const script = document.createElement('script');
        script.appendChild(document.createTextNode(rawScriptText));
        (document.body || document.head || document.documentElement).appendChild(script);
    }
}