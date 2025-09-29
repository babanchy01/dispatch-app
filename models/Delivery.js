const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickup: { type: String, required: true },
  destination: { type: String, required: true },
  packageDetails: { type: String },
  status: { type: String, default: "pending" }, // pending, accepted, delivered
  rider: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
