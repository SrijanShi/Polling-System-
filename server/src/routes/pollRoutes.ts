import express from 'express';
import PollController from '../controllers/PollController';

const router = express.Router();

router.post('/polls', PollController.createPoll.bind(PollController));

router.get('/polls/:id/state', PollController.getPollState.bind(PollController));

router.get('/polls/:id/results', PollController.getPollResults.bind(PollController));

router.get('/polls/history', PollController.getPollHistory.bind(PollController));

router.get('/current-state', PollController.getCurrentState.bind(PollController));

router.delete('/polls/:id', PollController.deletePoll.bind(PollController));

export default router;