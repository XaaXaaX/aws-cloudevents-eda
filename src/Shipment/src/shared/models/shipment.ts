export enum ShipmentEventType {
    Prepared = 'order.prepared',
    Shipped = 'order.shipped',
    Delivered = 'order.delivered'
} 

export type ShipmentMetaInfo = { 
    shipmentId: string,
    orderId: string,
    userId: string,
};
export type ShipmentData = { 
    date: string, 
    iterations: string[],
    status: string,
}
export type ShipmentEntity = ShipmentMetaInfo & ShipmentData;
