# Intro

This folder holds all the code samples supporting the  Event model standards study

## Why define standards on our event models?

Defining event model standards for cross-cells as well as intra-cell communication can provide many benefits as we are building new WL capabilities. By implementing these standards we can greatly improve:

* Discoverability and documentation of EDAs
* The way event consumers are processing events (e.g. Event Filtering)
* Observability of distributed systems

## Samples schema

![samples schema](./assets/diagram.png)

## Deploy

```shell
npm run cdk:orders deploy -- --all --require-approval never
npm run cdk:products deploy -- --all --require-approval never
npm run cdk:shipment deploy -- --all --require-approval never
npm run cdk:notification deploy -- --all --require-approval never
```

## Add a product

```json
{
  "productId":"PRD_12345643",
  "price":500,
  "stock":1,
  "status":"IN_STOCK"
}
```

## Send an order

Sending to order queue

```json
{
  "data": {
    "orderDate": "2024-01-01T12:55:00.990Z",
    "price": 1000,
    "quantity": 2,
    "productId": "PRD_12345643",
    "userId": "d793cc1a-5477-45b7-9a89-778835ab2482"
  }
}
```

sending via apigatway

```json
{
  "orderDate": "2024-01-01T12:55:00.990Z",
  "price": 1000,
  "quantity": 2,
  "productId": "PRD_12345643",
  "userId": "d793cc1a-5477-45b7-9a89-778835ab2482"
}
```

* While the product is `unavailable` the order shipment gets `cancelled`
* Relying Order to Product availability done using `causationId`

## Increase Stock

```json
{
  "productId":"PRD_12345643",
  "price":500,
  "stock":10,
  "status":"IN_STOCK"
}
```

* order will be confirmed

## Shipment get triggered

* As soon as the order placed event is disseminated by order service shipment will plan the package preparation.
* Per unavailability of product the shipment by receiving the `order.cancelled` event will stop the shipment process.
* Per the availability of the product and order confirmation in Order service, Shipment service will ship the package by receiving the `order.confirmed` event.
* Shipment service will send a `shipment.shipped` event.

## Log insights

fields @timestamp, message.id, message.type, message.dataversion, message.recipient, message.source, message.causationid, message.correlationid
| sort @timestamp desc
| limit 1000
| filter ispresent(message.specversion)

## Pie Widget

fields @timestamp, message.id, message.type, message.dataversion, message.recipient, message.source, message.causationid, message.correlationid
| sort @timestamp desc
| limit 1000
| filter ispresent(message.specversion)
| stats count() by message.source, message.type, message.dataversion

## Clean Up

To clean the created deployed stacks

```shell
npm run cdk:orders destroy -- --all
npm run cdk:products destroy -- --all
npm run cdk:shipment destroy -- --all 
npm run cdk:notification destroy -- --all
```

## Remove Generated folders ( Useful for clean guys )

```shell
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find . -name 'cdk.out' -type d -prune -exec rm -rf '{}' +
find . -name '.DS_Store' -prune -exec rm -rf '{}' +
```
