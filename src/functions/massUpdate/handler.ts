import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { SchedulingType } from 'src/model/SchedulingType';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { findActiveCandidates, saveCandidateFields } from 'src/service/careers.service';
import { getSchedulingLink } from 'src/util/getScheduleLink';

const massUpdate = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    let totalCandidates = [];
    let count = 0;
    let index = 0;
    do {
      const { activeCandidates, recordCount } = await findActiveCandidates(restUrl, BhRestToken, index);
      count = recordCount;
      index += 500;
      totalCandidates = [...totalCandidates, ...activeCandidates];
    } while (totalCandidates.length !== count);
    for (const candidate of totalCandidates) {
      await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
        customTextBlock3: getSchedulingLink(
          candidate.firstName,
          candidate.lastName,
          candidate.email,
          candidate.phone,
          SchedulingType.WEBINAR
        ),
      });
    }
  } catch (e) {
    console.error('Error mass updating: ', e);
  }
};

export const main = middyfy(massUpdate);
