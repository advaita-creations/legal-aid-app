import { Scale } from 'lucide-react';
import { LoginForm } from '@/features/auth';

export function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1754cf] to-[#1d3db4] items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Scale className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">Legal Aid</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Streamline Your Legal Practice
          </h2>
          <p className="text-lg text-white/90">
            Manage client agreements, documents, and cases with ease. Built for advocates who value efficiency.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#1754cf] rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Legal Aid</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sign in to access your dashboard
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[#1754cf] hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#1754cf] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
