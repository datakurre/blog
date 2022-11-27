import React from 'react';
import { Link } from 'gatsby';

import { rhythm, scale } from '../utils/typography';

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props;
    const rootPath = `${__PATH_PREFIX__}/`;
    let header;

    if (location.pathname === rootPath) {
      header = (
        <h1
          style={{
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0,
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h1>
      );
    } else {
      header = (
        <h3
          style={{
            fontFamily: `Montserrat, sans-serif`,
            marginTop: 0,
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h3>
      );
    }
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        {location.pathname === rootPath ? (
          <>
            <header>{header}</header>
            <main>{children}</main>
            <aside style={{ display: 'none' }}>
              <span className="h-card">
                <a rel="me" href="https://datakurre.pandala.org/" class="u-url">
                  Asko Soukka
                </a>
                <img
                  className="u-photo"
                  src="https://secure.gravatar.com/avatar/8970a4aa4836984ed5a32d9a82844791?s=512"
                />
                <a
                  className="u-url"
                  href="acct:datakurre@datakurre.pandala.org"
                ></a>
                <p className="p-note">
                  Software architect at University of Jyväskylä
                </p>
              </span>
            </aside>
          </>
        ) : (
          <>
            <header>{header}</header>
            <main>{children}</main>
          </>
        )}
      </div>
    );
  }
}

export default Layout;
