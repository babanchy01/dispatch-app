const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;
const SECRET_KEY = "supersecretkey"; // ⚠️ change in production!

app.use(express.json());

// ✅ Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://dispatchUser:Dispatch123@cluster0.ycdin1s.mongodb.net/dispatchDB?retryWrites=true&w=majority&appName=Cluster0")
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

/* ================================
   Schemas & Models
================================= */

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Delivery schema
const deliverySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pickup: { type: String, required: true },
  destination: { type: String, required: true },
  packageDetails: { type: String, required: true },
  status: { type: String, default: "pending" },
  rider: { type: String, default: null },
});

const Delivery = mongoose.model("Delivery", deliverySchema);

/* ================================
   Authentication Middleware
================================= */
function authenticate(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

/* ================================
   Routes
================================= */

// Register user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY);
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Book a delivery (protected)
app.post("/deliveries", authenticate, async (req, res) => {
  const { pickup, destination, packageDetails } = req.body;
  try {
    const delivery = new Delivery({
      userId: req.user.id,
      pickup,
      destination,
      packageDetails,
    });
    await delivery.save();

    res.json({ message: "Delivery booked successfully", delivery });
  } catch (err) {
    res.status(500).json({ message: "Error booking delivery", error: err.message });
  }
});

// Get all deliveries for logged-in user (protected)
app.get("/deliveries", authenticate, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ userId: req.user.id });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: "Error fetching deliveries", error: err.message });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to Dispatch App API 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
