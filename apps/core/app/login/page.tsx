import { Footer } from "@/components/footer";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white md:bg-tc_grayscale-100">
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full md:max-w-[550px] md:rounded-xl md:bg-white md:shadow-md">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
