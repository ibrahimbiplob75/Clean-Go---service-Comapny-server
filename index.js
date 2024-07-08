const express=require("express")
const cors=require("cors")
const app=express();
require('dotenv').config();
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000;


//middleware
app.use(cors({
  origin:[
    "http://localhost:5173"
  ],
  credentials:true,
}));


const verified=async(req,res,next)=>{
  const token=req.cookies?.token
  
  if(!token){
    return res.status(401).send({ message: 'unauthorized access no token' })
  }
  jwt.verify(token,process.env.SECRET_TOKEN,(error,decode)=>{
    if(error){
      return res.status(401).send({ message: 'unauthorized access no token' })
    }
    // console.log(decode)
    req.user=decode
    next();
  })
  
}

//parser
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.ij6ptye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    await client.connect();
    const services=client.db("Clean-Co-BD").collection("services")
    const bookings=client.db("Clean-Co-BD").collection("bookings")

    app.post("/api/user/access-token",async(req,res)=>{
        const user=req.body
        console.log(user)
        const token=jwt.sign(user, process.env.SECRET_TOKEN , { expiresIn: '1h' })
        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:3600000,
        }).send({"Success":true})
    })


    // user/services/?sortField=details.pricing&sortOrder=asc&category=Home

    app.get("/api/user/services",verified,async(req,res)=>{
        const queryCategory=req.query?.category 
        const sortField=req.query?.sortField
        const sortOrder=req.query?.sortOrder

        let catQuery={}
        let sortObj={}

        if(queryCategory){
            catQuery.category=queryCategory
        }
        if(sortField && sortOrder){
            sortObj[sortField]=sortOrder
        }
        

        const result=await services.find(catQuery).sort(sortObj).toArray()
        res.send(result)
    })

    

    app.post("/api/user/create-booking",async(req,res)=>{
        const booking=req.body
        
        const result=await bookings.insertOne(booking)
        res.send(result)

    })

    app.delete("/api/user/cancel-booking/:id",async(req,res)=>{
        const id=req.params.id 
        const query={_id:new ObjectId(id)}
        const result=await bookings.deleteOne(query)
        res.send(result)
    })

    app.get("/api/user/bookings",verified,async(req,res)=>{
      const queryEmail=req.query?.email
      const tokenEmail=req.user?.email
      if(queryEmail!==tokenEmail){
        return res.status(403).send({"message":"Forbidden acccess"})
      }

      let query={}
      if(queryEmail){
        query.email=queryEmail
        
      }

      const result=await bookings.find(query).toArray()
      res.send(result)
      

    })
    
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Lets Clean the world!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)})