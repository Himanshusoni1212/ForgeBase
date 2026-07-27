require("dotenv").config();

const app = require("./app");
const {connect} = require("./database/mongodb");

const PORT = process.env.PORT ||3000  ;

async function startServer() {
     try{
          await connect();

          app.listen(PORT,() =>{
               app.listen(`server is running on port ${PORT}`);
          });

     }catch(error) {
          console.error(error);
          process.exit(1);
     };

     
}

startServer();
