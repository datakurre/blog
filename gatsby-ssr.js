const React = require('react');

exports.onRenderBody = ({
  pathname,
  setHtmlAttributes,
  setPostBodyComponents,
}) => {
  setHtmlAttributes({ lang: 'en' });
  if (pathname === '/') {
    setPostBodyComponents([
      // eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label
      <a
        href="https://fosstodon.org/@datakurre@pandala.org"
        rel="me"
        style={{ display: 'none' }}
      />,
      // eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label
      <a
        href="https://mas.to/@datakurre@pandala.org"
        rel="me"
        style={{ display: 'none' }}
      />,
      // eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label
      <a
        href="https://mastodon.online/@datakurre@pandala.org"
        rel="me"
        style={{ display: 'none' }}
      />,
      // eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/control-has-associated-label
      <a
        href="https://social.anoxinon.de/@datakurre@pandala.org"
        rel="me"
        style={{ display: 'none' }}
      />,
    ]);
  }
};
