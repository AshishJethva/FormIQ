'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character'
  );

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'], // This shows the error on passwordConfirm field
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const dispatch = useDispatch();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (formData: SignupFormValues) => {
    await dispatch(registerUser(formData)).then(() => {
      router.push('/auth/verify');
    });
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

              {/* <Button className='w-full' disabled={isLoading} type='submit'>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'SignUp'
                )}
              </Button> */}

              <Button className='w-full' type='submit'>
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
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
