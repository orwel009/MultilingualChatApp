import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// GET /api/auth/analytics
export const getChatAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all messages sent or received by the user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).populate("senderId receiverId", "fullName email");

    // 2. Total number of messages
    const totalMessages = messages.length;

    // 3. Unique chat users + message count
    const chatPartners = new Set();
    const messageCountPerUser = {};

    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId.toString()
          ? msg.receiverId
          : msg.senderId;

      chatPartners.add(otherUser._id.toString());

      if (!messageCountPerUser[otherUser._id]) {
        messageCountPerUser[otherUser._id] = {
          userId: otherUser._id,
          fullName: otherUser.fullName,
          email: otherUser.email,
          messageCount: 0,
        };
      }

      messageCountPerUser[otherUser._id].messageCount += 1;
    });

    // 4. Sort most chatted users by message count
    const mostChatted = Object.values(messageCountPerUser).sort(
      (a, b) => b.messageCount - a.messageCount
    );

    res.status(200).json({
      totalMessages,
      totalChats: chatPartners.size,
      mostChattedFriends: mostChatted,
    });
  } catch (error) {
    console.error("Error in chat analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
