// src/chatbot-widget.js

import React from "react";
import ReactDOM from "react-dom";
import ChatWidget from "./components/ChatWidget";
// import "./components/ChatWidget.css";  // Removed

// Default configuration
const defaultConfig = {
  container: "#healthcare-ai-container",
  chatUrl: "ws://localhost:8000/ws/chat",
  companyName: "Healthcare AI",
  companyLogo: "/logo.png",
  primaryColor: "#0066cc",
  showButton: true,
  showGreeting: true,
  greetingText: "Need help with your healthcare needs? Chat with our AI assistant!",
  introductionText: "Hello! I'm your healthcare assistant. How can I help you today?",
  inputPlaceholder: "Ask about appointments, departments, or services...",
};

// UMD export: exposes HealthcareAIWidget.init(...)
const HealthcareAIWidget = {
  init: (userConfig = {}) => {
    console.log("Initializing HealthcareAIWidget");
    
    // Merge user config with defaults
    const config = { ...defaultConfig, ...userConfig };
    
    console.log("Using configuration:", config);
    console.log("WebSocket URL:", config.chatUrl);
    
    // Validate WebSocket URL
    if (!config.chatUrl) {
      console.error("No WebSocket URL provided. Using default localhost URL.");
      config.chatUrl = "ws://localhost:8000/ws/chat";
    }
    
    // Ensure WebSocket URL has correct protocol
    if (!config.chatUrl.startsWith("ws://") && !config.chatUrl.startsWith("wss://")) {
      console.error("Invalid WebSocket URL protocol. URL must start with ws:// or wss://");
      return;
    }

    // Allow passing either a selector string or a DOM node
    const container =
      typeof config.container === "string"
        ? document.querySelector(config.container)
        : config.container;

    if (!container) {
      console.error(`Chatbot container not found: ${config.container}`);
      return;
    }

    // Create chat button if it doesn't exist and showButton is true
    if (config.showButton && !document.getElementById("healthcare-ai-button")) {
      // Create button
      const button = document.createElement("div");
      button.id = "healthcare-ai-button";
      button.className = "healthcare-ai-button";
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      document.body.appendChild(button);

      // Initialize openChatbot function and attach click handler
      window.openChatbot = function () {
        console.log("Opening chatbot...");
        const chatbot = document.getElementById("chatbot");
        const button = document.getElementById("healthcare-ai-button");
        const greeting = document.getElementById("elan-ai-greeting");

        if (chatbot) {
          chatbot.style.display = "block";
          console.log("Chatbot display set to block");
        }
        if (button) button.style.display = "none";
        if (greeting) greeting.style.display = "none";
      };

      // Explicitly attach click event to ensure it works on all devices
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Button clicked");
        window.openChatbot();
        return false;
      });

      // Auto-hide greeting after 8 seconds
      setTimeout(() => {
        const greeting = document.getElementById("elan-ai-greeting");
        if (greeting && !greeting.classList.contains("hidden")) {
          greeting.classList.add("hidden");
        }
      }, 8000);
    }

    // Render the React ChatWidget, passing the config as a prop
    ReactDOM.render(<ChatWidget config={config} />, container);
  },
};

export default HealthcareAIWidget;

// Make chatbot opener available globally
if (typeof window !== "undefined") {
  window.openChatbot = function () {
    const chatbot = document.getElementById("chatbot");
    const button = document.getElementById("healthcare-ai-button");
    const greeting = document.getElementById("elan-ai-greeting");

    if (chatbot) {
      // First make sure it's visible (display block) before removing hidden class
      chatbot.style.display = "block";
      // Use requestAnimationFrame to ensure display change takes effect first
      requestAnimationFrame(() => {
        chatbot.classList.remove("hidden");
      });
    }

    if (button) button.style.display = "none";
    if (greeting) greeting.style.display = "none";
  };
}



