

const salesOrderLineModel = require('../models/salesOrderLine');
const StoreModel = require('../models/storeModel');


const testRoute =async(req,res)=>{
        res.send("we are in winit homepage")
    }


const createProductRoute =  async (req, res) => {
   
        try {
            console.log('Received request:', req.body);
            const { customerId, salesOrderId, itemCode, itemName, unitPrice, quantity, totalPrice } = req.body;
            
            
            const existingProduct = await salesOrderLineModel.findOne({ itemCode });
            if (existingProduct) {
                return res.status(400).json({ message: 'Product with this item code already exists' });
            }
    
            
            await salesOrderLineModel.create({ 
                customerId,
                salesOrderId,
                itemCode,
                itemName,
                unitPrice: parseFloat(unitPrice.toFixed(2)), 
                quantity: parseFloat(quantity.toFixed(2)),   
                totalPrice: parseFloat(totalPrice.toFixed(2))
            });
            console.log('Product created successfully');
            res.status(201).send(`Product created successfully with item code ${itemCode}`);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Internal Server Error: Failed to create product', error: error.message });
        }
    }


const deleteProductRoute = async (req, res) => {
    try {
        const { itemCode } = req.params; 

        
        const result = await salesOrderLineModel.findOneAndDelete({ itemCode });

        if (result) {
            
            res.status(200).json({ message: `Product with item code ${itemCode} deleted successfully` });
        } else {
            
            res.status(404).json({ message: `Product with item code ${itemCode} not found` });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to delete product', error: error.message });
    }
};
    


const getProductsRoute = async (req, res) => {
    try {
        const { customerId } = req.params;

    
        const products = await salesOrderLineModel.find({ customerId });

        if (products.length > 0) {
            
            res.status(200).json(products);
        } else {
        
            res.status(404).json({ message: `No products found for customer ID ${customerId}` });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to fetch products', error: error.message });
    }
};



const postProductsToPendingTab = async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ message: 'Invalid input: products should be an array' });
        }

        // Add current date to each product
        const productsWithDate = products.map(product => ({
            ...product,
            date: new Date()
        }));

        let store = await StoreModel.findOne();

        if (!store) {
            store = new StoreModel({
                pending: productsWithDate,
                approved: [],
                rejected: []
            });
        } else {
            const existingItemCodes = new Set(store.pending.map(p => p.itemCode));
            const uniqueProducts = productsWithDate.filter(p => !existingItemCodes.has(p.itemCode));

            store.pending.push(...uniqueProducts);
        }

        // Save the updated store document  
        await store.save();

        // Create a summary of products by customerId
        const customerSummary = {};

        productsWithDate.forEach(product => {
            const { customerId, totalPrice, date } = product;
            if (!customerSummary[customerId]) {
                customerSummary[customerId] = {
                    customerId: customerId,
                    orderDate: date,
                    totalAmount: 0
                };
            }
            customerSummary[customerId].totalAmount += totalPrice;
            customerSummary[customerId].orderDate = date; // Update with the latest date
        });

        // Convert the summary object to an array
        const summaryArray = Object.values(customerSummary);

        // Respond with success message and the customer summary
        res.status(200).json({
            message: 'Products added to pending tab successfully',
            customerSummary: summaryArray
        });
    } catch (error) {
        console.error('Error posting products to pending tab:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to add products to pending tab', error: error.message });
    }
};


const postProductsToApprovedTab = async (req, res) => {
    try {
        const products = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ message: 'Invalid input: products should be an array' });
        }

        // Extract the IDs of the products to move
        const productIds = products.map(p => p._id);

        // Find and update the document
        const result = await StoreModel.findOneAndUpdate(
            {}, // Query to find the document (e.g., by ID or other criteria)
            {
                $push: { approved: { $each: products } }, // Add products to approved tab
                $pull: { pending: { _id: { $in: productIds } } } // Remove products from pending tab
            },
            { new: true } // Return the updated document
        );

        if (!result) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.status(200).json({ message: 'Products moved to approved tab successfully', result });
    } catch (error) {
        console.error('Error moving products to approved tab:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to move products to approved tab', error: error.message });
    }
};



const postToRejectedTab = async (req, res) => {
    try {
        // Extract itemCode from path parameter
        const { itemCode } = req.params;

        // Find the store document
        const store = await StoreModel.findOne();
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Find the product in the pending tab
        const index = store.pending.findIndex(p => p.itemCode === itemCode);
        if (index === -1) {
            return res.status(404).json({ message: 'Product not found in pending tab' });
        }

        // Remove the product from pending tab
        const [product] = store.pending.splice(index, 1);

        // Add the product to rejected tab
        store.rejected.push(product);

        // Save the updated store document
        await store.save();

        res.status(200).json({ message: `Product with item code ${itemCode} moved to rejected tab successfully` });
    } catch (error) {
        console.error('Error moving product to rejected tab:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to move product to rejected tab', error: error.message });
    }
};


const getTotalCartPrice = async (req, res) => {
    try {
        // Find the store document
        const store = await StoreModel.findOne();

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Calculate the total amount from the pending tab
        const totalAmount = store.pending.reduce((acc, product) => acc + (product.totalPrice || 0), 0);

        // Send the total amount in the response
        res.status(200).json({ totalAmount });
    } catch (error) {
        console.error('Error getting total cart price:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to get total cart price', error: error.message });
    }
};


