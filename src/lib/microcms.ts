import { createClient } from 'microcms-js-sdk';

// microCMSクライアントの設定
export const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// microCMSのブログ記事の型定義
export interface MicroCMSPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  content: string;
  description?: string;
  image?: {
    url: string;
    height: number;
    width: number;
  };
  tags?: MicroCMSTag[];
  category?: MicroCMSCategory;
  draft?: boolean;
  slug?: string;
}

// microCMSのカテゴリの型定義
export interface MicroCMSCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
  slug?: string;
}

// microCMSのタグの型定義
export interface MicroCMSTag {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
  slug?: string;
}

// microCMSからブログ記事を取得
export async function getMicroCMSPosts() {
  try {
    const response = await client.get({
      endpoint: 'posts',
      queries: {
        limit: 100,
        orders: '-publishedAt',
      },
    });
    return response.contents as MicroCMSPost[];
  } catch (error) {
    console.error('Failed to fetch posts from microCMS:', error);
    return [];
  }
}

// microCMSから単一のブログ記事を取得
export async function getMicroCMSPost(id: string) {
  try {
    const post = await client.get({
      endpoint: 'posts',
      contentId: id,
    });
    return post as MicroCMSPost;
  } catch (error) {
    console.error(`Failed to fetch post ${id} from microCMS:`, error);
    return null;
  }
}

// microCMSからカテゴリを取得
export async function getMicroCMSCategories() {
  try {
    const response = await client.get({
      endpoint: 'categories',
      queries: {
        limit: 100,
        orders: 'name',
      },
    });
    return response.contents as MicroCMSCategory[];
  } catch (error) {
    console.error('Failed to fetch categories from microCMS:', error);
    return [];
  }
}

// microCMSからタグを取得
export async function getMicroCMSTags() {
  try {
    const response = await client.get({
      endpoint: 'tags',
      queries: {
        limit: 100,
        orders: 'name',
      },
    });
    return response.contents as MicroCMSTag[];
  } catch (error) {
    console.error('Failed to fetch tags from microCMS:', error);
    return [];
  }
}

// microCMSの記事をAstroのCollectionEntry形式に変換
export function convertMicroCMSPostToCollectionEntry(post: MicroCMSPost) {
  return {
    id: `microcms-${post.id}`,
    slug: post.slug,
    body: post.content,
    collection: 'posts' as const,
    data: {
      title: post.title,
      published: new Date(post.publishedAt),
      updated: new Date(post.updatedAt),
      description: post.description || '',
      image: post.image?.url || '',
      tags: post.tags?.map(tag => tag.name) || [],
      category: post.category?.name || null,
      draft: post.draft,
      lang: '',
      prevTitle: '',
      prevSlug: '',
      nextTitle: '',
      nextSlug: '',
    },
  };
}