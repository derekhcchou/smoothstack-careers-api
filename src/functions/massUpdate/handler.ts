import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import {
  findCandidateByEmail,
  findCandidates,
  findChallengeSubmissions,
  findEmptyLinkSubmissions,
  findNotChallengeSubmissions,
  saveCandidateFields,
  saveSubmissionFields,
} from 'src/service/careers.service';
import { generateChallengeLink, getChallengeDetails } from 'src/service/challenge.service';
import { getCodilitySecrets } from 'src/service/secrets.service';
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

const massUpdate = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    let totalSubmissions = [];
    let count = 0;
    let index = 0;

    const { submissions: challengeSubmissions } = await findChallengeSubmissions(restUrl, BhRestToken, index);
    const candidateChallengeIds = challengeSubmissions.map((s) => s.candidate.id);

    do {
      const { submissions, recordCount } = await findNotChallengeSubmissions(restUrl, BhRestToken, index);
      count = recordCount;
      index += 500;
      totalSubmissions = [...totalSubmissions, ...submissions];
    } while (totalSubmissions.length !== count);

    for (const submission of totalSubmissions) {
      if (!candidateChallengeIds.includes(submission.candidate.id)) {
        await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, {
          customText9: '',
        });
      }
    }
  } catch (e) {
    console.error('Error mass updating: ', e);
  }
};

// const massUpdate = async (event: APIGatewayEvent) => {
//   try {
//     const { restUrl, BhRestToken } = await getSessionData();
//     const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();
//     let totalSubmissions = [];
//     let count = 0;
//     let index = 0;

//     do {
//       const { submissions, recordCount } = await findEmptyLinkSubmissions(restUrl, BhRestToken, index);
//       count = recordCount;
//       index += 500;
//       totalSubmissions = [...totalSubmissions, ...submissions];
//     } while (totalSubmissions.length !== count);

//     for (const submission of totalSubmissions) {
//       const { id: challengeId } = await getChallengeDetails(submission.jobOrder.customText1, BEARER_TOKEN);
//       const challengeLink = await generateChallengeLink(
//         challengeId,
//         submission.candidate,
//         BEARER_TOKEN,
//         `${CALLBACK_URL}?submissionId=${submission.id}`
//       );
//       const challengeSchedulingLink = getSchedulingLink(
//         submission.candidate.firstName,
//         submission.candidate.lastName,
//         `${submission.id}@smoothstack.com`,
//         submission.candidate.phone,
//         SchedulingTypeId.CHALLENGE_V2
//       );
//       await saveSubmissionFields(restUrl, BhRestToken, submission.id, {
//         customText10: challengeLink,
//         customTextBlock1: challengeSchedulingLink,
//       });
//     }
//   } catch (e) {
//     console.error('Error mass updating: ', e);
//   }
// };

export const main = middyfy(massUpdate);
