module.exports = {
  "title": "EventCatalog",
  "tagline": "Discover, Explore and Document your Event Driven Architectures",
  "organizationName": "Your Company",
  "projectName": "Event Catalog",
  "trailingSlash": true,
  "primaryCTA": {
    "label": "Explore Events",
    "href": "/events"
  },
  "secondaryCTA": {
    "label": "Discover Domains",
    "href": "/domains"
  },
  "logo": {
    "alt": "EventCatalog Logo",
    "src": "logo.svg"
  },
  "headerLinks": [
    {
      "label": "Events",
      "href": "/events"
    },
    {
      "label": "Services",
      "href": "/services"
    },
    {
      "label": "Domains",
      "href": "/domains"
    },
    {
      "label": "Visualiser",
      "href": "/visualiser"
    },
    {
      "label": "3D Node Graph",
      "href": "/overview"
    }
  ],
  "footerLinks": [
    {
      "label": "Events",
      "href": "/events"
    },
    {
      "label": "Services",
      "href": "/services"
    },
    {
      "label": "Visualiser",
      "href": "/visualiser"
    },
    {
      "label": "3D Node Graph",
      "href": "/overview"
    }
  ],
  "users": [
    {
      "id": "admin",
      "name": "Catalog admin ",
      "avatarUrl": "https://randomuser.me/api/portraits/lego/3.jpg",
      "role": "Owner"
    }
  ],
  "generators": [
    [
      "@eventcatalog/plugin-doc-generator-asyncapi",
      {
        "versionEvents": true,
        "renderMermaidDiagram": false,
        "renderNodeGraph": true,
        "domainName": "Order",
        "pathToSpec": [
          "/Users/omideidivandi/source/POC/aws-cloudevents-eda/specs/Order/1.0.0/asyncapi.yaml"
        ]
      }
    ],
    [
      "@eventcatalog/plugin-doc-generator-asyncapi",
      {
        "versionEvents": true,
        "renderMermaidDiagram": false,
        "renderNodeGraph": true,
        "domainName": "Product",
        "pathToSpec": [
          "/Users/omideidivandi/source/POC/aws-cloudevents-eda/specs/Product/1.0.0/asyncapi.yaml"
        ]
      }
    ],
    [
      "@eventcatalog/plugin-doc-generator-asyncapi",
      {
        "versionEvents": true,
        "renderMermaidDiagram": false,
        "renderNodeGraph": true,
        "domainName": "Shipment",
        "pathToSpec": [
          "/Users/omideidivandi/source/POC/aws-cloudevents-eda/specs/Shipment/1.0.0/asyncapi.yaml"
        ]
      }
    ]
  ]
}