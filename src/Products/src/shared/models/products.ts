export enum ProductEventType {
    ProductCreated = 'product.created',
    ProductDeleted = 'product.deleted',
    ProductPriceUpdated = 'product.price_updated',
    ProductQuantityUpdated = 'product.quantity_updated',
    ProductStatusUpdated = 'product.status_updated',
    ProductExhausted = 'product.exhausted',
    ProductAvailabilityConfirmed = 'product.availability_confirmed',
} 

export type ProductMetaInfo = { productId: string };
export type ProductData = { 
    price: number, 
    stock: number,
    status: string
}
export type ProductEntity = ProductMetaInfo & ProductData;
