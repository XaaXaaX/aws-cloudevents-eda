const path = require('path');

module.exports = {
  title: 'EventCatalog',
  tagline: 'Discover, Explore and Document your Event Driven Architectures',
  organizationName: 'Your Company',
  projectName: 'Event Catalog',
  trailingSlash: true,
  primaryCTA: {
    label: 'Explore Events',
    href: '/events'
  },
  secondaryCTA: {
    label: 'Discover Domains',
    href:"/domains"
  },
  logo: {
    alt: 'EventCatalog Logo',
    // found in the public dir
    src: 'logo.svg',
  },
  headerLinks: [
    { label: 'Events', href: '/events'},
    { label: 'Services', href: '/services' },
    { label: 'Domains', href: '/domains'},
    { label: 'Visualiser', href: '/visualiser' },
    { label: '3D Node Graph', href: '/overview' },
  ],
  footerLinks: [
    { label: 'Events', href: '/events' },
    { label: 'Services', href: '/services' },
    { label: 'Visualiser', href: '/visualiser' },
    { label: '3D Node Graph', href: '/overview' },
    { label: 'GitHub', href: 'https://github.com/boyney123/eventcatalog-demo/edit/master' }
  ],
  users: [
    {
      id: 'admin',
      name: 'Catalog admin ',
      avatarUrl: 'https://randomuser.me/api/portraits/lego/3.jpg',
      role: 'Owner',
    },
  ],
  generators: [
    [
      '@eventcatalog/plugin-doc-generator-asyncapi',
      {
        pathToSpec: [
          path.join(__dirname, '../specs/Order/1.0.0', 'asyncapi.yaml')
        ],
        versionEvents: false,
        renderNodeGraph: true,
        renderMermaidDiagram: true,
        domainName: 'Orders System'
      },
    ],
    [
      '@eventcatalog/plugin-doc-generator-asyncapi',
      {
        pathToSpec: [
          path.join(__dirname, '../specs/Product/1.0.0', 'asyncapi.yaml')
        ],
        versionEvents: false,
        renderNodeGraph: true,
        renderMermaidDiagram: true,
        domainName: 'Product System'
      },
    ],
    [
      '@eventcatalog/plugin-doc-generator-asyncapi',
      {
        pathToSpec: [
          path.join(__dirname, '../specs/Shipment/1.0.0', 'asyncapi.yaml')
        ],
        versionEvents: false,
        renderNodeGraph: true,
        renderMermaidDiagram: true,
        domainName: 'Shipment System'
      },
    ],
  ]
}
