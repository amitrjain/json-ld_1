import { UserBody } from "@api/routes/schema";
import { extractFieldMetadataFromShape, getAllowedProperties } from "@api/utils/shaclValidator";
import { FastifyReply, FastifyRequest } from "fastify";
import * as jsonld from 'jsonld';

const maskField = (value: any, maskingType: string) => {
  if (typeof value === 'string') {
    if (maskingType === 'full') {
      return value.replace(/./g, '*'); // Fully mask sensitive data
    } else if (maskingType === 'partial') {
      return value.slice(-4).padStart(value.length, '*'); // Mask all but the last 4 digits for PCI data
    }
  }
  return value;
};

export const maskRoleBasedData = async (
  data: UserBody[],
  role: string,
  showContext: boolean
): Promise<any[]> => {
  try {
    const roleUri = `http://example.com/roles#${role}`;
    const metadata = await extractFieldMetadataFromShape(roleUri);

    console.log("metadata", metadata)
    return await Promise.all(data.map(async (user) => {
      let maskedContact: any = { ...user };
      const compactedUser = await jsonld.compact(user, user['@context']);

      // Retrieve the allowed properties for the role using SHACL validation
      const allowedProperties = await getAllowedProperties(role);

      Object.keys(compactedUser).forEach((key: string) => {
        const propertyIri = user['@context'][key];
        if (key !== '@context') {
          if (!allowedProperties.includes(propertyIri)) {
            delete maskedContact[key];
          } else {
            const fieldMeta = metadata[propertyIri];
            console.log("fieldMeta")
            maskedContact[key] = maskField(compactedUser[key], fieldMeta?.maskingType)
          }
        }
      });

      if (!showContext) {
        delete maskedContact["@context"];
      }

      return maskedContact;
    }));
  } catch (error) {
    console.error("Error in maskRoleBasedData:", error);
    throw error;
  }
};


export const handleMaskingData = async (
  request: FastifyRequest,
  _: FastifyReply,
  payload: any
): Promise<any> => {
  let data: UserBody[] = [];
  let originalData: any = [];

  try {
    originalData = JSON.parse(payload);
    data = originalData?.data;
  } catch (error) {
    return payload; // Return original payload if parsing fails
  }

  if (!data) {
    return payload;
  }

  const role = request.role as string;

  // Validate data and determine allowed properties based on SHACL shapes
  const dataToSend = await maskRoleBasedData(data, role, originalData.showContext);

  return JSON.stringify({ data: dataToSend, success: true });
};