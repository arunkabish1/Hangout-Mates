import React, { useEffect, useState, useRef } from "react";

const ChatBox = ({ socket, userName, showChat, setShowChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ name, message }) => {
      setMessages((prev) => [...prev, { name, message }]);
    };

    socket.on("chat-message", handleMessage);

    return () => socket.off("chat-message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    // Emit message to server
    socket.emit("chat-message", { name: userName, message: newMessage });
    // Add to local state
    setMessages((prev) => [...prev, { name: userName, message: newMessage }]);
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!showChat) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-64 bg-gray-800 shadow-lg border-l border-gray-700 p-4 z-20 flex flex-col animate-slideIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Chat</h2>
        <button onClick={() => setShowChat(false)} className="text-gray-300">
          ✖
        </button>
      </div>

      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded-md ${
              msg.name === userName
                ? "bg-blue-600 text-white ml-auto max-w-[80%]"
                : "bg-gray-700 text-gray-100 max-w-[80%]"
            }`}
          >
            <strong>{msg.name}:</strong> {msg.message}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-grow p-2 rounded-md bg-gray-700 text-white outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
