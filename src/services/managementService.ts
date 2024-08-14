import { toast } from "react-toastify";
import api from "./api";
import iamService from "./iam";
import { AxiosError } from "axios";

export type Manager = {
    name: string;
}

export type Student = {
    name: string;
    group: string;
}

export type SessionGroup = {
    group_name: string;
    creator_manager_name: string;
    public_link: string;
    created_on: Date;
    sessions: Session[];
}

export type Session = {
    seqnum: number;
    is_passthrough: boolean;
    has_feedback: boolean;
}

export type CreateSessionGroupDTO = {
    group_name: string;
    creator_manager_name: string;
    public_link: string;
}

class ManagementService {
    private sessionGroups: SessionGroup[] | null;

    public constructor() {
        this.sessionGroups = null;
    }

    public async createManager(managerName: string): Promise<Manager> {
        const response = await api.post('/management/manager', {
        }, {
            params: {
                manager_name: managerName,
                name_manager_requesting_operation: iamService.getCurrentSession().user.username
            }
        });
        return response.data;
    }

    public async getManagers(): Promise<Manager[]> {
        const response = await api.get('/management/manager', {
            params: {
                name_manager_requesting_operation: iamService.getCurrentSession().user.username
            }
        });
        return response.data;
    }

    public async createStudent(studentName: string, sessionGroupName: string): Promise<Student> {
        const response = await api.post('/management/student', {}, {
            params: {
            student_name: studentName,
            session_group_name: sessionGroupName,
            name_manager_requesting_operation: iamService.getCurrentSession().user.username,
        }});
        return response.data;
    }

    // public async getStudents(): Promise<Student[]> {
    //     const response = await api.get('/management/student');
    //     return response.data;
    // }

    public async getStudent(studentName: string): Promise<Student> {
        const response = await api.get(`/management/student/${studentName}`);
        return response.data;
    }

    public async createSessionGroup(createSessionGroupDTO: CreateSessionGroupDTO): Promise<SessionGroup> {
        const response = await api.post('/management/session_group', createSessionGroupDTO);
        return response.data;
    }

    public async getAllSessionGroups(): Promise<SessionGroup[]> {
        const response = await api.get('/management/session_group', {
            params: {
                name_manager_requesting_operation: iamService.getCurrentSession().user.username
            }
        });

        return response.data;
    }

    public async getSessionGroup(sessionGroupName: string): Promise<SessionGroup> {
        const response = await api.get(`/management/session_group/${sessionGroupName}`, {
            params: {
                manager_name: iamService.getCurrentSession().user.username
            }
        });

        return response.data;
    }

    public async createSession(
        sessionGroupName: string,
        sessionSeqnum: number,
        sessionHasFeedback: boolean,
        sessionIsPassthrough: boolean
    ): Promise<Session> {
        try {
            const response = await api.post('/management/session', {
                session_group_name: sessionGroupName,
                seqnum: sessionSeqnum,
                is_passthrough: sessionIsPassthrough,
                has_feedback: sessionHasFeedback
            }, {
                params: {
                    manager_name: iamService.getCurrentSession().user.username
                }
            });
            return response.data;
        } catch (err) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data.detail.message)
                throw new Error(err.response?.data.detail.message);
            } else {
                toast.error('Something went wrong')
                throw new Error("Unknown error")
            }
        }
    }
}


const managementService = new ManagementService();

export default managementService;
