import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
