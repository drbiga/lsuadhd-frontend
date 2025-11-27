import React from 'react';

const BackendErrorPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Connection Error
          </h1>
          
          <p className="text-muted-foreground mb-6 text-lg">
            Unable to connect to the server. Please review the information below.
          </p>

          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-accent font-bold flex-shrink-0">•</span>
              <span className="text-foreground">
                Sessions interrupted due to a server outage <span className="text-accent font-semibold">can be recovered</span> if the server is restored within two hours from the session start time.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold flex-shrink-0">•</span>
              <span className="text-foreground">
                Sessions exceeding two hours that remain incomplete will be marked as failed. <span className="text-accent font-semibold">You will not need to repeat these sessions; you will automatically proceed to the next session in sequence.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold flex-shrink-0">•</span>
              <span className="text-foreground">
                All server failures are recorded. Contact Matheus at <strong className="text-accent">mcost16@lsu.edu</strong> if you are in need of assistance.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackendErrorPage;
