"use client"
import { useSession, signIn, signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">ApplyFlow</h1>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg">Welcome, {session.user?.email}</p>
          <button
            onClick={() => signOut()}
            className="rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg">Please sign in to continue</p>
          <button
            onClick={() => signIn()}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  )
}