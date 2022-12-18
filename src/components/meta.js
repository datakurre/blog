import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

function Meta({ title, description, slug, children }) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;

  return (
    <>
      <title>{`${title} | ${site.siteMetadata.title}`}</title>
      {!!slug ? (
        <link rel="canonical" href={`https://datakurre.pandala.org${slug}`} />
      ) : null}
      <meta name="author" content="Asko Soukka" />
      <meta name="description" content={metaDescription} />
      <meta name="og:type" content="website" />
      <meta name="og:title" content={title} />
      <meta name="og:description" content={metaDescription} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={site.siteMetadata.author} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {children}
    </>
  );
}

export default Meta;
