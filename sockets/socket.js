const Message = require("../Models/Message");
const User = require("../Models/User");
const Notification=require("../Models/Notification")
const userSockets = {};

module.exports=(io)=>{
  io.on("connection",(socket)=>{
    console.log(`Socket connected: ${socket.id}`);

    socket.on("registerUser",(userId)=>{
      if(userId){
        socket.userId=userId;
        userSockets[userId] = socket;
        console.log(`Socket ${socket.id} registered for user ${userId}`);
      }
    });

    socket.on("joinRoom",(roomId)=>{
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

//     socket.on("sendMessage", async (data) => {
//      console.log("entring socket ")
//     const { text, sender, receiver, rideId } = data;
//     if (!text || !sender || !receiver || !rideId) {
//         console.log("sendMessage missing fields:", data);
//         return;
//     }
//     const roomId = [sender, receiver, rideId].sort().join("_");
//     try {
//         const message = await Message.create({ text, sender, receiver, rideId });

//         io.to(roomId).emit("newMessage", message);
        
//         const senderUser  = await User.findById(sender).select("username");
//         const senderName = senderUser ?.username || "Someone";

//          if (receiver!== sender) {
//       await Notification.create({
//         user: receiver,
//         message: `New message from ${senderName}`,
//         rideId,
//         roomId,
//         isRead: false,
//       });
//     }

//      await Notification.create({
//             user: receiver, message: `New message from ${senderName}`,rideId,roomId,isRead: false,});
//           const receiverSocket = userSockets[receiver];
//           if (receiverSocket) {
//             console.log("Sending notification to receiver:", receiver);
//             receiverSocket.emit("newChatNotification", {
//               message: `New message from ${senderName}`,
//               rideId,
//               roomId,
//               sender,
//               receiver,
//             });
//           } else {
//             console.log("Receiver socket not found for user:", receiver);
//           }

//     } catch (err) {
//         console.error("Message not stored or error in flow:", err);
//     }
// });
    const Booking = require("../Models/Booking");
const Message = require("../Models/Message");
const Notification = require("../Models/Notification");
const User = require("../Models/User");

socket.on("sendMessage", async (data) => {
  console.log("entring socket ");
  const { text, sender, receiver, rideId } = data;

  if (!text || !sender || !receiver || !rideId) {
    console.log("sendMessage missing fields:", data);
    return;
  }

  const roomId = [sender, receiver, rideId].sort().join("_");

  try {
   const booking = await Booking.findOne({ rideId, passengerId: sender });

if (!booking) {
} else if (["pending", "rejected"].includes(booking.status)) {
  const alreadySent = await Message.findOne({ rideId, sender, receiver });
  if (alreadySent) {
    console.log("Only one message allowed until booking is accepted.");
    return; 
  }
}

    const message = await Message.create({ text, sender, receiver, rideId });

    io.to(roomId).emit("newMessage", message);

    const senderUser = await User.findById(sender).select("username");
    const senderName = senderUser?.username || "Someone";

    await Notification.create({
      user: receiver,
      message: `New message from ${senderName}: "${text}"`,
      rideId,
      roomId,
      type:"message",
      isRead: false,
      createdAt: new Date(),
    });

    const receiverSocket = userSockets[receiver];
    if (receiverSocket) {
      console.log("Sending notification to receiver:", receiver);
      receiverSocket.emit("newChatNotification", {
        message: `New message from ${senderName}: "${text}"`,
        rideId,
        roomId,
        sender,
        receiver,
      });
    } else {
      console.log("Receiver offline — notification stored for later.");
    }
  } catch (err) {
    console.error("Message not stored or error in flow:", err);
  }
});


    socket.on("disconnect",()=>{
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && userSockets[socket.userId] === socket) {
        delete userSockets[socket.userId];
      }
    });
  });

  io.userSockets = userSockets;
};
