import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, toQuery } from './api'

const mockFetch = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status })))

afterEach(() => vi.unstubAllGlobals())

describe('toQuery', () => {
  it('omits empty, null and undefined values', () => {
    expect(toQuery({ q: '', country: null, department: undefined, page: 2, sort: 'salary' })).toBe('?page=2&sort=salary')
  })

  it('returns an empty string when nothing is set', () => {
    expect(toQuery({ country: null })).toBe('')
  })

  it('encodes values', () => {
    expect(toQuery({ country: 'United States' })).toBe('?country=United+States')
  })
})

describe('api', () => {
  it('requests a breakdown with the group and filters in the URL', async () => {
    mockFetch(200, [])
    await api.breakdown('job_title', { country: 'India' })

    expect(fetch).toHaveBeenCalledWith('/api/insights/breakdown?group_by=job_title&country=India', expect.anything())
  })

  it('wraps the employee in a JSON body when creating', async () => {
    mockFetch(201, { id: 1 })
    await api.createEmployee({ first_name: 'Ada' } as never)

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ employee: { first_name: 'Ada' } })
  })

  it('resolves to undefined for 204 No Content', async () => {
    mockFetch(204, null)
    await expect(api.deleteEmployee(1)).resolves.toBeUndefined()
  })

  it('throws ApiError carrying field errors on 422', async () => {
    mockFetch(422, { errors: { email: ['Email has already been taken'] } })

    const error = await api.createEmployee({} as never).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toEqual({ email: ['Email has already been taken'] })
  })

  it('uses the server error message when present', async () => {
    mockFetch(404, { error: 'Not found' })
    await expect(api.updateEmployee(9, {} as never)).rejects.toThrow('Not found')
  })
})
