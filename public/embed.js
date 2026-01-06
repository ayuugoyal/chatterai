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
          "ChatterCraft: Missing data-slug attribute on script tag"
        );
        return;
      }

      // Determine the base URL
      const scriptSrc = scriptTag.src;
      const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf("/"));

      // Fetch agent details and UI config
      let agentId = null;
      let uiConfig = {
        primaryColor: "#0070f3",
        secondaryColor: "#f5f5f5",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        buttonPosition: "bottom-right",
        buttonSize: 60,
        widgetWidth: 380,
        widgetHeight: 600,
        borderRadius: 12,
        buttonIcon: "message",
      };

      try {
        // First fetch agent by slug to get the ID
        const agentResponse = await fetch(`${baseUrl}/api/agents/slug/${slug}`);
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          agentId = agentData.id;

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
              buttonPosition: config.buttonPosition || uiConfig.buttonPosition,
              buttonSize: config.buttonSize || uiConfig.buttonSize,
              widgetWidth: config.widgetWidth || uiConfig.widgetWidth,
              widgetHeight: config.widgetHeight || uiConfig.widgetHeight,
              borderRadius: config.borderRadius || uiConfig.borderRadius,
              buttonIcon: config.buttonIcon || uiConfig.buttonIcon,
            };
          }
        }
      } catch (error) {
        console.error("ChatterCraft: Failed to fetch UI config, using defaults", error);
      }

      // Helper function to convert hex to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 112, b: 243 }; // Default blue
      };

      // Get icon SVG based on buttonIcon config
      const getIconSVG = (iconType) => {
        const icons = {
          message: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
          chat: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
          help: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          support: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/></svg>',
        };
        return icons[iconType] || icons.message;
      };

      // Parse button position
      const [vertical, horizontal] = uiConfig.buttonPosition.split("-");
      const buttonPositionStyle = `
        ${vertical}: 20px;
        ${horizontal}: 20px;
      `;

      // Parse container position
      const containerPositionStyle = vertical === "bottom"
        ? `${vertical}: ${uiConfig.buttonSize + 30}px;`
        : `${vertical}: ${uiConfig.buttonSize + 30}px;`;
      const containerHorizontalStyle = `${horizontal}: 20px;`;

      // Add CSS animations to the document
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
          100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(10px) scale(0.98); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `;
      document.head.appendChild(styleSheet);

      // Create button
      const button = document.createElement("button");
      button.id = "chattercraft-widget-button";
      button.innerHTML = "";
      button.style.cssText = `
        position: fixed;
        ${buttonPositionStyle}
        width: ${uiConfig.buttonSize}px;
        height: ${uiConfig.buttonSize}px;
        border-radius: 50%;
        background-color: ${uiConfig.primaryColor};
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9090;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        animation: pulse 2s infinite ease-in-out;
      `;

      // Create loading spinner
      const spinner = document.createElement("div");
      spinner.style.cssText = `
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s infinite linear;
        position: absolute;
        display: none;
      `;
      button.appendChild(spinner);

      // Create iframe container
      const container = document.createElement("div");
      container.id = "chattercraft-widget-container";
      container.style.cssText = `
        position: fixed;
        ${containerPositionStyle}
        ${containerHorizontalStyle}
        width: ${uiConfig.widgetWidth}px;
        height: ${uiConfig.widgetHeight}px;
        max-height: 70vh;
        border-radius: ${uiConfig.borderRadius}px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: none;
        opacity: 0;
        transform: translateY(10px) scale(0.98);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;

      // Create iframe
      const iframe = document.createElement("iframe");

      // Create loading overlay for iframe
      const loadingOverlay = document.createElement("div");
      loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${uiConfig.backgroundColor};
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: opacity 0.5s ease;
      `;

      const loadingSpinner = document.createElement("div");
      const rgbColor = hexToRgb(uiConfig.primaryColor);
      loadingSpinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.2);
        border-radius: 50%;
        border-top-color: ${uiConfig.primaryColor};
        animation: spin 1s infinite linear;
      `;

      loadingOverlay.appendChild(loadingSpinner);
      container.appendChild(loadingOverlay);

      iframe.src = `${baseUrl}/chat/${slug}`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        opacity: 0;
        transition: opacity 0.5s ease;
      `;

      // Hide loading overlay when iframe is loaded
      iframe.onload = () => {
        iframe.style.opacity = "1";
        setTimeout(() => {
          loadingOverlay.style.opacity = "0";
          setTimeout(() => {
            loadingOverlay.style.display = "none";
          }, 500);
        }, 300);
      };

      container.appendChild(iframe);
      document.body.appendChild(button);
      document.body.appendChild(container);

      // Button hover effects
      button.addEventListener("mouseenter", () => {
        button.style.animation = "none";
        button.style.transform = "scale(1.1)";
        button.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
        // Restart the pulse animation after a short delay
        setTimeout(() => {
          button.style.animation = "pulse 2s infinite ease-in-out";
        }, 300);
      });

      // Toggle chat widget with animations
      let isOpen = false;
      button.addEventListener("click", () => {
        if (!isOpen) {
          // Show loading spinner in button
          spinner.style.display = "block";

          // Open chat container with animation
          container.style.display = "block";
          setTimeout(() => {
            container.style.opacity = "1";
            container.style.transform = "translateY(0) scale(1)";

            // Hide spinner after animation completes
            setTimeout(() => {
              spinner.style.display = "none";

              // Change button appearance when open (darker shade of primary color)
              button.style.backgroundColor = "#f44336";
              button.style.transform = "rotate(45deg)";
            }, 300);
          }, 50);
        } else {
          // Close animation
          container.style.opacity = "0";
          container.style.transform = "translateY(10px) scale(0.98)";

          // Change button back to original state with animation
          button.style.backgroundColor = uiConfig.primaryColor;
          button.style.transform = "rotate(0deg)";

          setTimeout(() => {
            container.style.display = "none";

            // Restart the pulse animation
            setTimeout(() => {
              button.style.animation = "pulse 2s infinite ease-in-out";
            }, 300);
          }, 300);
        }

        isOpen = !isOpen;
      });

      // Add close button to container with animation
      const closeButton = document.createElement("button");
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.1);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: all 0.2s ease;
        opacity: 0.7;
      `;

      closeButton.addEventListener("mouseenter", () => {
        closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        closeButton.style.opacity = "1";
        closeButton.style.transform = "scale(1.1)";
      });

      closeButton.addEventListener("mouseleave", () => {
        closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        closeButton.style.opacity = "0.7";
        closeButton.style.transform = "scale(1)";
      });

      closeButton.addEventListener("click", (e) => {
        e.stopPropagation();

        // Add closing animation
        container.style.animation = "fadeOut 0.3s forwards";

        // Reset button state
        button.style.backgroundColor = uiConfig.primaryColor;
        button.style.transform = "rotate(0deg)";

        setTimeout(() => {
          container.style.display = "none";
          container.style.animation = "";
          isOpen = false;

          // Restart the pulse animation
          setTimeout(() => {
            button.style.animation = "pulse 2s infinite ease-in-out";
          }, 300);
        }, 300);
      });

      container.appendChild(closeButton);

      // Handle messages from iframe
      window.addEventListener("message", (event) => {
        // Check if the message is from our iframe
        if (event.data && event.data.type === "chattercraft-widget") {
          // Handle different message types
          switch (event.data.action) {
            case "close":
              // Trigger close animation
              closeButton.click();
              break;
            case "bounce":
              // Add a bounce animation to the button
              button.style.animation = "bounce 0.5s ease";
              setTimeout(() => {
                button.style.animation = "pulse 2s infinite ease-in-out";
              }, 500);
              break;
            // Add more actions as needed
          }
        }
      });
    }

    // Initialize widget when DOM is loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createChatWidget);
    } else {
      createChatWidget();
    }
  }
})();
