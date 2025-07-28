import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, CreditCard, Database, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const PaymentSystemTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { user } = useAuth();

  const addResult = (name: string, status: 'success' | 'error', message: string) => {
    setResults(prev => [...prev, { name, status, message }]);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Database Tables
    try {
      const { data, error } = await supabase.from('payments').select('count').limit(1);
      if (error) throw error;
      addResult('Database Tables', 'success', 'Payment tables are accessible');
    } catch (error) {
      addResult('Database Tables', 'error', `Database error: ${error.message}`);
    }

    // Test 2: Square Configuration
    try {
      const { data, error } = await supabase.functions.invoke('get-square-config');
      if (error) throw error;
      if (data?.applicationId && data?.locationId) {
        addResult('Square Config', 'success', `Environment: ${data.environment || 'sandbox'}`);
      } else {
        addResult('Square Config', 'error', 'Missing Square configuration');
      }
    } catch (error) {
      addResult('Square Config', 'error', `Configuration error: ${error.message}`);
    }

    // Test 3: Item Prices
    try {
      const { data, error } = await supabase.from('item_prices').select('count').limit(1);
      if (error) throw error;
      addResult('Price System', 'success', 'Price tables are accessible');
    } catch (error) {
      addResult('Price System', 'error', `Price system error: ${error.message}`);
    }

    // Test 4: Authentication
    if (user) {
      addResult('Authentication', 'success', `Logged in as: ${user.email}`);
    } else {
      addResult('Authentication', 'error', 'User not authenticated');
    }

    // Test 5: User Purchases
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('count')
          .eq('user_id', user.id);
        if (error) throw error;
        addResult('Purchase History', 'success', 'Purchase tracking is working');
      } catch (error) {
        addResult('Purchase History', 'error', `Purchase tracking error: ${error.message}`);
      }
    }

    setTesting(false);
  };

  const resetTestData = async () => {
    if (!user) {
      addResult('Reset', 'error', 'User not authenticated');
      return;
    }

    try {
      // Clear test purchases for current user
      await supabase
        .from('user_purchases')
        .delete()
        .eq('user_id', user.id);
      
      addResult('Reset', 'success', 'Test data cleared');
    } catch (error) {
      addResult('Reset', 'error', `Reset error: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Pass</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Payment System Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CreditCard className="w-4 h-4" />
          <AlertDescription>
            This tool helps verify that all payment system components are working correctly.
            Run tests to check database connectivity, Square configuration, and payment flow.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Running Tests...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Run System Tests
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetTestData}
            disabled={testing || !user}
          >
            Reset Test Data
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Status:</span>
              <Badge 
                variant={results.every(r => r.status === 'success') ? 'default' : 'destructive'}
                className={results.every(r => r.status === 'success') ? 'bg-green-500' : ''}
              >
                {results.every(r => r.status === 'success') ? 'All Tests Passed' : 'Some Tests Failed'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};