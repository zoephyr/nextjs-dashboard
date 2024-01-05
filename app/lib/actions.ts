'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0' }),
  status: z.enum(['pending', 'paid', 'deleted'], {
    invalid_type_error: 'Please select an invoid status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // Form validation fail, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
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
