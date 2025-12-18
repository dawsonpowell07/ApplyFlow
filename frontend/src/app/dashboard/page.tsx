import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationsTab from "@/components/dashboard/ApplicationsTab";
import ResumesTab from "@/components/dashboard/ResumesTab";
import ChatTab from "@/components/dashboard/ChatTab";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-[hsl(221,83%,15%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">ApplyFlow</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/90">{session.user.email}</span>
              <a
                href="/api/auth/logout"
                className="text-sm text-white/90 hover:text-white transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
            <TabsTrigger value="applications">Job Applications</TabsTrigger>
            <TabsTrigger value="resumes">Resumes</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value="resumes">
            <ResumesTab />
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
