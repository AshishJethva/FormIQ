'use client';

import { useForm } from 'react-hook-form';
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StoreDispatch, RootState } from '@/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { registerUser } from '@/redux/slice/userSlice';
import { RegistrationRequest } from '@/types/auth/actions';
import { signupSchema } from '@/dependencies/zod';

export default function SignupForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const dispatch = useDispatch<StoreDispatch>();
  const router = useRouter();
  const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);

  const form = useForm<RegistrationRequest>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (formData: RegistrationRequest) => {
    try {
      const result = await dispatch(registerUser(formData));

      if (!result || !('error' in result) || !result.error) {
        router.push('/auth/verify');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>FormApp - SignUp</CardTitle>
          <CardDescription>
            Enter below fields to signup to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-6'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='name'>Name</Label>
                    <FormControl>
                      <Input
                        id='name'
                        placeholder='Enter your name'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='email'>Email</Label>
                    <FormControl>
                      <Input
                        id='email'
                        placeholder='Enter your email'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center'>
                      <Label htmlFor='password'>Password</Label>
                    </div>
                    <FormControl>
                      <Input
                        id='password'
                        type='password'
                        {...field}
                        placeholder='Enter your password'
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='passwordConfirm'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center'>
                      <Label htmlFor='passwordConfirm'>Confirm Password</Label>
                    </div>
                    <FormControl>
                      <Input
                        id='passwordConfirm'
                        type='password'
                        {...field}
                        placeholder='Confirm your password'
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className='w-full' disabled={isLoading} type='submit'>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'SignUp'
                )}
              </Button>

              {/* <Button type='button' variant='outline' className='w-full'>
                Login with Google
              </Button> */}

              <div className='mt-4 text-center text-sm'>
                Already have an account?{' '}
                <Link
                  href='/auth/login'
                  className='underline underline-offset-4'
                >
                  Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
