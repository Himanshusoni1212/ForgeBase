function getHome(req,res) {
    res.send("welcome to forgeboss");
}


function about(req,res) {
    res.send("this is about ForgeBase");
};

function health(req,res) {
    res.json({status:"ok"});

};

function getUser(req,res) {
    res.json(req.params);
}

function getUsers(req,res) {
    res.json(req.query);
}

function createUser(req,res) {
   
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({
            message:"name is required."
        });
    }

    console.log(req.body);

   return res.status(201).json({
        message:"user created successfully",
        data:req.body
    });
    
}

function updateUser(req,res) {
    res.json ({
        message:"user updated",
        id:req.params.id,
        data:req.body
    });
}

function deleteUser(req,res) {
    res.json({
        message:"deleted",
        id:req.params.id
    });
}




module.exports={
    getHome,
    about,
    health,
    getUser,
    getUsers,
    createUser,
    updateUser,
    deleteUser

};