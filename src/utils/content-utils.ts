import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import {
	getMicroCMSPosts,
	getMicroCMSCategories,
	getMicroCMSTags,
	convertMicroCMSPostToCollectionEntry,
	type MicroCMSPost,
	type MicroCMSCategory,
	type MicroCMSTag,
} from "@/lib/microcms";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	// Markdownの記事を取得
	const markdownPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	// microCMSの記事を取得
	const microCMSPosts = await getMicroCMSPosts();
	const convertedMicroCMSPosts = microCMSPosts
		.filter((post) => (import.meta.env.PROD ? !post.draft : true))
		.map(convertMicroCMSPostToCollectionEntry);

	// 両方の記事を結合
	const allBlogPosts = [...markdownPosts, ...convertedMicroCMSPosts];

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	// Markdownの記事からタグを取得
	const markdownPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	// microCMSの記事からタグを取得
	const microCMSPosts = await getMicroCMSPosts();
	const filteredMicroCMSPosts = microCMSPosts.filter((post) =>
		import.meta.env.PROD ? !post.draft : true,
	);

	// microCMSから直接タグ一覧も取得
	const microCMSTags = await getMicroCMSTags();

	const countMap: { [key: string]: number } = {};

	// Markdownの記事のタグをカウント
	markdownPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// microCMSの記事のタグをカウント
	filteredMicroCMSPosts.forEach((post: MicroCMSPost) => {
		post.tags?.forEach((tag: MicroCMSTag) => {
			if (!countMap[tag.name]) countMap[tag.name] = 0;
			countMap[tag.name]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	// Markdownの記事からカテゴリを取得
	const markdownPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	// microCMSの記事からカテゴリを取得
	const microCMSPosts = await getMicroCMSPosts();
	const filteredMicroCMSPosts = microCMSPosts.filter((post) =>
		import.meta.env.PROD ? !post.draft : true,
	);

	// microCMSから直接カテゴリ一覧も取得
	const microCMSCategories = await getMicroCMSCategories();

	const count: { [key: string]: number } = {};

	// Markdownの記事のカテゴリをカウント
	markdownPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	// microCMSの記事のカテゴリをカウント
	filteredMicroCMSPosts.forEach((post: MicroCMSPost) => {
		if (!post.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName = post.category.name.trim();
		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
