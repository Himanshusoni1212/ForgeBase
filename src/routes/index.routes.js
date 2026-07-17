const express= require("express");

const {getHome,about,health,getUser,getUsers,createUser,updateUser,deleteUser} = require("../controllers/home.controller");

const router = express.Router();

router.get("/",getHome);

router.get ("/about",about);

router.get("/health",health);      

router.get("/users/:id",getUser);

router.get("/users",getUsers);

router.post("/users",createUser);

router.patch("/users/:id",updateUser);

router.delete("/users/:id",deleteUser);




module.exports = router;