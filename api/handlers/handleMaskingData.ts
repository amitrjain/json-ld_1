import { UserBody } from "@api/routes/schema";
import { fieldMetadata } from "@api/utils/fieldMetaData";
import { loadRolesFromTurtle } from "@api/utils/roleManager";
import { FastifyReply, FastifyRequest } from "fastify";

type metaDataKey = keyof typeof fieldMetadata;

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
  }

  if (!data) {
    return payload;
  }

  const dataToSend = await maskRoleBasedData(data, request.role, originalData.showContext);

  return JSON.stringify({ data: dataToSend, success: true });
};

const maskRoleBasedData = async (data: UserBody[], role: string | undefined, showContext: boolean = false) => {
  if (!role) {
    return null;
  }
  const allRoles: any = await loadRolesFromTurtle();
  const roleAccess: any = allRoles[role];

  console.log("datadata", data)
  return data.map((user: any) => {
    let maskedContact: any = { ...user };
    Object.keys(user).forEach((key: string) => {
      if (key !== '@context') {
        const fieldContext = user['@context'][key];
        const metadata = fieldMetadata[key as metaDataKey];
        if (!roleAccess.includes(fieldContext) && (metadata?.sensitive || metadata?.PCI)) {
          maskedContact[key] = maskField(user[key]); // Mask the data
        } else if (!roleAccess.includes(fieldContext)) {
          delete maskedContact[key]; // Remove the field
        }
      }
    });
    if (!showContext) {
      delete maskedContact["@context"];
    }
    return maskedContact;
  });
};

const maskField = (value: any) => {
  if (typeof value === 'string') {
    return value.replace(/./g, '*');
  }
  return value;
}