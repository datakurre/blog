import React from 'react';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';
import Seo from '../components/seo';
import { rhythm } from '../utils/typography';

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props;
    const siteTitle = data.site.siteMetadata.title;

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <Seo title="Follows" />
        <ul>
          <li id="noordsestern" className="h-entry">
            <a class="u-follow-of" href="https://fosstodon.org/@noordsestern">
              @noordsestern@fosstodon.org
            </a>
            <a href="https://fed.brid.gy/"></a>
          </li>
          <li id="nlea" className="h-entry">
            <a class="u-follow-of" href="https://social.anoxinon.de/@nlea">
              @nlea@social.anoxinon.de
            </a>
            <a href="https://fed.brid.gy/"></a>
          </li>
        </ul>
      </Layout>
    );
  }
}

export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
