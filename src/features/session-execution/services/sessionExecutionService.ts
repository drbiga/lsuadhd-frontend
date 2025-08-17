import axios, { AxiosError } from "axios";
import api from "@/services/api";
import iamService from "@/services/iam";
import { toast } from "react-toastify";
import { removeLocalStorage, Item } from "@/lib/localstorage";

export type Student = {
    name: string;
    sessions: Session[];
    sessions_analytics: SessionAnalytics[];
    survey_id?: number;
    active_session: Session;
}

export type SessionAnalytics = {
    session_seqnum: number;
    percentage_time_distracted: number;
    percentage_time_normal: number;
    percentage_time_focused: number;
}

export type Session = {
    seqnum: number;
    start_link: string;
    is_passthrough: boolean;
    has_feedback: boolean;
    no_equipment?: boolean;
    stage: Stage;
    feedbacks: Feedback[];
    readcomp_link?: string;
    post_link?: string;
}

export type Feedback = {
    personal_analytics_data: PersonalAnalyticsData;
    classifier_data: ClassifierData;
    output?: FeedbackType;
}

export enum FeedbackType {
    FOCUSED = 'focused',
    NORMAL = 'normal',
    DISTRACTED = 'distracted'
}

export type PersonalAnalyticsData = {
    num_mouse_clicks: number;
    mouse_move_distance: number;
    mouse_scroll_distance: number;
    num_keyboard_strokes: number;
    attention_feedback: FeedbackType;
}

export type ClassifierData = {
    screenshot: string;
    prediction: FeedbackType;
}

export type SessionProgressData = {
    stage: Stage;
    remainingTimeSeconds: number;
}

export enum Stage {
    WAITING = 'waiting',
    READCOMP = 'readcomp',
    HOMEWORK = 'homework',
    SURVEY = 'survey',
    FINISHED = 'finished',
}

class SessionExecutionService {
    private websocket: WebSocket | null;
    private isUploading: boolean;

    public constructor() {
        this.websocket = null;
        this.isUploading = false;
    }

    public async createStudent(studentName: string, studentPassword: string): Promise<Student> {
        const response = await api.post('/session_execution/student', {}, {
            params: {
                student_name: studentName,
                password: studentPassword
            }
        });
        return response.data;
    }

    public async getAllStudents(): Promise<Student[]> {
        const response = await api.get(
            '/session_execution/students',
            {
                params: {
                    name_manager_requesting_operation: iamService.getCurrentSession().user.username
                }
            }
        );
        return response.data;
    }

    public async getStudent(studentName: string): Promise<Student> {
        const response = await api.get('/session_execution/student', { params: { student_name: studentName } });
        return response.data;
    }

    public async getRemainingSessionsForStudent(studentName: string): Promise<Session[]> {
        let response;
        try {
            response = await api.get(`/session_execution/student/${studentName}/remaining_sessions`);
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.detail.exception)
                throw new Error(error.response?.data.detail.message);
            } else {
                toast.error('There was a problem when getting your remaining sessions');
                throw new Error('There was a problem when getting your remaining sessions');
            }
        }
        return response.data;
    }

    public async startSessionForStudent(studentName: string, updateCallback: (sessionProgressData: SessionProgressData) => void): Promise<Session> {
        try {
            const response = await api.post(`/session_execution/student/${studentName}/session`);

            this.websocket = createWebSocket(studentName);
            this.websocket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                this.initiateTrackingUpload(data.stage, data.remaining_time);
                updateCallback({
                    stage: data.stage,
                    remainingTimeSeconds: data.remaining_time
                });
            });

            try {
                await axios.post('http://localhost:8001/collection');
            } catch {
                toast.error('The feedback collection tool is not running. This was not supposed to happen. Please let someone know as soon as possible.')
            }
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.detail.message);
                throw new Error();
            } else {
                toast.error('Something went wrong when trying to start a session');
                throw new Error();
            }
        }
    }

    public async startHomeworkForStudent(studentName: string): Promise<void> {
        await api.put(`/session_execution/student/${studentName}/session/homework`);
    }

    public async finishSessionForStudent(studentName: string): Promise<Session> {
        const response = await api.put(`/session_execution/student/${studentName}/session/finished`);

        try {
            await axios.post('http://localhost:8001/stop_collection');
        } catch {
            console.log('Could not stop data collection. The collection service might not be running');
        }

        return response.data;
    }

    public async getSessionProgress(studentName: string): Promise<SessionProgressData> {
        const response = await api.get(`/session_execution/student/${studentName}/session`);
        return {
            remainingTimeSeconds: response.data.remaining_time,
            stage: response.data.stage
        };
    }

    private checkInitiateTrackingConditions(stage: Stage, remainingTimeSeconds: number): boolean {
        return !this.isUploading && stage === Stage.HOMEWORK && remainingTimeSeconds < 10 * 60
    }

    public setUpdateCallback(studentName: string, updateCallback: (sessionProgressData: SessionProgressData) => void) {
        if (this.websocket === null) {
            this.websocket = createWebSocket(studentName);
            this.websocket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                this.initiateTrackingUpload(data.stage, data.remaining_time);
                updateCallback({
                    stage: data.stage,
                    remainingTimeSeconds: data.remaining_time
                });
            });
        }
    }

    public cleanup(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isUploading = false;
    }

    private initiateTrackingUpload(stage: Stage, remainingTimeSeconds: number) {
        try {
            if (this.checkInitiateTrackingConditions(stage, remainingTimeSeconds)) {
                this.isUploading = true;
                axios.post('http://localhost:8001/tracking');
            }
        } catch {
            console.log('Something went wrong while initiating the tracking database upload')
        }
    }
}

function createWebSocket(studentName: string): WebSocket {
    const session = iamService.getCurrentSession();
    const socket = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL || "wss"}://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}${import.meta.env.VITE_BACKEND_PATH_PREFIX}/session_execution/student/${studentName}/session/observer?token=${session.token}`);

    socket.onopen = () => {
        console.log('WebSocket connection established.');
    };

    socket.onclose = (event) => {
        if (event.wasClean) {
            console.log(`WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`);
        } else {
            console.error('WebSocket connection closed unexpectedly');
            removeLocalStorage(Item.SESSION_EXECUTION_CACHE);
        }
    };

    socket.onerror = (error) => {
        console.error(`WebSocket error:`, error);
        removeLocalStorage(Item.SESSION_EXECUTION_CACHE);
    };

    return socket;
}


const sessionExecutionService = new SessionExecutionService();

export default sessionExecutionService;
