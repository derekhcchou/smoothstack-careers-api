import axios from 'axios';

const BASE_URL = `https://codility.com/api/tests`;

export const getChallengeDetails = async (name: string, token: string) => {
  const { data } = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.results.find((t: any) => t.name === name);
};

export const generateChallenge = async (challengeId: string, candidate: any, token: string): Promise<string> => {
  const url = `${BASE_URL}/${challengeId}/invite/`;
  const invitation = {
    candidates: [
      {
        id: candidate.id,
        first_name: candidate.firstName,
        last_name: candidate.lastName,
        email: candidate.email,
      },
    ],
  };
  const { data } = await axios.post(url, invitation, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return data.candidates[0].test_link;
};
