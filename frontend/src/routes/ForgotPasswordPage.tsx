import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#1E293B] items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <img src="/images/legal-aid.png" alt="LegalAiD" className="w-12 h-12" />
            <h1 className="text-3xl font-bold">Legal<span className="text-blue-400">AiD</span></h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Reset Your Password
          </h2>
          <p className="text-lg text-white/90">
            No worries — we&apos;ll send you a secure link to reset your password and get back to your work.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/images/legal-aid.png" alt="LegalAiD" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-gray-900">Legal<span className="text-blue-600">AiD</span></h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
