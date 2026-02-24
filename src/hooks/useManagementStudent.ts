import { useEffect, useState } from "react";
import { useAuth } from "./auth";
import api from "@/services/api";

export type ManagementStudent = {
    name: string;
    group: string;
    survey_id?: number;
}

export default function useManagementStudent() {
    const [student, setStudent] = useState<ManagementStudent | null>(null);

    const { authState } = useAuth();

    useEffect(() => {
        async function update(): Promise<void> {
            if (authState.session) {
                const response = await api.get(`/management/student/${authState.session.user.username}`);
                setStudent(response.data);
            }
        }
        update();
    },
        [authState.session?.user.username]
    );

    return { student }
}