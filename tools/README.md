# Streams documentation and validation

When designing event-driven architectures the core concept is Event, an event presents a previously happened change in the system.
Event-driven systems like Apis need promises and contracts but due to the consumption-based nature of events, their lifecycle differs a bit from Api contracts.

# AsyncApi?

Using async API we provide specs around Event standards like pub/sub, this way of working, drives us toward the spec-first approach and challenges us around Event Storming.

## Validation

The Event Validation is the responsibility of both the producer and consumer side, but the responsibility of providing the required material to help the consumer validate the events with minimum effort will be on the producer side.

## Consumption

Consuming events has its proper challenges as the different types can be published to the same broker and the consumer needs to decide which one is in its interest, but also needs a proper way of consumption using filtering and to be able to have a simplified and helpful filtering mechanism we need to make events based on a well-defined standard.

## Let's Validate

You can find a sample async API definition [here](../docs/Order/1.0.0/asyncapi.yaml).

we need to generate the JSON definition before using ajv using `@asynapi-parser` package

## Schema Generator

The Shema can be parsed via file or URL, the generator translates the async API into a typescript const.
The validation involves verifying the event against a path to schema component in the generated schema. [here](./gen-ts-schema-from-asyncapi-spec.ts)

### Why do we need a schema?

The process of validation must be constructed by asyncapi specification, so for any single event, we need to validate that event against the specification. Validating against a URL or file adds some hard dependency for a simple validation to the network or I/O.

### How to do that?

#### From file

To lighten the validation process we generate a typescript variable consisting of JSON schema from our async API in the development phase using the following command

``` shell
    > npm i & npm run generate:ts:schema -- --spec-file-path=./docs/Order/1.0.0/asyncapi.yaml  --dest-file-path=../src/order-v1-schema.ts
```


#### From URI

> you can as well generate a schema form an api definition uing http/https Url

``` shell
    npm run generate:ts:schema -- --spec-file-path=https://mydocurl/asyncapi.yaml  --dest-file-path=./src/order-v1-schema.ts
```

## Generation Alternative way

You can also do a simple parsing of async API yaml file to json using the online free tools and create a variable in your code source manually.

Here are some online free tools:

- https://onlineyamltools.com/convert-yaml-to-json
- https://jsonformatter.org/yaml-to-json
- https://www.json2yaml.com/convert-yaml-to-json

## Type Generator

While development you need to generate the types and objects in your preferred programming language to have a simpler development phase.
Having a simpler way to generate types and use them has been a practice for decades and we are just adding some tooling here to simplify this process.

### From File

[here](./gen-ts-types-from-asyncapi-spec.ts) is the type generator for typescript.

``` shell
    npm run generate-models -- --spec-file-path=../docs/Order/1.0.0/asyncapi.yaml  --dest-file-path=../src/shared/specs/order/order-v1-models.ts
```
