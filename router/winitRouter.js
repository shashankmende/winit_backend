const express = require("express");

const router = express.Router();

const winitController = require('../controller/winitController');

router.route('/').get(winitController.testRoute)

router.route('/create_product').post(winitController.createProductRoute);


//onclick delete button in order summary
router.route('/delete_product/:itemCode').delete(winitController.deleteProductRoute)

//onclick add product, get products available based on the customerId
router.route('/products/:customerId').get(winitController.getProductsRoute)


//onclick confirm in order page,save to pending page
router.route('/pending_tab').post(winitController.postProductsToPendingTab)

//onclick save in main page, the items must be saved to approved tab
router.route('/approved_tab').post(winitController.postProductsToApprovedTab)


//onclick delete button of individual store items in main page , it should be moved to rejected tab based on item code. i'll send item code through path parameter
router.route('/rejected_tab/:itemCode').delete(winitController.postToRejectedTab)

router.route('/total_cart_amount').get(winitController.getTotalCartPrice)

//get table data

router.route('/table_data').get(winitController.getTableData)

//delete products from pending tab after moving them to approved tab
router.route('/delete_approved_data').delete(winitController.delteDataAfterPostToApprovedTab)

router.route('/delete_all_products_pending').delete(winitController.deleteAllProductsFromPending)

//onclick edit in pendingtab send customerid and get the products and assign to products
router.route("/pending_products/:customerId").get(winitController.getPendingProductsDataOnClickEdit)

//onclick delete in main page of specific store ,that store should be deleted from
//pending tab
router.route("/delete_specific_pending/:customerId").delete(winitController.deleteSpecificProductFromPending)


module.exports = router;
