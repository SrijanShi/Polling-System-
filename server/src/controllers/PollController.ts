import { Request, Response } from 'express'
import PollService from '../services/PollService'
import { AppError, handleError } from '../utils/errorHandler'

class PollController {

  async createPoll(req: Request, res: Response): Promise<void> {
    try {

      const question = req.body.question
      const options = req.body.options
      const timerDuration = req.body.timerDuration

      if (!question || !options || !Array.isArray(options)) {
        throw new AppError('Question and options are required',400)
      }

      const poll = await PollService.createPoll(
        question,
        options,
        timerDuration ? timerDuration : 60
      )

      res.status(201).json({
        success: true,
        message: 'Poll created successfully',
        data: {
          pollId: poll._id,
          question: poll.question,
          options: poll.options,
          timerDuration: poll.timerDuration,
          status: poll.status
        }
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }


  async getPollState(req: Request, res: Response): Promise<void> {
    try {

      const pollId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const sessionId = req.query.sessionId

      if (!pollId) {
        throw new AppError('Poll ID is required',400)
      }

      const pollState = await PollService.getPollState(
        pollId,
        sessionId as string
      )

      res.status(200).json({
        success: true,
        data: pollState
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }


  async getPollHistory(req: Request, res: Response): Promise<void> {
    try {

      const history = await PollService.getPollHistory()

      res.status(200).json({
        success: true,
        data: {
          polls: history,
          count: history.length
        }
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }


  async getCurrentState(req: Request, res: Response): Promise<void> {
    try {

      const sessionId = req.query.sessionId

      const activePoll = await PollService.getActivePoll()

      if (!activePoll) {

        res.status(200).json({
          success: true,
          data: {
            hasActivePoll: false,
            poll: null
          }
        })

        return
      }

      const pollState = await PollService.getPollState(
        activePoll._id.toString(),
        sessionId as string
      )

      res.status(200).json({
        success: true,
        data: {
          hasActivePoll: true,
          poll: pollState
        }
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }


  async getPollResults(req: Request, res: Response): Promise<void> {
    try {

      const pollId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

      if (!pollId) {
        throw new AppError('Poll ID is required',400)
      }

      const results = await PollService.getPollResults(pollId)

      res.status(200).json({
        success: true,
        data: results
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }


  async deletePoll(req: Request, res: Response): Promise<void> {
    try {

      const pollId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

      if (!pollId) {
        throw new AppError('Poll ID is required',400)
      }

      await PollService.deletePoll(pollId)

      res.status(200).json({
        success: true,
        message: 'Poll deleted successfully'
      })

    } catch (error: any) {

      const errorResponse = handleError(error)
      res.status(errorResponse.statusCode).json(errorResponse)

    }
  }

}

export default new PollController()