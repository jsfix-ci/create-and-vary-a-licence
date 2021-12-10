import { Request, Response } from 'express'
import LicenceService from '../../../services/licenceService'

export default class InitialMeetingContactRoutes {
  constructor(private readonly licenceService: LicenceService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create/initialMeetingContact')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { licenceId } = req.params
    const { user } = res.locals
    await this.licenceService.updateContactNumber(licenceId, req.body, user)

    if (req.query?.fromReview) {
      res.redirect(`/licence/create/id/${licenceId}/check-your-answers`)
    } else {
      res.redirect(`/licence/create/id/${licenceId}/initial-meeting-time`)
    }
  }
}
