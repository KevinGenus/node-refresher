const {
    existsLaunchWithId,
    getAllLaunches,
    abortsLaunchById,
    scheduleNewLaunch,
} = require('../../models/launches.model');
const launchesRouter = require('./launches.router');

async function httpAbortLaunch(req, res) {
    const launchId = Number(req.params.id);
    const existsLaunch = await existsLaunchWithId(launchId);

    if (!existsLaunch) {
        return res.status(404).json({
            error: 'Launch Not Found',
        });
    }

    const aborted = await abortsLaunchById(launchId);
    if (!aborted) {
        return res.status(400).json({ error: 'Launch not aborted' });
    }
    return res.status(200).json({ ok: true });
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;

    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        return res.status(400).json({ error: 'Missing required launch property' });
    }

    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({ error: 'Invalid launch date' });
    }

    await scheduleNewLaunch(launch);
    res.status(201).json(launch);
}

const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    const { skip, limit } = getPagination(req.query);
    return res.status(200).json(await getAllLaunches(skip, limit));
}

module.exports = { httpAbortLaunch, httpAddNewLaunch, httpGetAllLaunches, };
