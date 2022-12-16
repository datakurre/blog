import React from 'react';

class LikeTemplate extends React.Component {
  render() {
    const { href } = this.props.pageContext;
    return (
      <span className="h-entry">
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label */}
        <a className="u-like-of" href={href} />
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label */}
        <a className="u-bridgy-fed" href="https://fediverse.pandala.org/" />
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
