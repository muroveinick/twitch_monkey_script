(function () {
'use strict';

// Configuration
const CONFIG = {
  blockedUsers: ['lovely'], // Array to support multiple blocked users
  checkInterval: 1000, // Initial check interval in ms
  maxRetries: 5, // Maximum number of retries to find chat container
  debug: true // Enable/disable logging
};

// Chat platform selectors
const SELECTORS = {
  'Native': {
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

// Utility functions
const logger = {
  log: (...args) => CONFIG.debug && console.log('[Chat Blocker]', ...args),
  warn: (...args) => CONFIG.debug && console.warn('[Chat Blocker]', ...args),
  error: (...args) => CONFIG.debug && console.error('[Chat Blocker]', ...args)
};

// Main functionality
class ChatBlocker {
  constructor() {
    this.mode = 'Native';
    this.observer = null;
    this.urlObserver = null;
    this.currentUrl = window.location.href;
    this.setupObserver();
  }

  setupObserver() {
    // Chat message observer
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) this.processMessage(node);
        });
      });
    });

    // URL change observer
    this.urlObserver = new MutationObserver(() => {
      if (this.currentUrl !== window.location.href) {
        logger.log('URL changed, reinitializing...');
        this.currentUrl = window.location.href;
        this.reinitialize();
      }
    });
  }

  reinitialize() {
    // Disconnect existing observers
    this.disconnect();

    // Wait a moment for the DOM to update with new chat
    setTimeout(() => {
      logger.log('Restarting chat blocker after URL change');
      this.start();
    }, 2000); // Give the page time to load the new chat
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      logger.log('Chat observer disconnected');
    }
  }

  processMessage(node) {
    const message = node.querySelector(SELECTORS[this.mode].message);
    const username = message?.querySelector(SELECTORS[this.mode].user);
    const usernameText = username?.innerText?.toLowerCase();

    if (!usernameText) return;

    // Check if username matches any blocked user
    if (CONFIG.blockedUsers.some(user => usernameText.includes(user.toLowerCase()))) {
      logger.log(`Blocked message from ${usernameText}`);
      node.style.display = 'none';
    }
  }

  findChatContainer() {
    // Try Native mode first
    this.mode = 'Native';
    let container = document.querySelector(SELECTORS[this.mode].container);

    // Fall back to 7tv if needed
    if (!container) {
      this.mode = '7tv';
      container = document.querySelector(SELECTORS[this.mode].container);
    }

    return container;
  }

  start() {
    // Disconnect any existing observation first
    this.disconnect();

    const container = this.findChatContainer();

    if (container) {
      logger.log(`Found chat container using ${this.mode} mode`);

      // Process existing messages
      logger.log('Processing existing messages...');
      const existingMessages = container.querySelectorAll(':scope > *');
      logger.log(`Found ${existingMessages.length} existing messages`);

      existingMessages.forEach(node => {
        this.processMessage(node);
      });

      // Observe new messages
      this.observer.observe(container, { childList: true, subtree: true });

      // Start observing URL changes if not already
      this.observeUrlChanges();

      return true;
    }

    logger.warn('No chat container found');
    return false;
  }

  observeUrlChanges() {
    // Only set up URL observer once
    if (!this.urlObserver._isObserving) {
      this.urlObserver.observe(document.querySelector('head > title'), {
        subtree: true,
        characterData: true,
        childList: true
      });
      this.urlObserver._isObserving = true;
      logger.log('Now monitoring for URL changes');
    }
  }
}

// Initialize and start the blocker
function initialize() {
  const blocker = new ChatBlocker();
  let attempts = 0;
  let interval = CONFIG.checkInterval;

  const tryStart = () => {
    attempts++;
    logger.log(`Attempt ${attempts} to find chat container...`);

    if (blocker.start()) {
      logger.log('Chat blocker started successfully');
      return true;
    }

    if (attempts >= CONFIG.maxRetries) {
      logger.error(`Failed to find chat container after ${attempts} attempts`);
      return true;
    }

    interval *= 1.5;
    setTimeout(tryStart, interval);
    return false;
  };

  tryStart();
}

// Run the script
initialize();
})();
