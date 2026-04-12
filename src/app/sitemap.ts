import type { MetadataRoute } from 'next'

import { getBlogList } from '@/lib/docsServiceClient'
import { PRODUCT_LIST } from '@/modules/products/registry'

const baseUrl = 'https://www.svc.plus'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getBlogList({ page: 1, pageSize: 500 })

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blogs`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/download`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    {
      url: `${baseUrl}/cloud_iac`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  const productEntries: MetadataRoute.Sitemap = PRODUCT_LIST.map((product) => ({
    url: `${baseUrl}/${product.slug}`,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticEntries, ...productEntries, ...blogEntries]
}
