const jwt=require("jsonwebtoken");
const secret=require("./config.js");
async function authMiddleware(req,res,next){
    const authToken = req.headers.authorization;
    const token=authToken.split(" ")[1];
    if(token){
        try {
            const userInfo=await jwt.verify(token,secret.JWT_SECRET);
            req.userId=userInfo.userId;
            next();
        } catch (error) {
            console.log(error);
            res.status(403).json({message:"Invalid token"});
        }
    }
    else{
        res.status(403).json({message:"No token provided"});
    }
}
module.exports = authMiddleware;