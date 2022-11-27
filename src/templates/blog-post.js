import React from 'react';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';
import Seo from '../components/seo';
import { rhythm, scale } from '../utils/typography';

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    const siteTitle = this.props.data.site.siteMetadata.title;
    const { previous, next } = this.props.pageContext;

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <Seo
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <h1
          style={{
            marginTop: rhythm(1),
            marginBottom: 0,
          }}
        >
          {post.frontmatter.title}
        </h1>
        <p
          style={{
            ...scale(-1 / 5),
            display: `block`,
            marginBottom: rhythm(1),
          }}
        >
          {post.frontmatter.date}
        </p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <hr
          style={{
            marginBottom: rhythm(1),
          }}
        />
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
        <aside style={{ display: 'none' }}>
          <div className="h-entry">
            <span className="p-name">{post.frontmatter.title}</span>
            <a className="p-author h-card" href="https://pandala.org/#datakurre">Asko Soukka</a>
            <span className="u-url">{"https://datakurre.pandala.org" + post.fields.slug}</span>
            <time className="dt-published" datetime={post.frontmatter.published}>{post.frontmatter.published}</time>
            <div className="p-summary" dangerouslySetInnerHTML={{
              __html: post.frontmatter.description || post.excerpt,
            }}/>
            <a href="https://fed.brid.gy/"></a>
          </div>
        </aside>
      </Layout>
    );
  }
}

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      fields { slug }
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        published: date(formatString: "YYYY-MM-DD hh:mm:ss")
      }
    }
  }
`;
