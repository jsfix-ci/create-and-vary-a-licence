import nock from 'nock'
import config from '../config'
import PrisonerService from '../services/prisonerService'
import HmppsAuthClient from './hmppsAuthClient'
import {
  PrisonApiCaseload,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
  PrisonApiUserDetail,
  PrisonInformation,
} from '../@types/prisonApiClientTypes'
import PrisonApiClient from './prisonApiClient'
import UserService from '../services/userService'

jest.mock('./hmppsAuthClient')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

// Use the real prisonService, userService and prisonApiClient, but mock the prisonAPI endpoints using nock
const prisonerService = new PrisonerService(hmppsAuthClient)
let prisonApiClient: PrisonApiClient
let userService: UserService

describe('Prison API client tests', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    prisonApiClient = new PrisonApiClient('a token')
    userService = new UserService(hmppsAuthClient, prisonApiClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('Prisoner detail - admin token', () => {
    const stubbedPrisonerData = {
      offenderNo: 'A1234AA',
      firstName: 'Ringo',
      lastName: 'Starr',
      latestLocationId: 'LEI',
      locationDescription: 'Inside - Leeds HMP',
      dateOfBirth: '24/06/2000',
      age: 21,
      activeFlag: true,
      legalStatus: 'REMAND',
      category: 'Cat C',
      imprisonmentStatus: 'LIFE',
      imprisonmentStatusDescription: 'Serving Life Imprisonment',
      religion: 'Christian',
      sentenceDetail: {
        sentenceStartDate: '12/12/2019',
        additionalDaysAwarded: 4,
        tariffDate: '12/12/2030',
        releaseDate: '12/12/2028',
        conditionalReleaseDate: '12/12/2025',
        confirmedReleaseDate: '12/12/2026',
        sentenceExpiryDate: '16/12/2030',
        licenceExpiryDate: '16/12/2030',
      } as PrisonApiSentenceDetail,
    } as PrisonApiPrisoner

    it('Get prisoner detail', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
      fakeApi.get('/api/offenders/AA1234A', '').reply(200, stubbedPrisonerData)
      const data = await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      expect(data).toEqual(stubbedPrisonerData)
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })

    it('Prisoner detail - error no admin token', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('')
      fakeApi.get('/api/offenders/AA1234A', '').reply(401)
      try {
        await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      } catch (e) {
        expect(e.message).toContain('Unauthorized')
      }
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })

    it('Prisoner detail - not found', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
      fakeApi.get('/api/offenders/AA1234A', '').reply(404)
      try {
        await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      } catch (e) {
        expect(e.message).toContain('Not Found')
      }
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })
  })

  describe('Prison information - admin token', () => {
    const stubbedPrisonData = {
      addressType: 'BUS',
      agencyId: 'MDI',
      agencyType: 'INST',
      description: 'Moorland (HMP)',
      formattedDescription: 'Moorland (HMP)',
    } as PrisonInformation

    it('Get prison information', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
      fakeApi.get('/api/agencies/prison/MDI').reply(200, stubbedPrisonData)
      const result = await prisonerService.getPrisonInformation('XTEST1', 'MDI')
      expect(result.agencyId).toEqual('MDI')
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })
  })

  describe('Prisoner detail - access with user token', () => {
    const stubbedPrisonUserData = {
      accountStatus: 'ACTIVE',
      active: true,
      activeCaseLoadId: 'MDI',
      expiredFlag: false,
      firstName: 'Robert',
      lastName: 'Charles',
      lockedFlag: false,
      staffId: 123,
      thumbnailId: 345,
      username: 'RCHARLES',
    } as PrisonApiUserDetail

    it('Get /api/users/me', async () => {
      fakeApi.get('/api/users/me').reply(200, stubbedPrisonUserData)
      const result = await userService.getPrisonUser('a token')
      expect(result.activeCaseLoadId).toEqual('MDI')
      expect(result.staffId).toEqual(123)
      expect(result.firstName).toEqual('Robert')
      expect(result.lastName).toEqual('Charles')
      expect(nock.isDone()).toBe(true)
    })

    const stubbedPrisonCaseloadData: PrisonApiCaseload[] = [
      {
        caseLoadId: 'MDI',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        description: 'Moorland (HMP)',
        type: 'INST',
      },
      {
        caseLoadId: 'LEI',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        description: 'Leeds (HMP)',
        type: 'INST',
      },
    ]

    it('Get /api/users/me/caseLoads', async () => {
      fakeApi.get('/api/users/me/caseLoads').reply(200, stubbedPrisonCaseloadData)
      const result = await userService.getPrisonUserCaseloads('a token')
      expect(result[0].caseLoadId).toContain('MDI')
      expect(result[1].caseLoadId).toContain('LEI')
      expect(nock.isDone()).toBe(true)
    })
  })
})
