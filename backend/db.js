const mongoose=require("mongoose");
mongoose.connect("mongodb://localhost:27017/paytm");
const userSchema=mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        maxLength:50,
        trim:true
    },
    lastName:{
        type:String,
        required:false,
        maxLength:50,
        trim:true
    },
    username:{
        type:String,
        required:true,
        maxLength:50,
        trim:true,
        unique:true,
        minLength:3,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        minLength:6,
    },
})
const User=mongoose.model("User",userSchema);
const accountSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    balance:{
        type:Number,
        required:true
    }
})
const Account=mongoose.model("Account", accountSchema);
module.exports={
    User,
    Account
};