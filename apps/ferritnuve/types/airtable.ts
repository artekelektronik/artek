// The product shape the pages use; lib/catalog.ts adapts the stok catalog API to it.
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

export interface ProductFields {
  "Product Name": string;
  "Product Code"?: string;
  Category?: string;
  "Alt Kategori"?: string[];
  "Ürün Tipi"?: string[];
  Description?: string;
  Photo?: AirtableAttachment[];
  Manufacturer?: string[];
  "Supplier Country"?: string[];
}

export interface AirtableProduct {
  id: string;
  fields: ProductFields;
  createdTime?: string;
}
