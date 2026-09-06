import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-campus-darker flex items-center justify-center p-6 text-center">
      <Card className="max-w-md w-full p-8 border-white/10 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-sm text-gray-400 mt-2">
            The campus route or resource you are looking for does not exist or has been relocated.
          </p>
        </div>
        <Link href="/" passHref>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Return to Campus NEXUS
          </Button>
        </Link>
      </Card>
    </div>
  );
}
