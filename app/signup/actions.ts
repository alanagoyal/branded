'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { SignupFormData } from '@/components/signup-form';

export async function signup(formData: SignupFormData) {
  const supabase = createClient()
  const { email, password } = formData;
  const { error } = await supabase.auth.signUp({email, password})

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/new')

}