const feed = function(filter) {
  return {
    serialize: ({ query: { site, allMarkdownRemark } }) => {
      return allMarkdownRemark.edges.map(edge => {
        return Object.assign({}, edge.node.frontmatter, {
           description: edge.node.excerpt,
          date: edge.node.frontmatter.date,
          url: site.siteMetadata.siteUrl + edge.node.fields.slug,
          guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
          custom_elements: [
              { 'content:encoded': edge.node.html },
          ]
        });
      });
    },
    query: `
  {
    allMarkdownRemark(
      limit: 10,
      filter: {${filter ? filter : ''}},
      sort: {
        order: DESC, fields: frontmatter___date
      }
     ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            date
            title
            tags
          }
          excerpt
          html
        }
      }
    }
  }
  `,
    output: '/rss.xml',
    title: 'datakurre'
  };
};

module.exports = {
  siteMetadata: {
    title: 'datakurre',
    author: 'Asko Soukka',
    description: 'Plone, Python, Robot Framework',
    siteUrl: 'https://datakurre.pandala.org',
    social: {
      twitter: 'datakurre'
    }
  },
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/content/blog`,
        name: 'blog'
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/content/assets`,
        name: 'assets'
      }
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 590
            }
          },
          {
            resolve: 'gatsby-remark-responsive-iframe',
            options: {
              wrapperStyle: 'margin-bottom: 1.0725rem'
            }
          },
          {
            resolve: 'gatsby-remark-codemirror',
            options: {
              theme: 'solarized'
            }
          },
          'gatsby-remark-codemirror',
          'gatsby-remark-copy-linked-files',
          'gatsby-remark-smartypants'
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-feed',
      options: {
        feeds: [
          Object.assign({}, feed(), {}),
          Object.assign({}, feed('frontmatter: {tags: {in: ["plone"]}}'), {
            title: 'datakurre on "plone"',
            output: '/feeds/posts/default/-/plone'
          })
        ]
      }
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'datakurre',
        short_name: 'datakurre',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'content/assets/icon.png'
      }
    },
    //  'gatsby-plugin-offline',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-typography',
      options: {
        pathToConfigModule: 'src/utils/typography'
      }
    }
  ]
};
