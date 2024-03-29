'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { SignupFormData } from '@/components/signup-form';

export async function signup(formData: SignupFormData, idString: string, origin: string) {
  const supabase = createClient()
  const { email, password } = formData;
  const { error } = await supabase.auth.signUp({
    email, 
    password, 
    options: {
      emailRedirectTo: idString ? origin + `/new?ids=${idString}` : origin + '/new'
    }
  })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
}