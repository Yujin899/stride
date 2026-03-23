import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-0 sm:p-8">
      <div className="wooden-panel w-full max-w-[420px] mx-auto space-y-4 sm:space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center pb-0 sm:pb-2">
          <img 
            src="/logo.png" 
            alt="STRIDE" 
            className="h-20 sm:h-28 w-auto object-contain"
          />
        </div>
        
        <RegisterForm />
      </div>
    </main>
  );
}
