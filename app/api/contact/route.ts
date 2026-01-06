import { NextResponse } from "next/server";

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: string | string[] | number | boolean;
}

interface TallyWebhookPayload {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the raw payload for debugging
    console.log("🔔 Raw webhook payload received:", JSON.stringify(body, null, 2));

    // Check if it's a Tally webhook event or a form submission from our website
    const eventType = (body as any).eventType;
    const isWebsiteForm = !eventType && (body as any).name && (body as any).email;

    if (isWebsiteForm) {
      // Handle website form submission
      console.log("📝 Website form submission received");
      await handleWebsiteFormSubmission(body);
    } else if (eventType === "FORM_RESPONSE") {
      // Handle Tally webhook event
      console.log("🔔 Tally webhook event received");
      processWebhookAsync(body as TallyWebhookPayload).catch(err => 
        console.error("Error processing webhook in background:", err)
      );
    } else {
      console.log("⚠️ Unknown payload type received");
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Webhook received"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Webhook parsing error:", error);
    // Still return 200 so requests don't fail
    return NextResponse.json(
      { success: false },
      { status: 200 }
    );
  }
}

// Handle website form submission
async function handleWebsiteFormSubmission(body: any) {
  try {
    const { name, email, phone, service, message } = body;

    console.log("✅ Website form data extracted:", {
      name,
      email,
      phone,
      service,
      messageLength: message?.length || 0,
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return;
    }

    // TODO: Save to database, send email, or integrate with Tally here
    // Example: await saveToDatabase({ name, email, phone, service, message });
    // Example: await sendEmailNotification({ name, email, phone, service, message });
    
    console.log("✅ Website form submission processed successfully");
  } catch (error) {
    console.error("❌ Error processing website form:", error);
  }
}

// Process webhook data asynchronously
async function processWebhookAsync(body: TallyWebhookPayload) {
  try {
    // Only process FORM_RESPONSE events
    if (body.eventType !== "FORM_RESPONSE") {
      console.log("⏭️ Skipping non-FORM_RESPONSE event:", body.eventType);
      return;
    }

    // Extract field values from Tally's structure
    const fields = body.data.fields;
    const extractedData: Record<string, string | string[]> = {};

    for (const field of fields) {
      const label = field.label.toLowerCase().trim();
      
      // Map Tally field labels to our field names (Turkish and English)
      if (label.includes("ad") || label.includes("name")) {
        extractedData.name = String(field.value);
      } else if (label.includes("email") || label.includes("e-mail")) {
        extractedData.email = String(field.value);
      } else if (label.includes("telefon") || label.includes("phone")) {
        extractedData.phone = String(field.value);
      } else if (label.includes("kategori") || label.includes("service") || label.includes("product") || label.includes("ürün")) {
        // For dropdown fields, Tally sends an array of IDs or strings
        if (Array.isArray(field.value) && field.value.length > 0) {
          // Try to get the text from options
          const firstValue = field.value[0];
          const selectedOption = (field as any).options?.find((opt: any) => 
            opt.id === firstValue
          );
          extractedData.service = selectedOption?.text || String(firstValue);
        } else {
          extractedData.service = String(field.value);
        }
      } else if (label.includes("talep") || label.includes("message") || label.includes("description") || label.includes("ihtiyaç")) {
        extractedData.message = String(field.value);
      }
    }

    console.log("✅ Extracted Tally submission:", {
      submissionId: body.data.submissionId,
      name: extractedData.name,
      email: extractedData.email,
      phone: extractedData.phone,
      service: extractedData.service,
      message: typeof extractedData.message === "string" ? extractedData.message.substring(0, 50) + "..." : String(extractedData.message).substring(0, 50) + "...",
      timestamp: body.createdAt,
    });

    // TODO: Save to database or send email notification here
    // Example: await saveToDatabase(extractedData);
    // Example: await sendEmailNotification(extractedData);
  } catch (error) {
    console.error("❌ Error processing webhook data:", error);
  }
}
