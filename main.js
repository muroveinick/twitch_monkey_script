(function () {
    'use strict';

    console.log(22);

    const blocked_user = 'lovely';

    const SELECTORS_MAP = {
        Native: {
            container: `[class*='chat-scrollable-area__message-container']`,
            message: `[class*='__message-container']`,
            user: '.chat-line__username'
        },
        '7tv': {
            container: 'main.seventv-chat-list',
            message: '.seventv-chat-message-container',
            user: '.seventv-chat-user-username'
        }
    };

    let mode = 'Native';

    const cleanUp = (node) => {
        let message = node.querySelector(SELECTORS_MAP[mode].message),
            username = message?.querySelector(SELECTORS_MAP[mode].user),
            username_text = username?.innerText?.toLowerCase();

        console.log(username_text);

        // If a matching username element is found, check if it's the blocked user
        if (username_text && username_text.includes(blocked_user.toLowerCase())) {
            console.log(`deleted message from ${username_text}`);
            node.style.display = 'none';
        }
    }

    // MutationObserver to monitor the chat container for new messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) cleanUp(node);
            });
        });
    });

    const container = () => document.querySelector(SELECTORS_MAP[mode].container);

    function startObservingChat() {
        mode = 'Native';
        let chatContainer = container();
        if (!chatContainer) {
            mode = '7tv';
            chatContainer = container();
        }
        if (chatContainer) {
            cleanUp(chatContainer);
            observer.observe(chatContainer, { childList: true, subtree: true });
        } else {
            console.warn('no container found');

        }
    }

    let i = 1;
    const intervalID = setInterval(() => {
        startObservingChat();
        if (document.querySelector(SELECTORS_MAP[mode].container)) {
            clearInterval(intervalID);
            i += 1;
        }
    }, 1000 * i);
})();
