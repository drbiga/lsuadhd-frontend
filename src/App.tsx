import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Routes from "./Routes";
import BackendErrorPage from "./components/common/BackendErrorPage";
import { useState, useEffect } from "react";
import { removeLocalStorage, Item } from "./lib/localstorage";

function App() {
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const pingBackend = async () => {
            try {
                const isHttps = import.meta.env.VITE_IS_HTTPS === 'yes' || false;
                const protocol = isHttps ? 'https' : 'http';
                const host = import.meta.env.VITE_BACKEND_HOST || 'localhost';
                const port = import.meta.env.VITE_BACKEND_PORT || '8000';
                const backendPrefix = import.meta.env.VITE_BACKEND_PATH_PREFIX || '';
                await fetch(`${protocol}://${host}:${port}${backendPrefix}/health_check`);
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
        removeLocalStorage(Item.SESSION_EXECUTION_CACHE);
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
