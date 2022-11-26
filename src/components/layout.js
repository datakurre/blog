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
              <span class="h-card">
                <a href="https://datakurre.pandala.org" rel="me">
                  Asko Soukka
                </a>
                <a
                  href="acct:datakurre@datakurre.pandala.org"
                  className="u-url u-uid"
                ></a>
                <img class="u-photo" src="http://iki.fi/asko.soukka/icon.jpg" />
                <p class="p-note">
                  Software architect at University of Jyväskylä
                </p>
              </span>
            </aside>
          </>
        ) : (
          <>
            <div className="h-entry">
              <header>{header}</header>
              <main>{children}</main>
              <a href="https://fed.brid.gy/"></a>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default Layout;
