const mongoose = require('mongoose');

// Schema for products in pending state
const productSchema = new mongoose.Schema({
    salesOrderId: Number,
    itemCode: String,
    itemName: String,
    unitPrice: Number,
    quantity: Number,
    totalPrice: Number,
    customerId: Number,
    date: Date
});

// Schema for products in approved and rejected states
const statusSchema = new mongoose.Schema({
    salesOrderNumber: String,
    customerName: String,
    customerId: Number,
    orderDate: Date,
    totalAmount: Number,
    isChecked: Boolean
});

// Main Store Schema
const StoreSchema = new mongoose.Schema({
    pending: [productSchema],    // Products pending approval
    approved: [statusSchema],    // Products approved
    rejected: [statusSchema]     // Products rejected
});

const StoreModel = mongoose.model('Store', StoreSchema);

module.exports = StoreModel;
