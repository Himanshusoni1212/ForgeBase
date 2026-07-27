function errorMiddleware(err,req,res,next) {
    console.log(err);

    res.status(500).json({
        success:false,
        message:err.message
    });
    
}

module.exports = errorMiddleware;