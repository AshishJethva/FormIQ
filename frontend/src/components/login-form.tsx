'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    console.log('Form submitted:', values);
    // handle login logic
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>FormApp - Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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
                      <a
                        href='#'
                        className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                      >
                        Forgot your password?
                      </a>
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

              <Button type='submit' className='w-full'>
                Login
              </Button>
              {/* <Button type='button' variant='outline' className='w-full'>
                Login with Google
              </Button> */}

              <div className='mt-4 text-center text-sm'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/auth/signup'
                  className='underline underline-offset-4'
                >
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
