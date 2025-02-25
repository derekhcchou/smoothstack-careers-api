import { JobSubmission } from './JobSubmission';

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  owner: Owner;
  webinarLink: string;
  webinarRegistrantId: string;
  workAuthorization: string;
  relocation: string;
  yearsOfExperience: string;
  graduationDate: string;
  degreeExpected: string;
  educationDegree: string;
  codingAbility: number;
  submissions: JobSubmission[];
  webResponses: WebResponse[];
  githubLink: string;
  fileAttachments: Attachment[];
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Attachment {
  id: number;
  type: string;
}

export interface WebResponse {
  id: number;
  dateAdded: number;
}

export interface SACandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  willRelocate: string;
  employeeType: string;
  pto: string;
  federalHolidays: string;
  healthBenefits: string;
  retirement: string;
  includeRate: string;
}
