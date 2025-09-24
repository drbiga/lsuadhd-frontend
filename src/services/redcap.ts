import axios from 'axios';
import api from '@/services/api';

export interface REDCapRecord {
    [key: string]: any;
}

export class REDCapService {
    private apiToken: string;
    private apiUrl: string;

    constructor() {
        this.apiToken = import.meta.env.VITE_REDCAP_API_TOKEN;
        this.apiUrl = 'https://redcap.rwjms.rutgers.edu/api/';
    }

    private async getSurveyId(studentName: string): Promise<string> {
        try {
            const response = await api.get('/session_execution/student', {
                params: { student_name: studentName }
            });
            return response.data.survey_id?.toString();
        } catch (error) {
            console.warn(`Failed to get survey_id for ${studentName}`, error);
            throw new Error(`Failed to get survey_id for ${studentName}`);
        }
    }

    async fetchRecord(recordId: string): Promise<REDCapRecord | null> {
        const formData = new FormData();
        formData.append('token', this.apiToken);
        formData.append('content', 'record');
        formData.append('format', 'json');
        formData.append('type', 'flat');
        formData.append('records', recordId);

        try {
            const response = await axios.post(this.apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const records = response.data;
            return records && records.length > 0 ? records[0] : null;
        } catch (error) {
            console.error('Error fetching REDCap record:', error);
            throw new Error('Failed to fetch REDCap record');
        }
    }

    async checkSurveyCompletion(studentName: string, surveyName: string): Promise<boolean> {
        try {
            const surveyId = await this.getSurveyId(studentName);
            const record = await this.fetchRecord(surveyId);

            if (!record) {
                console.warn(`No record found for survey_id: ${surveyId}`);
                return false;
            }

            const completionField = `${surveyName}_complete`;
            const completionStatus = record[completionField];

            return completionStatus === '2' || completionStatus === 2;

        } catch (error) {
            console.error(`Error checking survey completion for ${surveyName}:`, error);
            return false;
        }
    }
}

export const SURVEY_NAMES = {
    READCOMP1: "reading_comp",
    POST1: "post_surveys_1",
    READCOMP2: "reading_comp_2",
    POST2: "post_surveys_2",
    READCOMP3: "reading_comp_3",
    POST3: "post_surveys_3",
    READCOMP4: "reading_comp_4",
    POST4: "post_surveys_sus_4",
    READCOMP5: "reading_comp_5",
    POST5: "post_surveys_5",
    READCOMP6: "reading_comp_6",
    POST6: "post_surveys_6",
    READCOMP7: "reading_comp_7",
    POST7: "post_surveys_7",
    READCOMP8: "reading_comp_8",
    POST8: "post_surveys_8",
    READCOMP9: "reading_comp_9",
    POST9: "post_surveys_9",
    READCOMP10: "reading_comp_10",
    POST10: "post_surveys_10",
    READCOMP11: "reading_comp_11",
    POST11: "post_surveys_11",
    READCOMP12: "reading_comp_12",
    POST12: "post_surveys_sus_12"
} as const;

export const redcapService = new REDCapService();