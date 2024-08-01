
1.sales order collection : 
    id,salesOrderNumber,CustomerCode,OrderDate

2. SalesOrderLine

    id,salesOrderId, itemCode, itemName,UnitPrice,Quantity,TotalPrice

base collection:
    1.pending 
    2.approved
    3.rejected


when confirmed, send customerId,orderDate,totalAmount,itemCode