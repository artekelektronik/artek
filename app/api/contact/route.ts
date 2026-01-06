import { NextResponse } from "next/server";

const TALLY_WEBHOOK_URL = process.env.TALLY_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, service, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !service || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Format the data to match Tally's webhook payload structure
    const tallyPayload = {
      eventType: "FORM_RESPONSE",
      createdAt: new Date().toISOString(),
      data: {
        formName: "Contact Form - Artek Elektronik",
        fields: [
          {
            label: "Name",
            type: "INPUT_TEXT",
            value: name,
          },
          {
            label: "Email",
            type: "INPUT_EMAIL",
            value: email,
          },
          {
            label: "Phone",
            type: "INPUT_PHONE_NUMBER",
            value: phone,
          },
          {
            label: "Service",
            type: "DROPDOWN",
            value: service,
          },
          {
            label: "Message",
            type: "TEXTAREA",
            value: message,
          },
        ],
      },
    };

    // Send to Tally webhook if URL is configured
    if (TALLY_WEBHOOK_URL) {
      const webhookResponse = await fetch(TALLY_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tallyPayload),
      });

      if (!webhookResponse.ok) {
        console.error("Tally webhook failed:", await webhookResponse.text());
        // Don't fail the request if webhook fails, just log it
      }
    }

    // You can also save to your own database here if needed
    
    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
