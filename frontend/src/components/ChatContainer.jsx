import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

// Language mapping for MyMemory API
const languageMap = {
  English: "en",
  German: "de",
  Italian: "it",
  Malayalam: "ml",
  Hindi: "hi",
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [translatedMessages, setTranslatedMessages] = useState([]);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const translateMessages = async () => {
      if (!authUser || !authUser.preferredLanguage || messages.length === 0) return;

      const targetLang = languageMap[authUser.preferredLanguage] || "en"; // Default to English
      if (targetLang === "en") {
        setTranslatedMessages(messages);
        return;
      }

      const translatedMsgs = await Promise.all(
        messages.map(async (msg) => {
          try {
            const response = await axios.get("https://api.mymemory.translated.net/get", {
              params: {
                q: msg.text,
                langpair: `en|${targetLang}`,
              },
            });

            return { ...msg, text: response.data.responseData.translatedText };
          } catch (error) {
            console.error("Translation error:", error.message);
            return msg;
          }
        })
      );

      setTranslatedMessages(translatedMsgs);
    };

    translateMessages();
  }, [messages, authUser]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {translatedMessages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
