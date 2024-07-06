const express=require("express")
const cors=require("cors")
const app=express();
require('dotenv').config();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000;


//middleware
app.use(cors());
//parser
app.use(express.json());

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

    app.get("/api/user/access-token",async(req,res)=>{
        const user=req.body
        const token=jwt.sign(user,process.env.SECRET_TOKEN,{expiresIn:60*60})
        console.log(token)
    })

    app.get("/api/user/services",async(req,res)=>{
        const result=await services.find().toArray()
        res.send(result)
    })

    app.post("/api/user/create-booking",async(req,res)=>{
        const booking=req.body
        
        const result=await bookings.insertOne(booking)
        res.send(result)

//         {
//     "booked-name":"Md Ibrahim",
//     "booked-email":"ibrahimbiplob75@gmail.com",
//     "booked-phone":"015111111",
//     "booked-service":"House clean",
//     "booked-price":"2000",
//     "booked-date":"21-07-24"
// }
    })

    app.delete("/api/user/cancel-booking/:id",async(req,res)=>{
        const id=req.params.id 
        const query={_id:new ObjectId(id)}
        const result=await bookings.deleteOne(query)
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