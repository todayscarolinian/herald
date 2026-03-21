"use client";

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean(),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: ({ value }) => {
      // TODO: replace with actual api call
      console.log(value);
    },
  });

  return (
    <div className="w-full max-w-[550px] min-h-[629px]">
      <div className="flex flex-col items-start md:items-center gap-6 py-[52px] px-[42px] w-full">
        <div className="flex flex-col items-start md:items-center gap-2">
          <div className="relative h-16 w-16">
            <Image
              src="/tc-logo-red.png"
              alt="TC Herald logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="w-full text-left md:text-center">
            <h1 className="text-2xl font-bold text-tc_accent_black-300">
              Welcome to <span className="opacity-50">TC Herald</span>
            </h1>
            <p className="mt-1 text-base text-tc_accent_black-300 opacity-60">
              Log in using the form below.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="w-full space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => {
                const result = loginSchema.shape.email.safeParse(value);
                return result.success ? undefined : result.error.issues[0]?.message;
              },
              onSubmit: ({ value }) => {
                const result = loginSchema.shape.email.safeParse(value);
                return result.success ? undefined : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-[10px]">
                <Label
                  htmlFor={field.name}
                  className="font-semibold text-base text-tc_accent_black-400 opacity-60"
                >
                  Email
                </Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="12345678@usc.edu.ph"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full text-sm border-tc_grayscale-400 placeholder:text-tc_grayscale-600 opacity-60"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-tc_error-500">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) => {
                const result = loginSchema.shape.password.safeParse(value);
                return result.success ? undefined : result.error.issues[0]?.message;
              },
              onSubmit: ({ value }) => {
                const result = loginSchema.shape.password.safeParse(value);
                return result.success ? undefined : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-[10px]">
                <Label
                  htmlFor={field.name}
                  className="font-semibold text-base text-tc_accent_black-400 opacity-60"
                >
                  Password
                </Label>
                <div className="relative w-full">
                  <Input
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full text-sm border-tc_grayscale-400 pr-10 placeholder:text-tc_grayscale-600 opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tc_grayscale-600 hover:text-tc_grayscale-800"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-tc_error-500">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="rememberMe">
            {(field) => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    className="border-tc_grayscale-500 data-[state=checked]:bg-tc_primary-500 data-[state=checked]:border-tc_primary-500"
                  />
                  <Label
                    htmlFor={field.name}
                    className="cursor-pointer font-normal text-tc_accent_black-400 opacity-60"
                  >
                    Remember Me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-tc_accent_black-400 underline underline-offset-2 hover:text-tc_primary-500 transition-colors opacity-60"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[42px] bg-tc_primary-500 font-semibold text-base text-tc_white hover:bg-tc_primary-600 active:bg-tc_primary-500 transition-colors"
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-tc_grayscale-400" />
          <span className="text-sm text-tc_grayscale-700 opacity-60">Or</span>
          <div className="h-px flex-1 bg-tc_grayscale-400" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-[42px] gap-3 border-tc_grayscale-400 font-medium text-base text-tc_accent_black-400 hover:bg-tc_grayscale-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Log In with Google
        </Button>

      </div>
    </div>
  );
}