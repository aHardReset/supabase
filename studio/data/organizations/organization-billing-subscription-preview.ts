import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationBillingSubscriptionPreviewVariables = {
  organizationSlug?: string
  tier?: string
}

export type OrganizationBillingSubscriptionPreviewResponse = {
  breakdown: {
    description: string
    unit_price: number
    quantity: number
    total_price: number
  }[]
}

export async function previewOrganizationBillingSubscription(
  { organizationSlug, tier }: OrganizationBillingSubscriptionPreviewVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string } = {
    tier,
  }

  const response = await post(
    `${API_URL}/organizations/${organizationSlug}/billing/subscription/preview`,
    payload,
    { signal }
  )

  if (response.error) throw response.error

  return response as OrganizationBillingSubscriptionPreviewResponse
}

export type OrganizationBillingSubscriptionPreviewData = Awaited<
  ReturnType<typeof previewOrganizationBillingSubscription>
>
export type OrganizationBillingSubscriptionPreviewError = {
  message: string
}

export const useOrganizationBillingSubscriptionPreview = <
  TData = OrganizationBillingSubscriptionPreviewData
>(
  { organizationSlug, tier }: OrganizationBillingSubscriptionPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    OrganizationBillingSubscriptionPreviewData,
    OrganizationBillingSubscriptionPreviewError,
    TData
  > = {}
) =>
  useQuery<
    OrganizationBillingSubscriptionPreviewData,
    OrganizationBillingSubscriptionPreviewError,
    TData
  >(
    organizationKeys.subscriptionPreview(organizationSlug, tier),
    ({ signal }) => previewOrganizationBillingSubscription({ organizationSlug, tier }, signal),
    {
      enabled: enabled && typeof organizationSlug !== 'undefined' && typeof tier !== 'undefined',
      ...options,

      retry: (failureCount, error) => {
        // Don't retry on 400s
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as any).code === 400
        ) {
          return false
        }

        if (failureCount < 3) {
          return true
        }

        return false
      },
    }
  )
