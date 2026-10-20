import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center mb-4 shadow-soft">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">404 - Page Not Found</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        The route you are trying to access does not exist or has been relocated within the workspace.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => navigate('/')}
          variant="primary"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
