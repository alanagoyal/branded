'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'
import { SignupFormData } from '@/components/signup-form';

export async function signup(formData: SignupFormData, idString: string, origin: string) {
  const supabase = createClient()
  const { email, password } = formData;
  const foo = await supabase.auth.signUp({
    email, 
    password, 
    options: {
      emailRedirectTo: idString ? origin + `/new?ids=${idString}` : origin + '/new'
    }
  })

  const { error } = foo;

  console.log("full response", foo)
  console.log(error)

  console.log("in signup action")
  if (error) {
    console.log(error)
    return { success: false, errorMessage: error.message };
  } else {
    revalidatePath('/', 'layout')
    return { success: true };
  }
}

