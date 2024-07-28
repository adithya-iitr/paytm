const express = require("express");
const router = express.Router();
const { User , Account } = require('../db.js');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const secret = require('../config.js');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware.js');
const signupSchema = zod.object({
    firstName: zod.string().max(50),
    lastName: zod.string().max(50),
    username: zod.string().email(),
    password: zod.string().min(6)
})
const singinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string().min(6)
})
const updateSchema = zod.object({
    firstName: zod.string().max(50).optional(),
    lastName: zod.string().max(50).optional(),
    password: zod.string().min(6).optional()
})
router.post('/signup', async (req, res) => {
    const { firstName, lastName, username, password } = req.body;
    const user = await User.findOne({ username: username });
    if (user) {
        return res.status(411).json({ message: "User already exists" });
    } else {
        const parsed = signupSchema.safeParse({ firstName, lastName, username, password });
        if (!parsed.success) {
            return res.status(411).json({ message: "Invalid inputs" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        try {
            const newUser = await User.create({ firstName, lastName, username, password: hashedPassword });
            const userId = newUser._id;
            const token = jwt.sign({ userId }, secret.JWT_SECRET);
            await Account.create({ userId, balance: Math.random() * 10000 });
            return res.status(200).json({ message: "User created successfully", token: token });
        } catch (err) {
            return res.status(500).json({ message: "Error creating user" });
        }
    }
})
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    const parsed = singinSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: "Invalid inputs" });
    } else {
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(411).json({ message: "User does not exist" });
        } else {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(411).json({ message: "Invalid credentials" });
            } else {
                try {
                    const userId = user._id;
                    const token = jwt.sign({ userId }, secret.JWT_SECRET);
                    return res.status(200).json({ token: token });
                } catch (err) {
                    return res.status(500).json({ message: "Error signing in" });
                }
            }
        }
    }
})
router.put('/', authMiddleware, async(req, res) => {
    const {success}=updateSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({message:"Error while updating information"});
    }else{
        const userId=req.userId;
        const {firstName,lastName,password}=req.body;
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        await User.updateOne({_id:userId},{firstName: firstName, lastName:lastName, password:hashedPassword});
        res.status(200).json({message:"Updated successfully"});
    }
})
router.get('/bulk', authMiddleware, async(req, res) => {
    const filter=req.query.filter||"";
    const regex=new RegExp(filter,"i");
    const users=await User.find({
        $or:[
            {firstName:{$regex:regex}},
            {lastName:{$regex:regex}}
        ]
    });
    res.status(200).json({users:users.map(user=>({username:user.username, firstName:user.firstName,lastName:user.lastName,_id:user._id}))});
})
module.exports = router;