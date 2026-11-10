"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, runStockAction, type ActionState } from "@/lib/action-result";
import { archiveInvoice, restoreInvoice } from "@/lib/archive";
import { invoicesChanged } from "@/lib/finance";
import { attachToProforma, confirmInvoice, createManualInvoice, deleteInvoice, type ConfirmInvoiceInput, type ManualInvoiceInput } from "@/lib/invoices";
import type { PaymentInput } from "@/lib/payment-state";
import { addPayment, deletePayment } from "@/lib/payments";

function done(state: ActionState) {
  if (state?.saved) invoicesChanged();
  revalidatePath("/faturalar");
  revalidatePath("/finans");
  revalidatePath("/finans/tahsilat");
  revalidatePath("/musteriler");
  return state;
}

export async function archiveInvoiceAction(id: string, reason: string): Promise<ActionState> {
  return done(await runAction(async () => archiveInvoice(await headers(), { id, reason })));
}

export async function restoreInvoiceAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => restoreInvoice(await headers(), id)));
}

export async function confirmInvoiceAction(input: ConfirmInvoiceInput): Promise<ActionState> {
  return done(await runStockAction(async () => confirmInvoice(await headers(), input)));
}

export async function deleteInvoiceAction(id: string): Promise<ActionState> {
  return done(await runStockAction(async () => deleteInvoice(await headers(), id)));
}

export async function createManualInvoiceAction(input: ManualInvoiceInput): Promise<ActionState & { id?: string }> {
  let id: string | undefined;
  const state = await runAction(async () => {
    id = await createManualInvoice(await headers(), input);
  });
  return { ...done(state), id };
}

export async function attachToProformaAction(uploadedId: string, proformaId: string): Promise<ActionState> {
  return done(await runAction(async () => attachToProforma(await headers(), uploadedId, proformaId)));
}

export async function addPaymentAction(invoiceId: string, input: PaymentInput): Promise<ActionState> {
  return done(await runAction(async () => addPayment(await headers(), invoiceId, input)));
}

export async function deletePaymentAction(paymentId: string): Promise<ActionState> {
  return done(await runAction(async () => deletePayment(await headers(), paymentId)));
}
