"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { runAction, type ActionState } from "@/lib/action-result";
import { updateCustomer } from "@/lib/crm";
import { UserError } from "@/lib/errors";

// "Takiplere ekle" under a chat answer: sets the customer's next follow-up, so that morning's assistant prepares it on Takipler.
export async function addFollowUpAction(customerId: string, kind: "arama" | "eposta", on: string): Promise<ActionState> {
  const state = await runAction(async () => {
    const [c] = await db.select().from(customer).where(eq(customer.id, customerId));
    if (!c) throw new UserError("Müşteri bulunamadı.");
    await updateCustomer(await headers(), {
      id: c.id,
      phone: c.phone ?? "",
      email: c.email ?? "",
      website: c.website ?? "",
      about: c.about ?? "",
      contactSource: c.contactSource ?? "",
      status: c.status,
      nextFollowUpOn: on,
      followUpChannel: kind === "eposta" ? "eposta" : "telefon",
    });
  });
  revalidatePath("/musteriler");
  return state;
}
