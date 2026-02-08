import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shippingAddress: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      line1: { type: String, default: '' },
      area: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    pricing: {
      subtotal: { type: Number, default: 0 },
      deliveryDistanceKm: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      perKmRate: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: String,
        qty: Number,
        price: Number
      }
    ],
    amountRupees: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, enum: ["UPI"], default: "UPI" },
    upiId: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    adminRemark: { type: String, default: "", maxlength: 240 },
    rejectReason: { type: String, default: "", maxlength: 240 },
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "REJECTED", "CANCELLED"], default: "PENDING" }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
