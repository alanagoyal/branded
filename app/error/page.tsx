import { Button } from "@/components/ui/button";
import { AlertCircle, AlertOctagon } from "lucide-react";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div
      className="w-full px-4 flex justify-center items-center flex-col min-h-screen"
      style={{ marginTop: "-100px" }}
    >
      <AlertCircle
        style={{ width: "20px", height: "20px", marginBottom: "16px" }}
      />
      <h1 className="text-2xl text-center font-bold mb-4">
        Uh oh! An error occurred
      </h1>
      <Link className="flex justify-center pt-2" href="/">
        <Button variant="outline">Back Home</Button>
      </Link>
    </div>
  );
}
