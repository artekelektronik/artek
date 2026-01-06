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
    const body: TallyWebhookPayload = await request.json();

    // Validate that this is a form response event
    if (body.eventType !== "FORM_RESPONSE") {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Extract field values from Tally's structure
    const fields = body.data.fields;
    const extractedData: Record<string, string | string[]> = {};

    for (const field of fields) {
      const label = field.label.toLowerCase();
      
      // Map Tally field labels to our field names
      if (label.includes("ad") || label.includes("name")) {
        extractedData.name = field.value as string;
      } else if (label.includes("email") || label.includes("e-mail")) {
        extractedData.email = field.value as string;
      } else if (label.includes("telefon") || label.includes("phone")) {
        extractedData.phone = field.value as string;
      } else if (label.includes("kategori") || label.includes("service") || label.includes("product")) {
        // For dropdown fields, Tally sends an array of IDs
        if (Array.isArray(field.value)) {
          extractedData.service = field.value[0] || "";
        } else {
          extractedData.service = field.value as string;
        }
      } else if (label.includes("talep") || label.includes("message") || label.includes("description")) {
        extractedData.message = field.value as string;
      }
    }

    console.log("Received Tally submission:", {
      submissionId: body.data.submissionId,
      extractedData,
      timestamp: body.createdAt,
    });

    // Validate required fields
    if (!extractedData.name || !extractedData.email || !extractedData.phone || !extractedData.service || !extractedData.message) {
      console.error("Missing required fields:", extractedData);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Save to database or send email notification here
    // Example: await saveToDatabase(extractedData);
    // Example: await sendEmailNotification(extractedData);

    return NextResponse.json(
      { 
        success: true, 
        message: "Webhook processed successfully",
        submissionId: body.data.submissionId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
