const crypto = require('crypto');
const fs = require(`fs`);
const path = require(`path`);
const urlStatusCode = require('url-status-code');
const yaml = require(`js-yaml`);
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const wordcloud = require('node-wordcloud');
const { createCanvas } = require('canvas');
const {
  createFilePath,
  createFileNodeFromBuffer,
} = require(`gatsby-source-filesystem`);

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

exports.onCreateNode = ({ node, actions, createNodeId, getNode, getCache }) => {
  const { createNode, createNodeField } = actions;
  if (node.internal.type === `MarkdownRemark`) {
    // slug
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });

    // og:image
    const path = `static/cover${value.substring(0, value.length -1).replaceAll("/", "-")}.png`;
    if (!fs.existsSync(path)) {

    const text = node.rawMarkdownBody;
    const tokens = tokenizer
      .tokenize(text.toLowerCase())
      .filter(
        (token) =>
          ['http', 'https'].indexOf(token) === -1 &&
          (token.length > 4 ||
            (token.length > 2 && text.indexOf(token.toUpperCase()) > 0))
      );
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens);
    const list = tfidf
      .listTerms(0)
      .map((item) => [item.term, Math.ceil(item.tfidf * 10)]);
    const cloud = wordcloud(createCanvas);
    const palette = [
      '#e0e1dd',
      '#778da9',
      '#778da9',
      '#415a77',
      '#415a77',
      '#1b263b',
      '#1b263b',
      '#0d1b2a',
    ];
    const options = {
      gridSize: 8,
      rotateRatio: 1,
      rotationSteps: 7,
      rotationRange: [-90, 90],
      backgroundColor: '#FFFFFF',
      sizeRange: [8, 100],
      color: function (word, weight) {
        return weight <= 24
          ? palette[Math.floor(Math.random() * palette.length)]
          : palette[Math.max(1, Math.floor(Math.random() * palette.length))];
      },
      fontWeight: 'bold',
      fontFamily: `"Montserrat", "sans-serif"`,
      shape: function shapeSquare(theta) {
        return Math.min(
          1.9 / Math.abs(Math.cos(theta)),
          1 / Math.abs(Math.sin(theta))
        );
      },
    };
    const canvas = createCanvas(1200 * 0.5, 630 * 0.5);
    cloud(canvas, { list, ...options }).draw();
        fs.writeFileSync(path, canvas.toBuffer());
    }
  }
};

exports.setFieldsOnGraphQLNodeType = require(`./extend-file-node`)
