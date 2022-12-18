import React from 'react';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';
import { rhythm, scale } from '../utils/typography';
import Meta from '../components/meta';

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    const siteTitle = this.props.data.site.siteMetadata.title;
    const { previous, next } = this.props.pageContext;

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <h1
          style={{
            marginTop: rhythm(1),
            marginBottom: 0,
          }}
        >
          {post.frontmatter.title}
        </h1>
        <span className="p-name" style={{ display: 'none' }}>
          {post.frontmatter.title}
        </span>
        <img className="u-photo" src={`/cover${post.fields.slug.replaceAll("/", "-")}.png`} alt="" />
        <a
          className="p-author h-card"
          href="https://pandala.org/#datakurre"
          style={{ display: 'none' }}
        >
          <img className="u-photo" src="/icon.jpg" alt="" />
          Asko Soukka
        </a>
        <div className="p-summary" style={{ display: 'none' }}>
          <div
            dangerouslySetInnerHTML={{
              __html: post.frontmatter.description || post.excerpt,
            }}
          />
        </div>
        {post.frontmatter.tags.map((tag) => (
          <a
            className="p-category"
            href={'https://datakurre.pandala.org' + post.fields.slug}
            style={{ display: 'none' }}
          >
            {tag}
          </a>
        ))}
        <a
          className="u-syndication"
          href="https://fed.brid.gy/"
          style={{ display: 'none' }}
        >
          https://fed.brid.gy/
        </a>
        <a
          className="u-syndication"
          href="https://fediverse.pandala.org/"
          style={{ display: 'none' }}
        >
          https://fediverse.pandala.org/
        </a>
        <a
          className="u-url u-uid"
          style={{
            ...scale(-1 / 5),
            display: `block`,
            color: `black`,
            boxShadow: `none`,
            marginBottom: rhythm(1),
          }}
          href={'https://datakurre.pandala.org' + post.fields.slug}
        >
          <time className="dt-published" datetime={post.frontmatter.published}>
            {post.frontmatter.date}
          </time>
        </a>
        <div className="e-content">
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
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
      </Layout>
    );
  }
}

export default BlogPostTemplate;

export const Head = ({ data }) => (
  <Meta
    title={data.markdownRemark.frontmatter.title}
    description={
      data.markdownRemark.frontmatter.description || data.markdownRemark.excerpt
    }
    slug={data.markdownRemark.fields.slug}
    children={
        <meta name="og:image" href={`/cover${data.markdownRemark.fields.slug.replaceAll("/", "-")}.png`} />
    }
  />
);

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
      fields {
        slug
      }
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        tags
        date(formatString: "MMMM DD, YYYY")
        published: date(formatString: "YYYY-MM-DD hh:mm:ss")
      }
    }
  }
`;
