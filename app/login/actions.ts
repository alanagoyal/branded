'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

import { createClient } from '@/utils/supabase/server'
import { LoginFormData } from '@/components/login-form'

export async function login(formData: LoginFormData) {
  const supabase = createClient()
  const { email, password } = formData;
  const { error } = await supabase.auth.signInWithPassword({email, password})

  if (error) {
    let errorMessage = "An unexpected error occurred. Please try again later.";
    switch(error.message) { // Replace 'error.message' with 'error.code' based on Supabase documentation
      case 'Email not found': // Replace with actual Supabase error code if different
        errorMessage = "No account associated with this email. Please sign up.";
        break;
      case 'Invalid password': // Replace with actual Supabase error code if different
        errorMessage = "Incorrect password. Try again.";
        break;
    }

    // Display the error message as a toast notification
    toast({ title: 'Error', description: errorMessage, action: {/* Action can be defined if needed, e.g., redirect to sign-up or forgot password */} });
    return;
  }

  revalidatePath('/', 'layout')
  redirect('/new')
}