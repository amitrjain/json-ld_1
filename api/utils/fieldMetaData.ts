// Alternatively, if fields might have either or both properties:
interface IFieldMetadataEntry {
  sensitive?: boolean;
  PCI?: boolean;
}

interface IFieldMetadata {
  ssn: IFieldMetadataEntry;
  cardNumber: IFieldMetadataEntry;
  cvvNumber: IFieldMetadataEntry;
  expiryDate: IFieldMetadataEntry;
}

export const fieldMetadata: IFieldMetadata = {
  ssn: { sensitive: true },
  cardNumber: { PCI: true },
  cvvNumber: { PCI: true },
  expiryDate: { PCI: true }
};