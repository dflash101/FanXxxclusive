// src/pages/EmailVerifiedPage.tsx
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border-purple-600/30 shadow-2xl shadow-purple-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">
            🎉 Email Verified!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-300">
            Your email has been confirmed. You can now sign in and enjoy full access.
          </p>
          <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Link to="/auth">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
