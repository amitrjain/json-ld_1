// import fs from 'fs';
// import { Parser } from 'n3';


// interface Roles {
//   [role: string]: string[];
// }

// export const loadRolesFromTurtle = (): Promise<Roles> => {
//   return new Promise((resolve, reject) => {
//     fs.readFile(turtleFilePath, 'utf8', (err, data) => {
//       if (err) {
//         reject(err);
//         return;
//       }

//       const parser = new Parser();
//       const roles: Roles = {};

//       parser.parse(data, (error: any, quad: any) => {
//         if (error) {
//           reject(error);
//           return;
//         }

//         if (quad) {
//           const role = quad.subject.value.split('#')[1];
//           if (!roles[role]) roles[role] = [];
//           if (quad.predicate.value.endsWith('canView')) {
//             roles[role].push(quad.object.value);
//           }
//         } else {
//           resolve(roles);
//         }
//       });
//     });
//   });
// };


import { DataFactory, Store, Quad, NamedNode } from 'n3';
import { Parser } from 'n3';
import fs from 'fs';
import path from 'path';

const turtleFilePath = path.resolve(__dirname, '../utils/roles.ttl');

// Load roles and permissions from a Turtle file
export const loadRolesFromTurtle = async () => {
  const ttlContent = fs.readFileSync(turtleFilePath, 'utf8');
  const store = new Store();
  const parser = new Parser();

  return new Promise<{ [key: string]: string[] }>((resolve, reject) => {
    parser.parse(ttlContent, (error, quad, prefixes) => {
      if (error) {
        return reject(error);
      }
      if (quad) {
        store.addQuad(quad);
      } else {
        // Parsing completed
        resolve(extractRolesAndPermissions(store));
      }
    });
  });
};

// Extract roles and permissions from the RDF store
const extractRolesAndPermissions = (store: Store) => {
  const roles: { [key: string]: string[] } = {};
  const rolePrefix = 'http://example.com/roles#';
  const schemaPrefix = 'http://schema.org/';
  const shaclNamespace = 'http://www.w3.org/ns/shacl#';

  // Extract roles based on SHACL targetClass
  store.getQuads(null, DataFactory.namedNode(`${shaclNamespace}targetClass`), null, null).forEach((quad: Quad) => {
    const role = quad.subject.value.replace(rolePrefix, '');
    roles[role] = [];

    // Extract properties allowed by the SHACL shape
    store.getQuads(quad.subject, DataFactory.namedNode(`${shaclNamespace}property`), null, null).forEach((propertyQuad: Quad) => {
      const pathQuad = store.getQuads(propertyQuad.object, DataFactory.namedNode(`${shaclNamespace}path`), null, null)[0];
      if (pathQuad) {
        const property = pathQuad.object.value.replace(schemaPrefix, '');
        roles[role]?.push(property);
      }
    });
  });

  return roles;
};
