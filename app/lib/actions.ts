'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid', 'deleted']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = Math.floor(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = Math.floor(amount * 100);

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice. ',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function markInvoicePending(id: string) {

  const status = 'pending';
  try {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice to STATUS: PENDING. ',
    };
  }
  revalidatePath('/dashboard/invoices');
}

export async function markInvoicePaid(id: string) {

  const status = 'paid';
  try {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice to STATUS: PAID. ',
    };
  }
  revalidatePath('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  //throw new Error('DEBUG: Failed to Delete Invoice: ERROR IN app/lib/actions.ts');

  const status = 'deleted';
  try {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice to STATUS: DELETED. ',
    };
  }
  revalidatePath('/dashboard/invoices');
}
