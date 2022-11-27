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
                <a
                  className="p-name u-url"
                  href="https://datakurre.pandala.org/"
                  rel="me"
                >
                  Asko Soukka
                </a>
                <a
                  className="u-email"
                  href="mailto:asko.soukka@iki.fi"
                  rel="me"
                />
                <img
                  className="u-featured"
                  alt=""
                  src="https://datakurre.pandala.org/header.png"
                />
                <img
                  className="u-photo"
                  alt=""
                  src="https://datakurre.pandala.org/icon.jpg"
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
