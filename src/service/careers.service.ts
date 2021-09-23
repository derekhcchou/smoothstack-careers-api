import axios from 'axios';
import FormData from 'form-data';
import { Appointment } from 'src/model/Appointment';
import { Candidate } from 'src/model/Candidate';
import { CandidateExtraFields } from 'src/model/CandidateExtraFields';
import { ChallengeSession } from 'src/model/ChallengeEvent';
import { JobOrder } from 'src/model/JobOrder';
import { SchedulingType } from 'src/model/SchedulingType';
import { WebinarRegistration } from 'src/model/WebinarRegistration';

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
      fields: 'id,firstName,lastName,email,phone,customText9',
    },
  });

  const { customText9, ...candidate } = data.data;
  return {
    ...candidate,
    challengeLink: customText9,
  };
};

export const findCandidateByEmail = async (url: string, BhRestToken: string, email: string): Promise<Candidate> => {
  const candidateQueryUrl = `${url}search/Candidate`;
  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields: 'id,firstName,lastName,email,customText9,customTextBlock4,customText36',
      query: `email:${email}`,
      count: '1',
    },
  });

  const { customText9, customTextBlock4, customText36, ...candidate } = data.data[0];
  return {
    ...candidate,
    challengeLink: customText9,
    webinarLink: customTextBlock4,
    webinarRegistrantId: customText36,
  };
};

