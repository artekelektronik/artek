import Airtable from "airtable";

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
});

// Initialize base
const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

export default base;
