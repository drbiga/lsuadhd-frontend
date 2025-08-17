import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Routes from "./Routes";
import BackendErrorPage from "./components/common/BackendErrorPage";
import { useState, useEffect, useRef } from "react";
import { removeLocalStorage, Item, getLocalStorage } from "./lib/localstorage";
import axios from "axios";

function App() {
    const [showError, setShowError] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isBackendDownRef = useRef(false);

    useEffect(() => {
        const pingBackend = async () => {
            try {
                const isHttps = import.meta.env.VITE_IS_HTTPS === 'yes' || false;
                const protocol = isHttps ? 'https' : 'http';
                const host = import.meta.env.VITE_BACKEND_HOST || 'localhost';
                const port = import.meta.env.VITE_BACKEND_PORT || '8000';
                const backendPrefix = import.meta.env.VITE_BACKEND_PATH_PREFIX || '';
                await fetch(`${protocol}://${host}:${port}${backendPrefix}/health_check`);
                
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                // If session is recovered --> restart collection
                if (isBackendDownRef.current) {
                    setTimeout(async () => {
                        const cachedData = getLocalStorage(Item.SESSION_EXECUTION_CACHE);
                        if (cachedData) {
                            try {
                                const parsed = JSON.parse(cachedData);
                                if (parsed.sessionHasStarted) {
                                    await axios.post('http://localhost:8001/collection');
                                }
                            } catch (error) {
                                console.log('Error parsing cached data:', error);
                            }
                        }
                    }, 500);
                }
                
                isBackendDownRef.current = false;
                setShowError(false);
                
                // Backend will ping every 10 sec to make sure it stays healthy
                timeoutRef.current = setTimeout(pingBackend, 10000);
                
            } catch {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                isBackendDownRef.current = true;
                setShowError(true);
                
                // If backend is down perform a rapid check (we don't want the user to lose session time upon recovery)
                timeoutRef.current = setTimeout(pingBackend, 500);
            }
        };
        pingBackend();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
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
