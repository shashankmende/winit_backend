

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

        
        const store = await StoreModel.findOne();
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        
        const approvedProducts = [];
        const pendingProductsToRemove = [];

        products.forEach(product => {
            const index = store.pending.findIndex(p => p.itemCode === product.itemCode);

            if (index !== -1) {
                
                approvedProducts.push(store.pending[index]);
                
                
                pendingProductsToRemove.push(index);
            }
        });

        
        pendingProductsToRemove.reverse().forEach(index => store.pending.splice(index, 1));

        
        store.approved.push(...approvedProducts);

        
        await store.save();

        res.status(200).json({ message: 'Products moved to approved tab successfully' });
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





module.exports.testRoute =testRoute
module.exports.createProductRoute = createProductRoute
module.exports.deleteProductRoute = deleteProductRoute
module.exports.getProductsRoute = getProductsRoute
module.exports.postProductsToPendingTab = postProductsToPendingTab
module.exports.postProductsToApprovedTab = postProductsToApprovedTab
module.exports.postToRejectedTab = postToRejectedTab
module.exports.getTotalCartPrice = getTotalCartPrice
module.exports.getTableData = getTableData