(() => {
  // Only create the widget if we're in the top-level window (not in an iframe)
  if (window.self === window.top) {
    // Create widget elements
    async function createChatWidget() {
      // Get the script tag to extract the slug
      const scriptTag =
        document.currentScript || document.querySelector("script[data-slug]");
      const slug = scriptTag.getAttribute("data-slug");

      if (!slug) {
        console.error(
          "Chatter AI: Missing data-slug attribute on script tag"
        );
        return;
      }

      // Determine the base URL
      const scriptSrc = scriptTag.src;
      const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf("/"));

      // Fetch agent details and UI config
      let agentId = null;
      let agentName = "AI Assistant";
      let uiConfig = {
        primaryColor: "#8b5cf6",
        secondaryColor: "#f5f5f5",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        borderRadius: 16,
        welcomeMessage: "Hello! How can I help you today?",
        headerTitle: "Chat Support",
      };

      try {
        // First fetch agent by slug to get the ID
        const agentResponse = await fetch(`${baseUrl}/api/agents/slug/${slug}`);
        if (!agentResponse.ok) {
          console.error(
            `Chatter AI: Agent with slug "${slug}" not found. Please check your embed code.`
          );
          return;
        }

        const agentData = await agentResponse.json();
        agentId = agentData.id;
        agentName = agentData.name || "AI Assistant";

        // Now fetch UI config using the agent ID
        const configResponse = await fetch(`${baseUrl}/api/agents/${agentId}/ui-config`);
        if (configResponse.ok) {
          const config = await configResponse.json();
          // Merge with defaults
          uiConfig = {
            primaryColor: config.primaryColor || uiConfig.primaryColor,
            secondaryColor: config.secondaryColor || uiConfig.secondaryColor,
            backgroundColor: config.backgroundColor || uiConfig.backgroundColor,
            textColor: config.textColor || uiConfig.textColor,
            borderRadius: config.borderRadius || uiConfig.borderRadius,
            welcomeMessage: config.welcomeMessage || uiConfig.welcomeMessage,
            headerTitle: config.headerTitle || agentName,
          };
        }
      } catch (error) {
        console.error("Chatter AI: Failed to load chat widget", error);
        return;
      }

      // Add CSS styles to the document
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes chatter-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes chatter-fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes chatter-slideUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes chatter-slideDown {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }

        .chatter-ai-widget * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .chatter-ai-hidden {
          display: none !important;
        }

        .chatter-ai-floating-input {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9998;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: ${uiConfig.backgroundColor};
          backdrop-filter: blur(12px);
          border: 1px solid ${uiConfig.primaryColor}30;
          border-radius: 999px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
          cursor: text;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
          max-width: 500px;
          width: 90%;
        }

        .chatter-ai-floating-input:hover {
          transform: translateX(-50%) scale(1.02);
          box-shadow: 0 6px 32px rgba(0, 0, 0, 0.15);
          border-color: ${uiConfig.primaryColor}50;
        }

        .chatter-ai-floating-input input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          color: ${uiConfig.textColor};
          font-family: inherit;
        }

        .chatter-ai-floating-input input::placeholder {
          color: ${uiConfig.textColor};
          opacity: 0.65;
        }

        .chatter-ai-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 9998;
          animation: chatter-fadeIn 0.3s ease;
        }

        .chatter-ai-backdrop.closing {
          animation: chatter-fadeOut 0.3s ease forwards;
        }

        .chatter-ai-chat-window {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 600px;
          height: 600px;
          max-height: 70vh;
          z-index: 9999;
          background: ${uiConfig.backgroundColor};
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: chatter-slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .chatter-ai-chat-window.closing {
          animation: chatter-slideDown 0.3s cubic-bezier(0.6, 0, 0.8, 0.2) forwards;
        }

        .chatter-ai-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s ease;
        }

        .chatter-ai-close-btn:hover {
          background: ${uiConfig.primaryColor}15;
        }

        .chatter-ai-close-btn:active {
          transform: scale(0.95);
        }

        @media (max-width: 768px) {
          .chatter-ai-floating-input {
            max-width: calc(100% - 32px);
          }

          .chatter-ai-chat-window {
            width: 95%;
            height: 80vh;
            max-height: 600px;
            bottom: 80px;
          }
        }

        @media (max-width: 480px) {
          .chatter-ai-chat-window {
            width: 100%;
            height: 100%;
            max-height: 100vh;
            bottom: 0;
            left: 0;
            transform: none;
            border-radius: 0;
          }

          .chatter-ai-floating-input {
            bottom: 16px;
          }
        }
      `;
      document.head.appendChild(styleSheet);

      // Create floating input container
      const floatingInput = document.createElement("div");
      floatingInput.className = "chatter-ai-widget chatter-ai-floating-input";

      // Create search icon
      const searchIcon = document.createElement("div");
      searchIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${uiConfig.textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6; flex-shrink: 0;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;

      // Create input field
      const inputField = document.createElement("input");
      inputField.type = "text";
      inputField.placeholder = `Ask ${uiConfig.headerTitle} anything...`;
      inputField.setAttribute("aria-label", "Chat input");

      floatingInput.appendChild(searchIcon);
      floatingInput.appendChild(inputField);

      // Create backdrop
      const backdrop = document.createElement("div");
      backdrop.className = "chatter-ai-widget chatter-ai-backdrop chatter-ai-hidden";

      // Create chat window
      const chatWindow = document.createElement("div");
      chatWindow.className = "chatter-ai-widget chatter-ai-chat-window chatter-ai-hidden";

      // Create close button
      const closeButton = document.createElement("button");
      closeButton.className = "chatter-ai-close-btn";
      closeButton.setAttribute("aria-label", "Close chat");
      closeButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${uiConfig.textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      `;

      // Create iframe for chat
      const chatIframe = document.createElement("iframe");
      chatIframe.src = `${baseUrl}/chat/${slug}`;
      chatIframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
        border-radius: 20px;
      `;
      chatIframe.setAttribute("allow", "clipboard-read; clipboard-write");

      // Assemble chat window
      chatWindow.appendChild(closeButton);
      chatWindow.appendChild(chatIframe);

      // Add to document
      document.body.appendChild(floatingInput);
      document.body.appendChild(backdrop);
      document.body.appendChild(chatWindow);

      // Event handlers
      let isOpen = false;

      const openChat = () => {
        if (isOpen) return;
        isOpen = true;

        // Hide floating input
        floatingInput.classList.add("chatter-ai-hidden");

        // Show backdrop and chat window
        backdrop.classList.remove("chatter-ai-hidden", "closing");
        chatWindow.classList.remove("chatter-ai-hidden", "closing");

        // Prevent body scroll
        document.body.style.overflow = "hidden";
      };

      const closeChat = () => {
        if (!isOpen) return;

        // Add closing animations
        backdrop.classList.add("closing");
        chatWindow.classList.add("closing");

        setTimeout(() => {
          isOpen = false;

          // Hide elements
          backdrop.classList.add("chatter-ai-hidden");
          backdrop.classList.remove("closing");
          chatWindow.classList.add("chatter-ai-hidden");
          chatWindow.classList.remove("closing");

          // Show floating input
          floatingInput.classList.remove("chatter-ai-hidden");

          // Clear input field
          inputField.value = "";

          // Restore body scroll
          document.body.style.overflow = "";
        }, 300); // Match animation duration
      };

      // Click or focus on input to open chat
      inputField.addEventListener("click", openChat);
      inputField.addEventListener("focus", openChat);
      floatingInput.addEventListener("click", () => {
        inputField.focus();
        openChat();
      });

      // Allow typing in input (opens chat on first character)
      inputField.addEventListener("input", (e) => {
        if (e.target.value.length > 0 && !isOpen) {
          openChat();
        }
      });

      // Enter key to open chat
      inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          openChat();
        }
      });

      // Click close button to close chat
      closeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        closeChat();
      });

      // Click backdrop to close chat
      backdrop.addEventListener("click", closeChat);

      // ESC key to close chat
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
          closeChat();
        }
      });

      // Listen for messages from iframe
      window.addEventListener("message", (event) => {
        if (event.origin !== baseUrl) return;

        if (event.data.type === "chatter-close") {
          closeChat();
        }
      });
    }

    // Initialize widget when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createChatWidget);
    } else {
      createChatWidget();
    }
  }
})();
