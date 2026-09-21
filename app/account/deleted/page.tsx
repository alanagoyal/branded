import Link from "next/link";

export default function AccountDeleted() {
  return (
    <div className="px-4 min-h-screen space-y-4">
      <h1 className="text-2xl font-bold">Your account has been deleted</h1>
      <p>Your account and saved work have been removed.</p>
      <Link href="/" className="underline">Back to home</Link>
    </div>
  );
}
