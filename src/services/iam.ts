import { getLocalStorage, Item, setLocalStorage } from "@/lib/localstorage";
import api from "./api";

enum Role {
    MANAGER = 'manager',
    STUDENT = 'student'
}

type User = {
    username: string;
    password?: string;
    role: Role;
}

type Session = {
    token: string;
    user: User;
    ip_address: string;
}

class IamService {
    private currentSession: Session | null;
    // private localServerUpToDate: boolean;

    public constructor() {
        const sessionString = getLocalStorage(Item.SESSION_OBJ);
        this.currentSession = sessionString ? JSON.parse(sessionString) : null;
        // this.localServerUpToDate = false;
        // this.authenticatedUser = this.currentSession ? this.currentSession.user : null;
        if (this.currentSession) {
            api.defaults.headers.common.Authorization = `Bearer ${this.currentSession.token}`;
        }
        // this.ipAddress = '';
        // this.getIpAddress().then(ip => { this.ipAddress = ip })
    }

    async getIpAddress(): Promise<string> {
        const response = await fetch('https://geolocation-db.com/json/');
        const data = await response.json();
        return data.IPv4;
    }

    // public async getRole(username: string, token: string): Promise<Role> {
    //     const response = await api.get(`/iam/user/${username}/role`, {headers: { Authorization: `Bearer ${token}`}});
    //     return response.data;
    // }

    public async getSession(sessionToken: string): Promise<Session> {
        const response = await api.get(`/iam/session/${sessionToken}`);
        return response.data;
    }

    public getCurrentSession(): Session {
        if (this.currentSession) {
            return this.currentSession;
        } else {
            throw Error('No running session');
        }
    }

    public async createSession(username: string, password: string, ipAddress: string): Promise<Session> {
        const response = await api.post('/iam/session', { username, password, ip_address: ipAddress })
        this.currentSession = response.data;
        setLocalStorage(Item.SESSION_OBJ, JSON.stringify(this.currentSession));
        return response.data;
    }

    // private async updateLocalServer() {
    //     while (!this.localServerUpToDate) {
    //         try {
    //             // Will try to connect endlessly because we need this connection to happen.
    //             // If it doesn't happen, the user will never have feedback
    //             await axios.post('http://localhost:8001/session', this.currentSession);
    //             this.localServerUpToDate = true;
    //         } catch {
    //             // Delay function. Wait for 1 second
    //             await ((ms) => (new Promise(resolve => setTimeout(resolve, ms)))) (1000)
    //         }
    //     }
    // }
}

const iamService = new IamService();

export default iamService;
