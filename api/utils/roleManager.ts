import fs from 'fs';
import path from 'path';
import { Parser } from 'n3';

const turtleFilePath = path.resolve(__dirname, '../utils/roles.ttl');

interface Roles {
  [role: string]: string[];
}

export const loadRolesFromTurtle = (): Promise<Roles> => {
  return new Promise((resolve, reject) => {
    fs.readFile(turtleFilePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const parser = new Parser();
      const roles: Roles = {};

      parser.parse(data, (error: any, quad: any) => {
        if (error) {
          reject(error);
          return;
        }

        if (quad) {
          const role = quad.subject.value.split('#')[1];
          if (!roles[role]) roles[role] = [];
          if (quad.predicate.value.endsWith('canView')) {
            roles[role].push(quad.object.value);
          }
        } else {
          resolve(roles);
        }
      });
    });
  });
};
