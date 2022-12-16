import React from 'react';

class FollowTemplate extends React.Component {
  render() {
    const { href, username } = this.props.pageContext;
    return (
      <span className="h-entry">
        I'm following{' '}
        <a className="u-follow-of" href={href}>
          {username}
        </a>
        .
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label */}
        <a className="u-bridgy-fed" href="https://fediverse.pandala.org/" />
      </span>
    );
  }
}

export default FollowTemplate;

export const Head = () => (
  <>
    <meta name="robots" content="noindex,nofollow" />
  </>
);
