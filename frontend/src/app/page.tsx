import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;
  console.log(session)

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[hsl(221,83%,15%)] mb-2">ApplyFlow</h1>
            <p className="text-gray-600">Your Job Application Manager</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-6">
                Track your job applications, manage your resumes, and stay organized in your job search.
              </p>
              <LoginButton />
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-[hsl(221,83%,15%)] mb-3">Features:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(221,83%,15%)]">•</span>
                  <span>Track job applications with status updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(221,83%,15%)]">•</span>
                  <span>Upload and manage multiple resumes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(221,83%,15%)]">•</span>
                  <span>Organize application details and contacts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}