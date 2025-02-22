const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express();
const cors = require("cors");
const http = require('http'); 
require("dotenv").config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize socket.io with the server instance


app.use(cors({

  origin: ['http://localhost:5173',], 
}
));
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173", // Make sure this matches your frontend
  
  }
});


app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xsfs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // await client.connect();
    const taskCollection = client.db('JopTaskDB').collection('Addtask')
    const userCollection = client.db('JopTaskDB').collection('Alluser')
    taskCollection.watch().on("change", (change) => {
      // Emit the change event to all connected clients
      io.emit("taskChanged", change);
    });

    app.post('/jwt', async (req, res) => {
      const user = req.body; 
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.send({ token });
    });
    

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  console.log('Inside verifyToken middleware');
  const authorization = req.headers.authorization;

  // Check if the Authorization header exists
  if (!authorization) {
    return res.status(401).send({ message: 'Authorization header missing' });
  }


  const token = authorization.split(' ')[1];


  if (!token) {
    return res.status(401).send({ message: 'Token missing' });
  }


  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: 'Invalid or expired token', error });
    }


    req.decoded = decoded;
    next(); 
  });
};

app.post('/users', async(req,res)=>{
  const userData=req.body;
  const query = {email: userData.email}
  const existingUser = await userCollection.findOne(query)
  if(existingUser){
    return res.send({message:'user already existed', insertedId: null})
  }
  const result = await userCollection.insertOne(userData)
  res.send(result);
})

app.post("/addtask", async (req, res) => {
  try {
    const task = req.body;
    const result = await taskCollection.insertOne(task);
    res.status(201).send({ success: true, message: "Task added successfully", result });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.get('/tasks/:email', async (req, res) => {
  const email = req.params.email;
  const category = req.query.category;

  try {
    // Step 1: Get all tasks added by the specific user
    const userTasks = await taskCollection.find({ userEmail: email }).toArray();

    // Step 2: If no category is provided, return all tasks
    if (!category) {
      return res.send({ success: true, tasks: userTasks });
    }

    // Step 3: Filter tasks by category
    const filteredTasks = userTasks.filter(task => task.category === category);

    res.send({ success: true, tasks: filteredTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});


app.delete("/task/:id",verifyToken, async (req, res) => {
  const tasksId = req.params.id;
  const query =({ _id: new ObjectId(tasksId) });
  const result= await taskCollection.deleteOne(query)
  
    if (result.deletedCount === 1) {
      res.status(200).send({ success: true, message: "Task deleted" });
    } else {
      res.status(404).send({ success: false, message: "Task not found" });
    }
 
});


app.get("/task/:id", async (req, res) => {
  const { id } = req.params; // Access the task ID from the URL parameters

  try {
    const result = await taskCollection.findOne({ _id: new ObjectId(id) });
    
    if (result) {
      res.status(200).send({ success: true, task: result });
    } else {
      res.status(404).send({ success: false, message: "Task not found" });
    }
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).send({ success: false, message: "Error fetching task", error });
  }
});




// PATCH endpoint updated to handle an optional "position" field for ordering
app.patch('/update/task/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, taskType, estimatedTime, position } = req.body;

  const updateDoc = {
    $set: {
      title,
      description,
      category,
      taskType,
      estimatedTime,
      ...(position !== undefined ? { position } : {})
    },
  };

  const query = { _id: new ObjectId(id) };

  try {
    const result = await taskCollection.updateOne(query, updateDoc);
    if (result.matchedCount === 0) {
      return res.status(400).send({
        success: false,
        message: 'No task found.'
      });
    }
    return res.status(200).send({
      success: true,
      message: 'Task updated successfully.'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).send({
      success: false,
      message: 'Failed to update task. Please try again later.'
    });
  }
});




    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
 
    // await client.close();
  }
}
run().catch(console.dir);




















app.get('/', (req,res)=>{
    res.send('Job Task')
})
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
