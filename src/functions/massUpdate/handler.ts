import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { findCandidates, saveCandidateFields } from 'src/service/careers.service';
import { getPrescreeningLink } from 'src/util/links';

const massUpdate = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    let totalCandidates = [];
    let count = 0;
    let index = 0;
    do {
      const { candidates, recordCount } = await findCandidates(restUrl, BhRestToken, index);
      count = recordCount;
      index += 500;
      totalCandidates = [...totalCandidates, ...candidates];
    } while (totalCandidates.length !== count);
    for (const candidate of totalCandidates) {
      await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
        customTextBlock6: getPrescreeningLink({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          relocation: candidate.customText25 ?? '',
        } as any),
      });
    }
  } catch (e) {
    console.error('Error mass updating: ', e);
  }
};

export const main = middyfy(massUpdate);
