import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { UserEvent } from 'src/model/UserEvent';
import { processUserEvent } from 'src/service/user.service';

const userEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        const eventType = event.headers['X-Goog-Resource-State'];
        if (eventType !== 'sync') {
          const userEvent: UserEvent = {
            eventId: randomUUID(),
            eventType,
            primaryEmail: event.body['primaryEmail'],
          };
          await processUserEvent(userEvent);
        }
        break;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(userEvents);
