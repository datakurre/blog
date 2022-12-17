const crypto = require('crypto');
const fs = require(`fs`);
const path = require(`path`);
const urlStatusCode = require('url-status-code');
const yaml = require(`js-yaml`);
const { createFilePath } = require(`gatsby-source-filesystem`);

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const blogPost = path.resolve(`./src/templates/blog-post.js`);
  const result = await graphql(
    `
      {
        allMarkdownRemark(sort: { frontmatter: { date: DESC } }, limit: 1000) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    throw result.errors;
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges;

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node;
    const next = index === 0 ? null : posts[index - 1].node;

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    });
  });

  const fediverse = yaml.load(
    fs.readFileSync('./content/fediverse.yaml', 'utf-8')
  );
  const federated = [];
  fediverse.follows.forEach((url) => {
    const { host, pathname } = new URL(url);
    const username = `${pathname.substring(1)}@${host}`;
    const path = `/fediverse/follows/${username}`;
    createPage({
      path: path,
      component: require.resolve('./src/templates/follow.js'),
      context: {
        href: url,
        username: username,
      },
    });
    federated.push(path);
  });
  fediverse.likes.forEach((href) => {
    const path = `/fediverse/likes/${crypto
      .createHash('md5')
      .update(href)
      .digest('hex')}`;
    createPage({
      path,
      component: require.resolve('./src/templates/like.js'),
      context: {
        href,
      },
    });
    federated.push(path);
  });
  Promise.all(
    federated.map(
      (path) =>
        new Promise((resolve, reject) =>
          urlStatusCode(
            `https://datakurre.pandala.org${path}`,
            (error, statusCode) =>
              error ? reject(error) : resolve([path, statusCode])
          )
        )
    )
  ).then((pairs) => {
    const cmds = pairs.map(([path, statusCode]) =>
      statusCode !== 404
        ? ''
        : `curl -i -d source=http://datakurre.pandala.org${path} -d target=https://fediverse.pandala.org https://fediverse.pandala.org/webmention\n`
    );
    fs.writeFileSync('webmentions.sh', cmds.join(''));
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};
