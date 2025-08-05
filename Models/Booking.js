 const mongoose = require('mongoose');
 const { Schema } = mongoose;

 const bookingSchema=new mongoose.Schema(
    {
    rideId: { type: Schema.Types.ObjectId, ref:'Ride',required:true},      
    userId:{ type: Schema.Types.ObjectId,ref:'User',required:true},
    
   // username: {type:String,required: true},
    
    bookingFor: {type:String, enum:["myself","other"],required: true  },
    
    name: {type:String},        
    email: {type:String},          
    count: {type:Number},         
    phoneNo: {type:Number  },
    rating:{type: Number,default:null},
    
    bookedForUserId: { type: Schema.Types.ObjectId, ref: 'User',default: null }, 
  
    bookingStatus:{type: String,enum:["pending","accepted","rejected"],default: "pending"}
});

module.exports=mongoose.model('Booking',bookingSchema);

