import { SNSEvent } from 'aws-lambda';
import { LinksGenerationRequest } from 'src/model/LinksGenerationRequest';
import { getPrescreeningLink, getSchedulingLink } from 'src/util/links';
import { fetchCandidate, fetchSubmission, saveCandidateLinks, saveSubmissionLinks } from './careers.service';
import { generateChallengeLink, getChallengeDetails } from './challenge.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getCodilitySecrets } from './secrets.service';
import { SchedulingTypeId } from 'src/model/SchedulingType';

export const generateLinks = async (event: SNSEvent) => {
  console.log('Received Links Generation Request.');
  const request: LinksGenerationRequest = JSON.parse(event.Records[0].Sns.Message);

  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();

  const {
    id: submissionId,
    challengeLink,
    candidate,
    jobOrder,
  } = await fetchSubmission(restUrl, BhRestToken, request.submissionId);

  if (!challengeLink) {
    const { submissions } = await fetchCandidate(restUrl, BhRestToken, candidate.id);
    const matchedSubmission = submissions.find(
      (s) =>
        s.id !== submissionId &&
        s.challengeLink &&
        s.jobOrder.challengeName === jobOrder.challengeName &&
        !s.previousChallengeId
    );
    if (matchedSubmission) {
      await saveSubmissionLinks(
        restUrl,
        BhRestToken,
        submissionId,
        matchedSubmission.challengeLink,
        '',
        matchedSubmission.id,
        matchedSubmission.challengeScore
      );
      console.log('Previously existing submission with same challenge existing for submission:');
    } else {
      const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);
      const challengeLink = await generateChallengeLink(
        challengeId,
        candidate,
        BEARER_TOKEN,
        `${CALLBACK_URL}?submissionId=${submissionId}`
      );
      const challengeSchedulingLink = getSchedulingLink(
        candidate.firstName,
        candidate.lastName,
        `coding_challenge_${submissionId}@smoothstack.com`,
        candidate.phone,
        SchedulingTypeId.CHALLENGE_V2
      );
      const webinarSchedulingLink = getSchedulingLink(
        candidate.firstName,
        candidate.lastName,
        candidate.email,
        candidate.phone,
        SchedulingTypeId.WEBINAR
      );
      const preScreeningLink = getPrescreeningLink(candidate);
      const techScreenSchedulingLink = getSchedulingLink(
        candidate.firstName,
        candidate.lastName,
        candidate.email,
        candidate.phone,
        SchedulingTypeId.TECHSCREEN
      );

      const requests = [
        saveSubmissionLinks(restUrl, BhRestToken, submissionId, challengeLink, challengeSchedulingLink),
        saveCandidateLinks(
          restUrl,
          BhRestToken,
          candidate.id,
          webinarSchedulingLink,
          preScreeningLink,
          techScreenSchedulingLink
        ),
      ];
      await Promise.all(requests);
      console.log('Successfully generated links for submission:');
    }
  } else {
    console.log('Submission already has a challenge link. Submission not processed:');
  }
  console.log(`Submission ID: ${submissionId}`);
  console.log({ jobOrder, candidate });
};
