import { DataFactory, Store, NamedNode, Parser } from 'n3';
import { readFileSync } from 'fs';
import path from 'path';

const shaclNamespace = 'http://www.w3.org/ns/shacl#';
const rolePrefix = 'http://example.com/roles#';
const schemaPrefix = 'http://schema.org/';
const rdfNamespace = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

const sensitiveDataShapeURI = 'http://example.com/roles#SensitiveDataShape';
const pciDataShapeURI = 'http://example.com/roles#PCIDataShape';

const maskedData = [{
  schama: sensitiveDataShapeURI,
  type: 'sensitive'
}, {
  schama: pciDataShapeURI,
  type: 'PCI'
}];

const turtleFilePath = path.resolve(__dirname, '../utils/roles.ttl');

// Function to load data into the store
const loadTurtleData = async (): Promise<Store> => {
  const data = readFileSync(turtleFilePath, 'utf8');
  const parser = new Parser();
  const store = new Store();

  parser.parse(data, (error, quad) => {
    if (error) {
      console.error('Parsing error:', error);
      return;
    }
    if (quad) {
      store.addQuad(quad);
    }
  });

  return store;
};

// Function to retrieve the SHACL node shape for a specific role
const getNodeShapeForRole = async (roleUri: string): Promise<string | undefined> => {
  const store = await loadTurtleData();
  let nodeShape: string | undefined;

  // Iterate over quads in the store using getQuads
  const quads = store.getQuads(null, DataFactory.namedNode(`${rdfNamespace}type`), DataFactory.namedNode(`${shaclNamespace}NodeShape`), null);
  for (const quad of quads) {
    // Check if this node shape is linked to the specified role
    const roleQuads = store.getQuads(
      quad.subject as NamedNode,
      DataFactory.namedNode(`${shaclNamespace}targetClass`),
      DataFactory.namedNode(roleUri),
      null
    );
    if (roleQuads.length > 0) {
      nodeShape = quad.subject.value;
      break;
    }
  }

  return nodeShape;
};

// Function to get properties from a collective term like PCIData
const getPropertiesFromCollectiveTerm = (store: Store, collectiveTerm: NamedNode): string[] => {
  const properties: string[] = [];
  store.getQuads(collectiveTerm, null, null, null).forEach((quad) => {
    if (quad.predicate.value === `${schemaPrefix}includes`) {
      properties.push(quad.object.value);
    }
  });
  return properties;
};

// Function to get allowed properties for a given role
export const getAllowedProperties = async (role: string): Promise<string[]> => {
  const allowedProperties: string[] = [];
  const store = await loadTurtleData();
  const roleUri = `${rolePrefix}${role}`;
  const nodeShape = await getNodeShapeForRole(roleUri);

  if (!nodeShape) {
    console.error(`No shape found for role: ${role}`);
    return allowedProperties;
  }

  const propertyQuads = store.getQuads(
    DataFactory.namedNode(nodeShape),
    DataFactory.namedNode(`${shaclNamespace}property`),
    null,
    null
  );

  propertyQuads.forEach((propertyQuad) => {
    const pathQuad = store.getQuads(propertyQuad.object, DataFactory.namedNode(`${shaclNamespace}path`), null, null)[0];
    if (pathQuad) {
      const property = pathQuad.object.value;
      if (property.startsWith(rolePrefix)) {
        // If the property is a collective term like PCIData, expand it
        const collectiveProperties = getPropertiesFromCollectiveTerm(store, DataFactory.namedNode(property));
        allowedProperties.push(...collectiveProperties);
      } else {
        allowedProperties.push(property);
      }
    }
  });

  return allowedProperties;
};

export const extractFieldMetadataFromShape = async () => {
  const store = await loadTurtleData();
  const metadata: any = {};

  maskedData.forEach(shapeURI => {
    const propertyQuads = store.getQuads(
      DataFactory.namedNode(shapeURI.schama),
      DataFactory.namedNode(`${shaclNamespace}property`),
      null,
      null
    );

    propertyQuads.forEach((propertyQuad: any) => {
      const pathQuad = store.getQuads(propertyQuad.object, DataFactory.namedNode(`${shaclNamespace}path`), null, null)[0];
      if (pathQuad) {
        // const field = pathQuad.object.value.replace(schemaPrefix, '');
        metadata[pathQuad.object.value] = {
          [shapeURI.type]: true
        };
      }
    });
  })

  return metadata;
};