export const findCandidateByAppointment = async (
  url: string,
  BhRestToken: string,
  appointmentId: number,
  schedulingType: SchedulingType
): Promise<Candidate> => {
  const candidateQueryUrl = `${url}search/Candidate`;
  const appointmentIdField =
    schedulingType === SchedulingType.CHALLENGE
      ? 'customText34'
      : schedulingType === SchedulingType.WEBINAR
      ? 'customText37'
      : '';
  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields: 'id,firstName,lastName,email,customText9,customText36',
      query: `${appointmentIdField}:${appointmentId}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customText9, customTextBlock4, customText36, ...candidate } = data.data[0];
    return {
      ...candidate,
      webinarLink: customTextBlock4,
      challengeLink: customText9,
      webinarRegistrantId: customText36,
    };
  }
  return undefined;
};

export const populateCandidateFields = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fields: CandidateExtraFields
): Promise<Candidate> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    city: fields.city,
    state: fields.state,
    zip: fields.zip,
    customText4: fields.workAuthorization,
    customText25: fields.relocation,
    customText7: fields.codingAbility,
    customText3: fields.yearsOfExperience,
    ...(fields.graduationDate && {
      customDate3: fields.graduationDate,
      customText32: isGraduatingWithin4Months(new Date(fields.graduationDate)),
    }),
    ...(fields.degreeExpected && { degreeList: fields.degreeExpected }),
    ...(fields.highestDegree && { educationDegree: fields.highestDegree }),
    customText2: fields.militaryStatus,
  };
  const { data } = await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  return data.data;
};

const isGraduatingWithin4Months = (graduationDate: Date) => {
  const today = new Date();
  let diff = (today.getTime() - graduationDate.getTime()) / 1000;
  diff /= 60 * 60 * 24 * 7 * 4;
  const result = Math.abs(Math.round(diff));
  return result <= 4 ? 'Yes' : 'No';
};

export const saveApplicationNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  application: any
): Promise<void> => {
  const noteUrl = `${url}entity/Note`;
  const comments = generateComments(application);
  const note = {
    action: 'Application Survey',
    comments: Object.keys(comments).reduce((acc, q, i) => `${acc}Q${i + 1} - ${q}\nA${i + 1} - ${comments[q]}\n\n`, ''),
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };
  await axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

export const saveSchedulingNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  eventType: SchedulingType,
  schedulingType: string,
  date: string
): Promise<any> => {
  const noteUrl = `${url}entity/Note`;
  const formattedDate = date
    ? ` for: ${new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'short',
        timeStyle: 'short',
      })}`
    : '';
  const comments = `${eventType} Appointment has been ${schedulingType} for candidate${formattedDate}`;
  const note = {
    action: 'Scheduling Action',
    comments,
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };
  return axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

const generateComments = (application: any): any => ({
  'First Name': application.firstName,
  'Last Name': application.lastName,
  Email: application.email,
  'Mobile Phone': application.phone,
  City: application.city,
  State: application.state,
  'Zip Code': application.zip,
  'Are you legally Authorized to work in the U.S?': application.workAuthorization,
  'Willingness to relocate': application.relocation,
  'How would you rank your coding ability? (0 - lowest, 10 - highest)': application.codingAbility,
  'Years of Experience (Including Personal/Educational Projects)': application.yearsOfExperience,
  'Are you currently a student?': application.currentlyStudent,
  ...(application.graduationDate && { 'Expected Graduation Date': application.graduationDate }),
  ...(application.degreeExpected && { 'Degree Expected': application.degreeExpected }),
  ...(application.highestDegree && { 'Highest Degree Achieved': application.highestDegree }),
  ...(application.major && { Major: application.major }),
  'Military Status': application.militaryStatus,
  ...(application.militaryBranch && { 'Military Branch': application.militaryBranch }),
});

export const saveSchedulingDataByEmail = async (
  url: string,
  BhRestToken: string,
  status: string,
  appointment: Appointment,
  type: SchedulingType,
  webinarRegistration?: WebinarRegistration
): Promise<Candidate> => {
  const { id: appointmentId, email: candidateEmail, datetime: date } = appointment;
  const candidate = await findCandidateByEmail(url, BhRestToken, candidateEmail);
  const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

  let updateData: any;
  switch (type) {
    case SchedulingType.CHALLENGE:
      updateData = {
        customText28: status,
        customText34: appointmentId,
        customDate11: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
      };
      break;
    case SchedulingType.WEBINAR:
      updateData = {
        customText30: status,
        customText37: appointmentId,
        customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customTextBlock4: webinarRegistration.joinUrl,
        customText36: webinarRegistration.registrantId,
      };
      break;
  }

  const noteAction = saveSchedulingNote(url, BhRestToken, candidate.id, type, status, date);
  const schedulingAction = axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  const actions = [schedulingAction, noteAction];

  await Promise.all(actions);
  return candidate;
};

export const saveSchedulingDataByAppointmentId = async (
  url: string,
  BhRestToken: string,
  status: string,
  appointmentId: number,
  date: string,
  type: SchedulingType,
  webinarRegistration?: WebinarRegistration
): Promise<Candidate> => {
  const candidate = await findCandidateByAppointment(url, BhRestToken, appointmentId, type);
  if (candidate) {
    const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

    let updateData: any;
    switch (type) {
      case SchedulingType.CHALLENGE:
        updateData = {
          customText28: status,
          customDate11: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        };
        break;
      case SchedulingType.WEBINAR:
        updateData = {
          customText30: status,
          customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
          ...(webinarRegistration && { customTextBlock4: webinarRegistration.joinUrl }),
          ...(webinarRegistration && { customText36: webinarRegistration.registrantId }),
        };
        break;
    }

    const noteAction = saveSchedulingNote(url, BhRestToken, candidate.id, type, status, date);
    const schedulingAction = axios.post(candidateUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
    const actions = [schedulingAction, noteAction];

    await Promise.all(actions);
  }
  return candidate;
};

export const saveChallengeResult = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession
): Promise<void> => {
  const { candidate: candidateId, evaluation } = challengeSession;
  const score = Math.round((evaluation.result / evaluation.max_result) * 100);
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    customText29: score,
  };

  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const saveChallengeSimilarity = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession
): Promise<void> => {
  const { candidate: candidateId, similarity } = challengeSession;
  if (similarity) {
    const candidateUrl = `${url}entity/Candidate/${candidateId}`;
    const updateData = {
      customText33: similarity.text,
    };

    return axios.post(candidateUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
  }
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

export const saveCandidateLinks = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  challengeLink: string,
  challengeSchedulingLink: string,
  webinarSchedulingLink: string
) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    customText9: challengeLink,
    customTextBlock2: challengeSchedulingLink,
    customTextBlock3: webinarSchedulingLink,
  };
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
