import axios from 'axios';
import FormData from 'form-data';
import { Candidate } from 'src/model/Candidate';
import { JobOrder } from 'src/model/JobOrder';

export const createWebResponse = async (careerId: string, application: any, resume: any): Promise<any> => {
  // these are public non-secret values
  const corpId = '7xjpg0';
  const swimlane = '32';
  const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com/rest-services/${corpId}/apply/${careerId}/raw`;

  const form = new FormData();
  form.append('resume', resume.content, resume.filename);

  const res = await axios.post(webResponseUrl, form, {
    params: { ...application, externalID: 'Resume', type: 'Resume' },
    headers: form.getHeaders(),
  });

  return res.data.candidate;
};

export const fetchCandidate = async (url: string, BhRestToken: string, candidateId: number): Promise<Candidate> => {
  const candidatesUrl = `${url}entity/Candidate/${candidateId}`;
  const { data } = await axios.get(candidatesUrl, {
    params: {
      BhRestToken,
      fields: 'id,firstName,lastName,email,customText9',
    },
  });

  const { customText9, ...candidate } = data.data;
  return {
    ...candidate,
    challengeLink: customText9,
  };
};

export const fetchJobOrder = async (url: string, BhRestToken: string, jobOrderId: number): Promise<JobOrder> => {
  const jobOrdersUrl = `${url}entity/JobOrder/${jobOrderId}`;
  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields: 'id,customText1',
    },
  });

  const { customText1, ...jobOrder } = data.data;
  return {
    ...jobOrder,
    challengeName: customText1,
  };
};

export const saveChallengeLink = async (url: string, BhRestToken: string, candidateId: number, link: string) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = { customText9: link };
  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const fetchNewSubmissions = async (url: string, BhRestToken: string): Promise<any[]> => {
  const ids = await fetchNewJobSubmissionsIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const submissionsUrl = `${url}entity/JobSubmission/${ids.join(',')}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields: 'candidate,jobOrder,status,isDeleted',
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];
  const filteredSubs = submissionArr.filter((sub) => !sub.isDeleted && sub.status === 'Internally Submitted');

  return filteredSubs;
};

export const fetchNewJobSubmissionsIds = async (url: string, BhRestToken: string): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/1`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 100,
    },
  });

  const newJobSubmissionIds = data.events?.map((e: any) => e.entityId);
  return newJobSubmissionIds ?? [];
};
