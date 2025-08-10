import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Routes from "./Routes";
import BackendErrorPage from "./components/common/BackendErrorPage";
import { useState, useEffect } from "react";

function App() {
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const pingBackend = async () => {
            try {
                const host = import.meta.env.VITE_BACKEND_HOST || 'localhost';
                const port = import.meta.env.VITE_BACKEND_PORT || '8000';
                await fetch(`http://${host}:${port}/health_check`);
                setShowError(false);
            } catch {
                setShowError(true);
            }
        };
        
        const interval = setInterval(pingBackend, 10000);
        pingBackend();

        return () => clearInterval(interval)
    }, []);

    if (showError) {
        return <BackendErrorPage />;
    }

    return (
        <>
            <Routes />
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </>
    )
}

export default App
