import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import axios from 'axios';
import { Appointment } from 'src/model/Appointment';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import {
  findCandidateByEmail,
  findCandidates,
  findChallengeSubmissions,
  findEmptyLinkSubmissions,
  findNotChallengeSubmissions,
  findScheduledSubmissions,
  saveCandidateFields,
  saveSubmissionFields,
} from 'src/service/careers.service';
import { generateChallengeLink, getChallengeDetails } from 'src/service/challenge.service';
import { getCodilitySecrets, getSquareSpaceSecrets } from 'src/service/secrets.service';
import { getSchedulingLink } from 'src/util/links';

// const massUpdate = async (event: APIGatewayEvent) => {
//   try {
//     const { restUrl, BhRestToken } = await getSessionData();
//     const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();
//     // let totalCandidates = [];
//     // let count = 0;
//     // let index = 0;
//     // do {
//     //   const { candidates, recordCount } = await findCandidates(restUrl, BhRestToken, index);
//     //   count = recordCount;
//     //   index += 500;
//     //   totalCandidates = [...totalCandidates, ...candidates];
//     // } while (totalCandidates.length !== count);
//     // for (const candidate of totalCandidates) {
//     //   await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
//     //     customTextBlock5: getSchedulingLink(
//     //       candidate.firstName,
//     //       candidate.lastName,
//     //       candidate.email,
//     //       candidate.phone,
//     //       SchedulingTypeId.TECHSCREEN
//     //     ),
//     //   });
//     // }
//     const emails = [
//       'shawnsprewell@gmail.com'
//     ];
//     for (const email of emails) {
//       const candidate = await findCandidateByEmail(restUrl, BhRestToken, email);
//       const { id: challengeId } = await getChallengeDetails('Smoothstack Coding Test (C++)', BEARER_TOKEN);
//       const challengeLink = await generateChallengeLink(challengeId, candidate, BEARER_TOKEN, CALLBACK_URL);
//       await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
//         customText9: challengeLink,
//       });
//     }
//   } catch (e) {
//     console.error('Error mass updating: ', e);
//   }
// };

// const massUpdate = async (event: APIGatewayEvent) => {
//   try {
//     const { restUrl, BhRestToken } = await getSessionData();
//     let totalSubmissions = [];
//     let count = 0;
//     let index = 0;

//     const { submissions: challengeSubmissions } = await findChallengeSubmissions(restUrl, BhRestToken, index);
//     const candidateChallengeIds = challengeSubmissions.map((s) => s.candidate.id);

//     do {
//       const { submissions, recordCount } = await findNotChallengeSubmissions(restUrl, BhRestToken, index);
//       count = recordCount;
//       index += 500;
//       totalSubmissions = [...totalSubmissions, ...submissions];
//     } while (totalSubmissions.length !== count);

//     for (const submission of totalSubmissions) {
//       if (!candidateChallengeIds.includes(submission.candidate.id)) {
//         if (submission.candidate.customText9) {
//           console.log(submission.candidate);
//           await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, {
//             customText9: '',
//           });
//         }
//       }
//     }
//   } catch (e) {
//     console.error('Error mass updating: ', e);
//   }
// };

const massUpdate = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    const { apiKey, userId } = await getSquareSpaceSecrets();

    let totalSubmissions = [];
    let count = 0;
    let index = 0;

    do {
      const { submissions, recordCount } = await findScheduledSubmissions(restUrl, BhRestToken, index);
      count = recordCount;
      index += 500;
      totalSubmissions = [...totalSubmissions, ...submissions];
    } while (totalSubmissions.length !== count);

    for (const submission of totalSubmissions) {
      console.log(submission);
      const appointment = await findAppointmentByEmail(apiKey, userId, `coding_challenge_${submission.id}@smoothstack.com`);
      if (appointment) {
        await saveSubmissionFields(restUrl, BhRestToken, submission.id, {
          customText16: appointment.id,
        });
      }
    }
  } catch (e) {
    console.error('Error mass updating: ', e);
  }
};

const findAppointmentByEmail = async (apiKey: string, userId: string, email: string): Promise<Appointment> => {
  const url = `https://acuityscheduling.com/api/v1/appointments`;

  const { data } = await axios.get(url, {
    params: {
      email,
      appointmentTypeID: '23126009',
    },
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data[0];
};

export const main = middyfy(massUpdate);
