const path = require('path')
const fs = require('fs');
const { globSync } = require("glob");

const defaultConfig = {
  title: 'EventCatalog',
  tagline: 'Discover, Explore and Document your Event Driven Architectures',
  organizationName: 'Your Company',
  projectName: 'Event Catalog',
  trailingSlash: true,
  primaryCTA: { label: 'Explore Events', href: '/events' },
  secondaryCTA: { label: 'Discover Domains', href:"/domains" },
  logo: { alt: 'EventCatalog Logo', src: 'logo.svg' },
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
  ],
  users: [
    {
      id: 'admin',
      name: 'Catalog admin ',
      avatarUrl: 'https://randomuser.me/api/portraits/lego/3.jpg',
      role: 'Owner',
    },
  ]
}

const config = {
  versionEvents: false,
  renderMermaidDiagram: false,
  renderNodeGraph: true
}

const getDirectories = (src) => {
  return globSync(src + '/**/*.yaml');
};

const createGenerators = (specsFolder = 'specs') => {
  const schemasOnDisk = getDirectories(specsFolder); // fs.readdirSync(path.join(__dirname, specsFolder));
  const schemas = schemasOnDisk.filter((fileName) => fileName.includes('.yaml'));
  if (!schemas) return [];

  let asyncApiGenerators = [];
  schemas.map((schemaName) => {
    asyncApiGenerators.push([
      '@eventcatalog/plugin-doc-generator-asyncapi',
      {
        ...config,
        domainName: schemaName.split('/')[2],
        pathToSpec: [ 
          path.join(__dirname, `${schemaName}`) 
        ],
      },
    ]);
  });

  return asyncApiGenerators
}

const generators = createGenerators('../specs');

fs.writeFileSync('./eventcatalog.config.js', 
  `module.exports = ${JSON.stringify({
    ...defaultConfig,
    generators
  }, null, 2)}`, 'utf8');
