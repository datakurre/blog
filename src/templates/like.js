import React from 'react';

class LikeTemplate extends React.Component {
  render() {
    const { href } = this.props.pageContext;
    return (
      <span className="h-entry">
        <a className="u-like-of" href={href}>
          {href}
        </a>
        <a className="u-bridgy-fed" href="https://fediverse.pandala.org/">
          {'https://fediverse.pandala.org/'}
        </a>
      </span>
    );
  }
}

export default LikeTemplate;

export const Head = () => (
  <>
    <meta name="robots" content="noindex,nofollow" />
  </>
);
