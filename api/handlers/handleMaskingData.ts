import { UserBody } from "@api/routes/schema";
import { extractFieldMetadataFromShape, getAllowedProperties } from "@api/utils/shaclValidator";
import * as jsonld from 'jsonld';
import { FastifyReply, FastifyRequest } from "fastify";

const maskField = (value: any) => {
  if (typeof value === 'string') {
    return value.replace(/./g, '*'); // Simple masking example
  }
  return value;
};

const maskRoleBasedData = async (
  data: UserBody[],
  role: string,
  showContext: boolean
): Promise<any[]> => {
  try {
    return await Promise.all(data.map(async (user) => {
      let maskedContact: any = { ...user };
      const compactedUser = await jsonld.compact(user, user['@context']);

      // Retrieve the allowed properties for the role using SHACL validation
      const allowedProperties = await getAllowedProperties(role);
      const metadata = await extractFieldMetadataFromShape();

      Object.keys(compactedUser).forEach((key: string) => {
        const propertyIri = user['@context'][key];

        if (key !== '@context' && !allowedProperties.includes(propertyIri)) {
          const fieldMeta = metadata[propertyIri];
          console.log(key, fieldMeta?.sensitive, fieldMeta?.PCI);

          if (fieldMeta?.sensitive || fieldMeta?.PCI) {
            maskedContact[key] = maskField(compactedUser[key]);
          } else {
            delete maskedContact[key]; // Remove fields that are not allowed and not sensitive
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