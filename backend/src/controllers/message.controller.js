import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

import axios from "axios";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const languageMap = {
  English: "en",
  German: "de",
  Italian: "it",
  Malayalam: "ml",
  Hindi: "hi",
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Fetch sender's preferred language
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    console.log("Sender's preferred language:", sender.preferredLanguage);
    console.log("Original message:", text);

    let translatedText = text;
    const sourceLang = languageMap[sender.preferredLanguage] || "en"; // Default to English

    // If the sender's language is not English, translate it to English
    if (sourceLang !== "en") {
      try {
        const response = await axios.get("https://api.mymemory.translated.net/get", {
          params: {
            q: text,
            langpair: `${sourceLang}|en`, // Force correct source & target language
            onlyprivate: 1, // Ignore crowdsourced translations
            mt: 1, // Force machine translation
          },
        });

        if (response.data?.responseData?.translatedText) {
          translatedText = response.data.responseData.translatedText.trim();
          console.log("Translated message (English):", translatedText);
        } else {
          console.warn("Translation API did not return expected response.");
        }
      } catch (translateError) {
        console.error("Translation error:", translateError.message);
      }
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    console.log("Final stored message (English):", translatedText);

    // Store the translated message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: translatedText,
      image: imageUrl,
    });

    await newMessage.save();

    // Emit the new message via WebSocket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};