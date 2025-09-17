// server.js
import express from "express";

const app = express();
const PORT = 5000; // you can change this

// Middleware
app.use(express.json()); // parse JSON bodies

// Example route
app.get("/", (req, res) => {
  res.send("Hello, Express.js Server is running 🚀");
});

// Example POST route
app.post("/data", (req, res) => {
  const { name } = req.body;
  res.json({ message: `Hello, ${name}! Data received.` });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
