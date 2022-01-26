import { Request, Response } from 'express'

import CaseloadRoutes from './caseload'
import LicenceService from '../../../services/licenceService'
import CaseloadService from '../../../services/caseloadService'
import { CaseTypeAndStatus } from '../../../@types/managedCase'
import { LicenceSummary } from '../../../@types/licenceApiClientTypes'
import statusConfig from '../../../licences/licenceStatus'
import LicenceStatus from '../../../enumeration/licenceStatus'
import LicenceType from '../../../enumeration/licenceType'

const licenceService = new LicenceService(null, null, null) as jest.Mocked<LicenceService>
const caseloadService = new CaseloadService(null, null, null) as jest.Mocked<CaseloadService>

jest.mock('../../../services/licenceService')
jest.mock('../../../services/caseloadService')

describe('Route Handlers - Create Licence - Caseload', () => {
  const handler = new CaseloadRoutes(licenceService, caseloadService)
  let req: Request
  let res: Response

  beforeEach(() => {
    caseloadService.getStaffCaseload.mockResolvedValue([
      {
        crnNumber: 'X381306',
        firstName: 'Joe',
        lastName: 'Rogan',
        conditionalReleaseDate: '2022-10-12',
        prisonerNumber: '123',
        licenceStatus: LicenceStatus.IN_PROGRESS,
        licenceType: LicenceType.AP,
      },
    ] as unknown as CaseTypeAndStatus[])

    caseloadService.getTeamCaseload.mockResolvedValue([
      {
        crnNumber: 'X381306',
        firstName: 'Joe',
        lastName: 'Rogan',
        conditionalReleaseDate: '2022-10-12',
        prisonerNumber: '123',
        licenceStatus: LicenceStatus.IN_PROGRESS,
        licenceType: LicenceType.AP,
        allocated: true,
        staffIdentifier: 3000,
        staffForename: 'Sherlock',
        staffSurname: 'Holmes',
      },
      {
        crnNumber: 'X381307',
        firstName: 'Dr',
        lastName: 'Who',
        conditionalReleaseDate: '2023-10-12',
        prisonerNumber: '124',
        licenceStatus: LicenceStatus.IN_PROGRESS,
        licenceType: LicenceType.AP_PSS,
        allocated: false,
      },
    ] as unknown as CaseTypeAndStatus[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    beforeEach(() => {
      req = {
        query: {},
      } as Request

      res = {
        render: jest.fn(),
        locals: {
          user: {
            firstName: 'Joe',
            lastName: 'Bloggs',
            username: 'USER1',
            deliusStaffIdentifier: 2000,
          },
        },
      } as unknown as Response
    })

    it('should render view with My Cases tab selected', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create/caseload', {
        caseload: [
          {
            name: 'Joe Rogan',
            crnNumber: 'X381306',
            conditionalReleaseDate: '12th October 2022',
            prisonerNumber: '123',
            licenceStatus: LicenceStatus.IN_PROGRESS,
            licenceType: LicenceType.AP,
            probationPractitioner: {
              name: 'Joe Bloggs',
              staffId: 2000,
            },
          },
        ],
        statusConfig,
        teamView: false,
      })
      expect(caseloadService.getStaffCaseload).toHaveBeenCalledWith(res.locals.user)
      expect(caseloadService.getTeamCaseload).not.toHaveBeenCalled()
    })

    it('should render view with Team Cases tab selected', async () => {
      req.query = { view: 'team' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create/caseload', {
        caseload: [
          {
            name: 'Joe Rogan',
            crnNumber: 'X381306',
            conditionalReleaseDate: '12th October 2022',
            prisonerNumber: '123',
            licenceStatus: LicenceStatus.IN_PROGRESS,
            licenceType: LicenceType.AP,
            probationPractitioner: {
              name: 'Sherlock Holmes',
              staffId: 3000,
            },
          },
          {
            name: 'Dr Who',
            crnNumber: 'X381307',
            conditionalReleaseDate: '12th October 2023',
            prisonerNumber: '124',
            licenceStatus: LicenceStatus.IN_PROGRESS,
            licenceType: LicenceType.AP_PSS,
            probationPractitioner: null,
          },
        ],
        statusConfig,
        teamView: true,
      })
      expect(caseloadService.getTeamCaseload).toHaveBeenCalledWith(res.locals.user)
      expect(caseloadService.getStaffCaseload).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      req = {
        body: {
          prisonerNumber: '123',
        },
      } as Request

      res = {
        redirect: jest.fn(),
        locals: {
          user: {
            username: 'USER1',
          },
        },
      } as unknown as Response
      licenceService.getLicencesByNomisIdsAndStatus.mockResolvedValue([])
    })

    it('should redirect to check your answers page if the selected person already has a licence', async () => {
      licenceService.getLicencesByNomisIdsAndStatus.mockResolvedValue([
        { licenceId: 1 },
        { licenceId: 2 },
      ] as LicenceSummary[])

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/licence/create/id/1/check-your-answers')
      expect(licenceService.createLicence).not.toBeCalled()
      expect(licenceService.getLicencesByNomisIdsAndStatus).toHaveBeenCalledWith(['123'], [], res.locals.user)
    })

    it('should create a licence and redirect to the initial meeting screen', async () => {
      licenceService.createLicence.mockResolvedValue({ licenceId: 1 } as LicenceSummary)

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/licence/create/id/1/initial-meeting-name')
      expect(licenceService.createLicence).toHaveBeenCalledWith('123', res.locals.user)
    })
  })
})
