export enum OrderEventType {
    OrderPlaced = 'order.placed',
    OrderDeleted = 'order.deleted',
    OrderUpdated = 'order.updated',
    OrderCancelled = 'order.cancelled',
    OrderConfirmed = 'order.confirmed',
} 

export type OrderMetaInfo = { 
    orderId: string, 
    productId: string,
    userId: string,
};
export type OrderData = { 
    price: number, 
    quantity: number,
    orderDate: string,
}
export type OrderEntity = OrderMetaInfo & OrderData;
