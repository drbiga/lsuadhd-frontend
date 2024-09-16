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
    survey_queue_link?: string;
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
    no_equipment?: boolean;
}

export type CreateSessionGroupDTO = {
    group_name: string;
    creator_manager_name: string;
    public_link: string;
}

class ManagementService {
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
        let response;
        try {
            response = await api.post('/management/student', {}, {
                params: {
                student_name: studentName,
                session_group_name: sessionGroupName,
                name_manager_requesting_operation: iamService.getCurrentSession().user.username,
            }});
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.detail)
                throw new Error(error.response?.data.detail)
            } else {
                throw new Error('There was a problem creating the student')
            }
        }

        return response.data;
    }

    public async setStudentSurveyQueueLink(studentName: string, surveyQueueLink: string): Promise<void> {
        await api.put(
            `/management/student/${studentName}/survey_queue_link`,
            {},
            {
                params: {
                    survey_queue_link: surveyQueueLink,
                    name_manager_requesting_operation: iamService.getCurrentSession().user.username,
                }
            }
        )
    }

    // public async getStudents(): Promise<Student[]> {
    //     const response = await api.get('/management/student');
    //     return response.data;
    // }

    public async getStudent(studentName: string): Promise<Student> {
        const response = await api.get(`/management/student/${studentName}`);
        return response.data;
    }

    public async getAllStudents(): Promise<Student[]> {
        try {
            const response = await api.get('/management/student', {
                params: {
                    name_manager_requesting_operation: iamService.getCurrentSession().user.username
                }
            })
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.detail.exception)
                throw new Error(error.response?.data.detail.message)
            } else {
                toast.error('Unknown error while getting the students')
                throw error
            }
        }
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
                toast.error(err.response?.data.detail.exception)
                throw new Error(err.response?.data.detail.exception);
            } else {
                toast.error('Something went wrong')
                throw new Error("Unknown error")
            }
        }
    }
}


const managementService = new ManagementService();

export default managementService;
