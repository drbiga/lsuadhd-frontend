import React from 'react';

const BackendErrorPage: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Something Went Wrong!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The app is currently unable to connect to the server.
        </p>

        <ul className="list-disc pl-5 text-left space-y-3">
          <li className="text-gray-700 dark:text-gray-200">
            Sessions interrupted due to a server outage <span className="text-yellow-500 font-bold">can be recovered</span> if the server is restored within two hours from the session start time.
          </li>
          <li className="text-gray-700 dark:text-gray-200">
            Sessions exceeding two hours that remain incomplete will be marked as failed. <span className="text-yellow-500 font-bold">You will not need to repeat these sessions; you will automatically proceed to the next session in sequence.</span>
          </li>
          <li className="text-gray-700 dark:text-gray-200">
            All server failures are recorded. Contact Matheus at <strong className="text-yellow-500">mcost16@lsu.edu</strong> for assistance.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BackendErrorPage;
