import { sanitize } from "dompurify";
import marked from "marked";
import storage from "../utils/storage";
import { isUserAuthenticated, authenticateUserWithAction } from "./auth";

export const getUserData = async (token, tokenType = "bearer") => {
  const endpoint = "https://oauth.reddit.com/api/v1/me?raw_json=1";
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `${tokenType} ${token}`,
    },
  });
  return response.json();
};

const getSavedPosts = async ({
  user,
  limit = 100,
  before = null,
  after = null,
  count = 0,
}) => {
  const { accessToken, tokenType, username } = user;
  let endpoint = `https://oauth.reddit.com/user/${username}/saved?limit=${limit}`;
  if (before) {
    endpoint += `&before=${before}`;
  }
  if (after) {
    endpoint += `&after=${after}`;
  }
  if (count) {
    endpoint += `&count=${count}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
    },
  });
  return response.json();
};

export const getAllPosts = async (user) => {
  if (!isUserAuthenticated(user)) {
    storage.clearPosts();
    storage.clearUser();
    return authenticateUserWithAction("getAllPosts");
  }

  const savedPosts = [];
  let afterPostId = null;

  do {
    const response = await getSavedPosts({
      user,
      after: afterPostId,
      count: savedPosts.length,
    });
    const posts = parseSavedPosts(response.data.children);
    savedPosts.push(...posts);
    afterPostId = response.data.after;
  } while (afterPostId);

  return savedPosts;
};

export const getNewPosts = async (user) => {
  if (!isUserAuthenticated(user)) {
    storage.clearUser();
    return authenticateUserWithAction("getNewPosts");
  }

  let allPosts = storage.loadPosts();
  let beforePostId = allPosts[0].id;
  let postDist;

  do {
    const response = await getSavedPosts({ user, before: beforePostId });
    const newPosts = parseSavedPosts(response.data.children);
    allPosts = newPosts.concat(allPosts);
    beforePostId = allPosts[0].id;
    postDist = response.dist;
  } while (postDist >= 100);

  return allPosts;
};

const parseSavedPosts = (posts) => {
  // Override default parser output
  const renderer = {
    code(code) {
      return `<pre><code>${code}</code></pre>`;
    },
    codespan(code) {
      const codeStr = code.replace(/&amp;/g, "&");
      return `<code>${codeStr}</code>`;
    },
  };
  marked.use({ renderer });

  return posts.map((post) => {
    const type = post.kind === "t1" ? "comment" : "link";
    const title = type === "link" ? post.data.title : post.data.link_title;
    const content =
      type === "comment" && typeof post.data.body !== "undefined"
        ? post.data.body
        : type === "link" && typeof post.data.selftext !== "undefined"
        ? post.data.selftext
        : null;

    return {
      type,
      title: sanitize(marked.parseInline(title), {
        USE_PROFILES: { html: true },
      }),
      content: sanitize(marked(content), { USE_PROFILES: { html: true } }),
      id: post.data.name,
      subreddit: post.data.subreddit,
      permalink: post.data.permalink,
      url: type === "link" ? post.data.url : null,
      thumbnail: type === "link" ? post.data.thumbnail : null,
    };
  });
};
