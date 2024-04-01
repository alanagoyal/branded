'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { LoginFormData } from '@/components/login-form'

export async function login(formData: LoginFormData) {
  const supabase = createClient()
  const { email, password } = formData;
  const { error } = await supabase.auth.signInWithPassword({email, password})

  if (error) {
    return { error };
  }

  revalidatePath('/', 'layout')
  redirect('/new')
}