const Message=require("../Models/Message");
const Booking = require('../Models/Booking');
const Ride = require('../Models/Ride');
const User = require('../Models/User');
const Driver = require('../Models/Driver');
const Notification = require('../Models/Notification'); 

exports.getBookedRides =async(req,res)=>{
  try {
    const allBookedRides = await Booking.find({ $or:[{userId: req.userId},{bookedForUserId:req.userId }],bookingStatus:"accepted"}).populate("userId").populate("rideId");
            console.log("u",req.userId,"r",req.rideId)
   console.log(allBookedRides);

    const today=new Date().toISOString().slice(0,10)
    const upcomingRides=[];
    const pastRides=[];
    console.log(typeof(req.userId))
   // const selfFiltered =allBookedRides.filter(b=>console.log(typeof(b.userId._id.toString()))); 

    const selfFiltered =allBookedRides.filter(b=>b.bookingFor==="myself");
    // //&&  b.userId._id.toString() == req.userId); 
    console.log("myself-------",selfFiltered);

    const other= allBookedRides.filter(b=>b.bookingFor==="other")
    //&& b.bookedForUserId.toString()===req.userId);
      console.log("someone else------",other);
  
    selfFiltered.forEach(booking=>{     
      const rideDate=booking.rideId.date;
      if(rideDate>=today){ upcomingRides.push(booking);} 
      else{ pastRides.push(booking);} 
  });
    other.forEach(booking=>{  
      const rideDate=booking.rideId.date;
      if(rideDate>=today){ upcomingRides.push(booking);} 
      else{ pastRides.push(booking);}
  });

    res.render("booked", {upcomingRides,pastRides,isLoggedIn:req.isLoggedIn,username:req.username,userId:req.userId});
 
  }catch(err){
    console.error(err);
    res.status(500).send("fetching err");
  }
};

exports.getUserProfile=async (req,res)=>{
  try {
    const user=await User.findById(req.userId);
    let driver = null;
    if (user && user.isDriver) {driver = await Driver.findOne({ user: user._id }); }
    res.render('profile',{user,driver,isLoggedIn: req.isLoggedIn,username: req.username,userId: req.userId});
  } catch(err){
    console.error(err);
    res.status(500).send("profile err");
  }
};


exports.updateDriver=async (req,res)=>{
  const {driverId,carModel,licenseNumber,seatCapacity }=req.body;

  if(!carModel||!licenseNumber||!seatCapacity) {  return res.status(400).json({ error: "All fields are required" });}
 
    const licensePattern = /^[A-Za-z0-9\-]{5,15}$/;
    if(!licensePattern.test(licenseNumber)) { return res.status(400).json({ error: "Invalid car number" });}

    if(isNaN(seatCapacity)||seatCapacity<=0){ return res.status(400).json({ error: "Invalid seat number" }); }

  try {
    if(driverId){
    await Driver.findByIdAndUpdate(driverId,{carModel,licenseNumber,seatCapacity});
    res.redirect('/profile');
    }
    else{
     const user= User.findById(req.userId)
    if(!user){  res.status(500).send("User not found"); }
    else{
      await User.findByIdAndUpdate(req.userId,{isDriver:true});
      const newDriver = new Driver({ user:req.userId,carModel,licenseNumber,seatCapacity});
      await newDriver.save();
      res.redirect("/profile")
    }
    }
  } catch(err){ console.error(err);
    res.status(500).send("Update failed");
  }
};

exports.submitRating =async(req,res)=>{
  try {
    const {rating,bookingId}=req.body;
    const booking =await Booking.findById(bookingId);
    if(!booking)   return res.status(404).send("Booking not found");
   if(rating>5||rating<1){
     return res.status(404).send("Invalid rating count");
   }
    booking.rating =rating;
    await booking.save();
    res.send("Rating updated");
  } catch(err){
    console.error(err);
    res.status(500).send("Failed to update rating");
  }
};

// exports.showInbox = async (req, res) => {
//   const {rideId,receiverId,senderId}=req.params;
//   console.log("in show inbox");
//   console.log("Sender:", senderId);
//   console.log("Receiver:",receiverId);
//   console.log("Ride:", rideId);

//   try {
//     const messages=await Message.find({ rideId,$or:[{sender:senderId,receiver:receiverId },{sender:receiverId,receiver:senderId }] });
//     const roomId=[senderId,receiverId,rideId].sort().join("_");

//     res.render("inbox",{messages,rideId,receiverId,senderId,roomId, 
//       isLoggedIn: req.isLoggedIn, username: req.username  });
      
//   } catch(err){
//     console.error(err);
//     res.status(500).send("Error loading inbox");
//   }
// };

exports.showInbox = async (req, res) => {
  const { rideId, receiverId, senderId } = req.params;

  try {
    const messages = await Message.find({
      rideId,
      $or: [
        { sender:senderId, receiver:receiverId },
        { sender:receiverId, receiver: senderId }
      ]
    })

    const roomId = [senderId, receiverId, rideId].sort().join("_");

    res.render("inbox", {messages,rideId,receiverId, senderId, roomId,
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      userId: req.userId, hideNotification: true ,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading inbox");
  }
};

exports.notify = async (req, res) => {
  try {
    console.log("Fetching notifications for user:",req.userId);

    const notifications = await Notification.find({
      user: req.userId,
      isRead: false
    }).populate("rideId") 

    console.log("Notifications found:", notifications.length);

    res.render("notifications", {
      notifications,
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      userId: req.userId,
      hideNotification: true
    });
  } catch (err) {
    console.error("Error in notify controller:", err);
    res.status(500).send("notify err");
  }
};

// exports.notify=async (req,res)=>{
//   try {
//    const notifications = await Notification.find({ user:req.userId,isRead:false })
// res.render('notifications',{notifications,isLoggedIn: req.isLoggedIn,username: req.username,userId: req.userId, hideNotification: true  });

// } catch(err){
//     console.error(err);
//     res.status(500).send("notify err");
//   }
// };

exports.read=async (req,res) => {
  const n_Id=req.params.id;        
  const redirectTo=req.query.to;       
  try { 
    await Notification.findByIdAndUpdate(n_Id, {isRead:true, readAt:new Date()});
    res.redirect(redirectTo);                   
  } catch(err){res.status(500).send("Error");
 }
};

// exports.getChat= async(req,res)=>{
//     const {roomId}=req.params;
//   const parts =roomId.split('_');
//   if (parts.length !==3) {return res.status(400).send('Invalid roomId');}

//   const [rideId,sender,receiver]=parts;

//   res.redirect(`/inbox/${rideId}/${sender}/${receiver}`);
// };

exports.getChat = async (req, res) => {
  const { roomId } = req.params;
  const parts = roomId.split('_');
  if (parts.length !== 3) return res.status(400).send('Invalid roomId');

  const [id1, id2, rideId] = parts;
  const currentUserId = req.userId;

  let senderId, receiverId;
  if (currentUserId === id1) {
    senderId = id1;
    receiverId = id2;
  } else if (currentUserId === id2) {
    senderId = id2;
    receiverId = id1;
  } else {
    return res.status(403).send("You are not part of this chat");
  }

  res.redirect(`/inbox/${rideId}/${receiverId}/${senderId}`);
};
