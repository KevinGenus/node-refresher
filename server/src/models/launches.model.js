const axios = require('axios');
const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLGIHT_NUMBER = 100;

// const launch = {
//     flightNumber: DEFAULT_FLGIHT_NUMBER,
//     mission: 'Kepler Exploration X',
//     rocket: 'Explorer IS1',
//     launchDate: 'December 27, 2030',
//     target: 'Kepler-442 b',
//     customers: ['ZTM', 'NASA'],
//     upcoming: true,
//     success: true,
// };

// saveLaunch(launch);

const SPACEX_API = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading data from SpaceX API');
    const response = await axios.post(SPACEX_API, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: { name: 1 },
                },
                {
                    path: 'payloads',
                    select: { customers: 1 },
                },
            ]
        },
    });

    if (response.status != 200) {
        const result = 'Error downloading SpaceX launch data'
        console.log(result);
        throw new Error(result);
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc.payloads;
        const customers = payloads.flatMap((payload) => {
            return payload.customers;
        });

        const launch = {
            flightNumber: launchDoc.flight_number,
            mission: launchDoc.name,
            rocket: launchDoc.rocket.name,
            launchDate: launchDoc.date_local,
            upcoming: launchDoc.upcoming,
            success: launchDoc.success,
            customers,
        }

        // console.log(`${launch.flightNumber}:\t${launch.mission}\t${launch.launch_date_local}`);
        await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        name: 'FalconSat',
    });

    if (firstLaunch) {
        console.log('SpaceX launch data already loaded...');
    } else {
        populateLaunches();
    }
}

async function findLaunch(filter) {
    return await launches.findOne(filter);
}

async function abortsLaunchById(flightNumber) {
    const aborted = await findLaunch({ flightNumber }, {
        upcoming: false,
        success: false,
    });

    return aborted.modifiedCount === 1;
}

async function saveLaunch(launch) {
    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, { upsert: true });
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error('No matching planet found');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = {
        ...launch,
        customers: ['Zero to Mastery', 'NASA'],
        upcoming: true,
        success: true,
        flightNumber: newFlightNumber,
    };

    await saveLaunch(newLaunch);
}

async function existsLaunchWithId(flightNumber) {
    return await launches.findOne({ flightNumber });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launches
        .findOne()
        .sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLGIHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    return await launches
        .find({}, { '_id': 0, '__v': 0, })
        .sort({ flightNumber: 1 })
        .skip(skip)
        .limit(limit);
}

module.exports = { abortsLaunchById, existsLaunchWithId, getAllLaunches, loadLaunchesData, scheduleNewLaunch };
