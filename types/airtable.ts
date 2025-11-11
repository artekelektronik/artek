// Airtable Photo/Attachment Type
export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small: { url: string; width: number; height: number };
    large: { url: string; width: number; height: number };
    full: { url: string; width: number; height: number };
  };
}

// AI Field Type
export interface AIField {
  value: string | null;
  state: "generated" | "error" | "empty";
  isStale: boolean;
  errorType?: string;
}

// Product Fields from Airtable
export interface ProductFields {
  "Product Name": string;
  "Product Code"?: string;
  Category?: string;
  "Alt Kategori"?: string[];
  "Ürün Tipi"?: string[];
  Description?: string;
  Photo?: AirtableAttachment[];

  // Pricing
  "Unit Price"?: number;
  "Alış Fiyatı"?: number;
  "Toptan Fiyatı"?: number;
  "Toptan Taban "?: number;
  "Parakende Fiyatı"?: number;

  // Stock
  "Stock Quantity"?: number;
  "Stock (Karakoy)"?: number;
  "Stock (Cekmekoy)"?: number;
  "Total Stock Value"?: number;

  // Relations
  Supplier?: string[];
  "Supplier Country"?: string[];
  Manufacturer?: string[];

  // Metrics
  "Total Actions"?: number;
  "Total Projects Involved"?: number;

  // AI Fields
  "Product Summary (AI)"?: AIField;
  "AI Product Issue Detector"?: AIField;
}

// Complete Product Type
export interface AirtableProduct {
  id: string;
  fields: ProductFields;
  createdTime?: string;
}
