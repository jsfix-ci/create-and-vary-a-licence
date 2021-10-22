import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import type {
  PrisonApiCaseload,
  PrisonApiPrisoner,
  PrisonApiUserDetail,
  PrisonInformation,
} from '../@types/prisonApiClientTypes'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getPrisonerImage(nomsId: string): Promise<Readable> {
    return this.restClient.stream({
      path: `/api/bookings/offenderNo/${nomsId}/image/data`,
    }) as Promise<Readable>
  }

  async getPrisonerDetail(nomsId: string): Promise<PrisonApiPrisoner> {
    return this.restClient.get({ path: `/api/offenders/${nomsId}` }) as Promise<PrisonApiPrisoner>
  }

  async getPrisonInformation(prisonId: string): Promise<PrisonInformation> {
    return this.restClient.get({ path: `/api/agencies/prison/${prisonId}` }) as Promise<PrisonInformation>
  }

  // Uses the USER token, not the ADMIN token
  async getUser(userToken: string): Promise<PrisonApiUserDetail> {
    return this.restClient.getWithUserToken({
      userToken,
      path: '/api/users/me',
    }) as Promise<PrisonApiUserDetail>
  }

  // Uses the USER token, not th ADMIN token
  async getUserCaseloads(userToken: string): Promise<PrisonApiCaseload[]> {
    return this.restClient.getWithUserToken({
      userToken,
      path: '/api/users/me/caseLoads',
    }) as Promise<PrisonApiCaseload[]>
  }
}
