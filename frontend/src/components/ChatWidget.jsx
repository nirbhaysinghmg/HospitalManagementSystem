// ChatWidget.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatSocket } from "../hooks/useChatSocket";
import defaultConfig from "../config";
import "./ChatWidget.css"; // Import CSS from the same directory

const ChatWidget = ({ config: userConfig }) => {
  // Merge config with defaults
  const cfg = { ...defaultConfig, ...userConfig };
  const allQuestions = cfg.suggestedQuestions || [];
  const triggerCount = Number.isInteger(cfg.showNumberOfQuestions)
    ? cfg.showNumberOfQuestions
    : 3;

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  
  // Suggestions state
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState(
    allQuestions.slice(0, triggerCount)
  );
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // WebSocket connection
  const { sendMessage, connectionStatus } = useChatSocket(
    setChatHistory, 
    setStreaming,
    cfg.chatUrl
  );

  // Seed the initial system message
  useEffect(() => {
    setChatHistory([{ role: "system", text: cfg.introductionText }]);
  }, [cfg.introductionText]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, suggestions]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);
  
  // Clear suggestions when streaming
  useEffect(() => {
    if (streaming) setSuggestions([]);
  }, [streaming]);
  
  // Show suggestions after assistant reply
  useEffect(() => {
    let timer;
    if (!streaming && chatHistory.some(m => m.role === "assistant")) {
      timer = setTimeout(() => {
        const remaining = allQuestions.filter(
          q => !usedQuestions.includes(q)
        );
        setSuggestions(remaining.slice(0, triggerCount));
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [streaming, chatHistory, usedQuestions, allQuestions, triggerCount]);

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  // Handle sending message
  const handleSendMessage = (text = input) => {
    if (!text.trim() || streaming) return;
    
    // Add user message to chat
    setChatHistory((prev) => [...prev, { role: "user", text }]);
    setStreaming(true);
    
    // Send message via WebSocket
    sendMessage({
      user_input: text
    });
    
    // Clear input field if it's from the input box
    if (text === input) {
      setInput("");
    }
  };
  
  // Handle suggestion click
  const handleSuggestion = (question) => {
    handleSendMessage(question);
    setUsedQuestions(prev => [...prev, question]);
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      id="chatbot"
      className={`chat-widget${fullScreen ? " fullscreen" : ""}`}
      style={{ "--primary-color": cfg.primaryColor }}
    >
      <div className="chat-wrapper">
        {/* Header */}
        <div className="chat-header">
          <img
            src={cfg.companyLogo}
            alt={`${cfg.companyName} logo`}
            className="chat-logo"
          />
          <h2 className="chat-title">{cfg.companyName} AI Assistant</h2>
          <div className="header-buttons">
            <button onClick={toggleFullScreen} className="fullscreen-button" aria-label="Toggle fullscreen">
              {fullScreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M21 16h-3a2 2 0 0 1-2 2v3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>
            <button
              onClick={() => window.closeChatbot?.()}
              className="close-button"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Connection status indicator */}
        {connectionStatus !== "CONNECTED" && (
          <div className={`connection-status ${connectionStatus.toLowerCase()}`}>
            {connectionStatus === "CONNECTING" ? "Connecting..." : "Disconnected - Please check your connection"}
          </div>
        )}

        {/* Chat Content */}
        <div className="chat-content">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-block ${msg.role} ${msg.isError ? "error" : ""}`}
            >
              {msg.role !== "system" && (
                <div className="message-label">
                  {msg.role === "user" ? "You" : `${cfg.companyName} AI Assistant`}
                </div>
              )}
              <div className="message">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          
          {/* Suggestions */}
          {!streaming && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((question, i) => (
                <button
                  key={i}
                  className="suggestion-button"
                  onClick={() => handleSuggestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          
          {streaming && (
            <div className="chat-block assistant">
              <div className="message-label">{cfg.companyName} AI Assistant</div>
              <div className="message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cfg.inputPlaceholder}
            rows="1"
            className="chat-input"
            disabled={streaming}
          />
          <button 
            onClick={() => handleSendMessage()}
            className="send-button"
            disabled={!input.trim() || streaming}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;