const getTableData = async (req, res) => {
    try {
        // Retrieve the store document
        const store = await StoreModel.findOne();

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Create a summary of products by customerId
        const customerSummary = {};

        store.pending.forEach(product => {
            const { customerId, totalPrice, date } = product;

            if (!customerSummary[customerId]) {
                customerSummary[customerId] = {
                    customerId: customerId,
                    orderDate: date,
                    totalAmount: 0
                };
            }

            customerSummary[customerId].totalAmount += totalPrice;
            customerSummary[customerId].orderDate = date; // Update with the latest date
        });

        // Convert the summary object to an array
        const summaryArray = Object.values(customerSummary);

        // Respond with the customer summary data
        res.status(200).json({ customerSummary: summaryArray });
    } catch (error) {
        console.error('Error getting table data:', error);
        res.status(500).json({ message: 'Internal Server Error: Failed to get table data', error: error.message });
    }
};


const delteDataAfterPostToApprovedTab = async (req, res) => {
    try {
        // Ensure that the request body contains an array of items
        const items = req.body; // Directly assuming req.body is an array of objects

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid input: expected an array of objects.' });
        }

        // Extract customer IDs from the items array
        const customerIds = items.map(item => item.customerId);

        // Update the Store model to remove products from the pending array
        await StoreModel.updateMany(
            { "pending.customerId": { $in: customerIds } },
            { $pull: { pending: { customerId: { $in: customerIds } } } }
        );

        res.status(200).json({ message: 'Items successfully removed from pending tab' });
    } catch (error) {
        console.error('Error removing items from pending tab:', error);
        res.status(500).json({ error: 'Failed to remove items from pending tab' });
    }
};



const deleteAllProductsFromPending = async (req, res) => {
    const { customerId } = req.params; // Assuming customerId is passed as a path parameter

    try {
        // Find the store document(s) that contain the pending items for the given customerId
        const result = await Store.updateMany(
            { "pending.customerId": customerId }, // Filter by customerId in the pending array
            { $pull: { pending: { customerId } } } // Remove all items with the given customerId
        );

        if (result.modifiedCount > 0) {
            return res.status(200).json({ message: 'Products successfully deleted from pending tab.' });
        } else {
            return res.status(404).json({ message: 'No pending products found for the given customer ID.' });
        }
    } catch (error) {
        console.error('Error deleting products from pending tab:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}


const getPendingProductsDataOnClickEdit = async (req, res) => {
    try {
        const { customerId } = req.params;
        console.log("Received customerId:", customerId); // Log customerId
        
        // Convert customerId to number if it's stored as a number in the database
        const customerIdNumber = parseInt(customerId, 10);
        
        // Find the store document
        const store = await StoreModel.findOne(); // Adjust this query if necessary
        if (!store) {
            return res.status(404).json({ message: "Store data not found" });
        }

        console.log("Store document:", store); // Log the whole store document

        // Check if pending is an array
        if (!Array.isArray(store.pending)) {
            return res.status(500).json({ message: "Pending data is not an array" });
        }

        // Filter the pending products based on customerId
        const pendingProducts = store.pending.filter(product => product.customerId === customerIdNumber);
        console.log("Pending products:", pendingProducts); // Log the pending products

        return res.status(200).json({ pendingProducts });
    } catch (error) {
        console.error("Error fetching pending products:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


const deleteSpecificProductFromPending = async (req, res) => {
    try {
      const { customerId } = req.params;
  
      // Find the store document where an item in pending matches the given customerId
      const store = await StoreModel.findOne({ "pending.customerId": customerId });
  
      if (!store) {
        return res.status(404).json({ message: "No products found for the given customer ID" });
      }
  
      console.log("Store found:", store);
  
      // Filter out the product with the matching customerId
      const initialLength = store.pending.length;
      store.pending = store.pending.filter(product => product.customerId !== parseInt(customerId));
  
      if (initialLength === store.pending.length) {
        return res.status(404).json({ message: "Product not found for the given customer ID" });
      }
  
      // Save the updated store document
      const savedStore = await store.save();
      console.log("Store saved:", savedStore);
  
      res.status(200).json({ message: "Product deleted successfully", store: savedStore });
    } catch (error) {
      console.error("Error deleting specific product from pending:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  
  


module.exports.testRoute =testRoute
module.exports.createProductRoute = createProductRoute
module.exports.deleteProductRoute = deleteProductRoute
module.exports.getProductsRoute = getProductsRoute
module.exports.postProductsToPendingTab = postProductsToPendingTab
module.exports.postProductsToApprovedTab = postProductsToApprovedTab
module.exports.postToRejectedTab = postToRejectedTab
module.exports.getTotalCartPrice = getTotalCartPrice
module.exports.getTableData = getTableData
module.exports.delteDataAfterPostToApprovedTab = delteDataAfterPostToApprovedTab
module.exports.deleteAllProductsFromPending=deleteAllProductsFromPending
module.exports.getPendingProductsDataOnClickEdit = getPendingProductsDataOnClickEdit
module.exports.deleteSpecificProductFromPending = deleteSpecificProductFromPending