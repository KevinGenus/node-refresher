import applyCaseMiddleware from 'axios-case-converter';
import axios from 'axios';

const client = applyCaseMiddleware(axios.create());

const API_URL = 'http://localhost:8000/v1';

// Load planets and return as JSON.
async function httpGetPlanets() {
  const response = await client(`${API_URL}/planets`);
  return response.data;
}

// Load launches, sort by flight number, and return as JSON.
async function httpGetLaunches() {
  const response = await client(`${API_URL}/launches`);
  const { data } = response;
  return data.sort((a, b) => {
    return a.flgithtNumber - b.flightNumber;
  });
}

// Submit a new launch
async function httpSubmitLaunch(launch) {
  try {
    const data = await fetch(`${API_URL}/launches`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(launch),
    });
    return data;
  } catch (err) {
    return { ok: false };
  }
}

// async function httpSubmitLaunch(launch) {
//   try {
//     const response = await client.post(`${API_URL}/launches`, launch);
//     return response;
//   } catch (err) {
//     return { ok: false };
//   }
// }

// Delete launch with given ID.
async function httpAbortLaunch(id) {
  try {
    return await client.delete(`${API_URL}/launches/${id}`);
  } catch (err) {
    return { ok: false };
  }
}

export {
  httpGetPlanets,
  httpGetLaunches,
  httpSubmitLaunch,
  httpAbortLaunch,
};
