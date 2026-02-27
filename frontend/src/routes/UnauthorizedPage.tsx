import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="mt-4 text-xl text-gray-600">Unauthorized Access</p>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to access this page.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
