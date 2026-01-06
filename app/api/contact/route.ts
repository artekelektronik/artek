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
    const body = await request.json() as TallyWebhookPayload;

    // Log the full payload for debugging
    console.log("🔔 Tally webhook received:", {
      eventType: body.eventType,
      submissionId: body.data?.submissionId,
      formName: body.data?.formName,
    });

    // Return 200 immediately (Tally requires response within 10 seconds)
    // Process the data asynchronously
    processWebhookAsync(body).catch(err => 
      console.error("Error processing webhook in background:", err)
    );

    return NextResponse.json(
      { 
        success: true, 
        message: "Webhook received"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Webhook parsing error:", error);
    // Still return 200 so Tally doesn't retry
    return NextResponse.json(
      { success: false },
      { status: 200 }
    );
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
