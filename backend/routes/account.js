const express = require("express");
const authMiddleware = require("../middleware");
const { User, Account } = require('../db.js');
const router = express.Router();
const mongoose=require("mongoose");
router.get("/balance", authMiddleware, async (req, res) => {
    const user = await User.findOne({
        _id: req.userId
    })
    if (!user) {
        res.json({
            message: "User not found"
        })
    }
    const account = await Account.findOne({
        userId: req.userId
    })
    res.json({
        balance: account.balance
    })
})
router.post("/transfer", authMiddleware, async (req, res) => {
    // const senderId = req.userId;
    // const receiverId = req.body.to;
    // const amount = req.body.amount;
    // const sender = await Account.findOne({
    //     userId: senderId
    // })
    // const receiver = await Account.findOne({
    //     userId: receiverId
    // })
    // if (!receiver) {
    //     return res.status(400).json({
    //         message: "Invalid Account"
    //     })
    // }
    // if (amount > sender.balance) {
    //     return res.status(400).json({
    //         message: "Insufficient Balance"
    //     })
    // } else {
    //     await Account.updateOne({ userId: senderId }, { $inc: { balance: -amount } })
    //     await Account.updateOne({ userId: receiverId }, { $inc: { balance: amount } })
    //     return res.json({
    //         message: "Transfer Successful"
    //     })
    // }
    const session=await mongoose.startSession();
    session.startTransaction();
    const {amount,to}=req.body;
    const fromAccount=await Account.findOne({
        userId:req.userId
    }).session(session)
    if(!fromAccount||fromAccount.balance<amount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Insufficient balance"
        })
    }
    const toAccount=await Account.findOne({
        userId:to
    }).session(session)
    if(!toAccount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Invalid account"
        })
    }
    await Account.updateOne({
        userId:req.userId
    },{
        $inc:{
            balance:-amount
        }
    }).session(session)
    await Account.updateOne({
        userId:to
    },{
        $inc:{
            balance:amount
        }
    }).session(session)
    await session.commitTransaction();
    res.json({
        message:"Transfer successful"
    })
})
module.exports = router;