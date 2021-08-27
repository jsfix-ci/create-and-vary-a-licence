import { Request, Response } from 'express'

export default class InitialMeetingTimeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const offender = {
      name: 'Adam Balasaravika',
    }
    res.render('pages/create/initialMeetingTime', { offender })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    res.redirect(`/licence/create/id/${id}/additional-conditions-question`)
  }
}
