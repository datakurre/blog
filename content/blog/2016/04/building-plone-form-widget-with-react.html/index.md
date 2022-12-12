---
title: Building Plone widget with React + Redux
date: "2016-04-11T06:00:00Z"
tags: ["Diazo", "Patternslib", "Plone", "React", "Redux", "Webpack"]
---

As much I love the new through-the-web resource registries in Plone 5 (I
really do), for the current Plone 5 sites in development or already in
production, [I\'ve ended up bundling all front-end resources into theme
with
Webpack.](http://datakurre.pandala.org/2016/02/building-plone-theme-with-webpack.html)
That gives me the same \"state of art\" frontend toolchain to other
current projects, but also adds some overhead, because I need to do
extra work for each new add-on with front-end resources. So, I still
cannot really recommend [Webpack](https://webpack.github.io) for Plone,
unless you are already familiar with Webpack. Yet, [learning to bundle
everything with Webpack](https://survivejs.com) really helps to
appreciate, how well Plone 5 resource registries already work.

My current workflow, in brief, is to add all common configration into
[plonetheme.webpack](https://github.com/datakurre/plonetheme.webpack)
and re-use that as a git submodule in individual projects, similarly to
[plonetheme.webpackexample](https://github.com/datakurre/plonetheme.webpackexample).
The latter also includes the example code for this post. I was asked,
how everything goes together when using React and Redux for building
widgets for Plone. Here\'s how\...

(You can see the complete example in
[plonetheme.webpackexample](https://github.com/datakurre/plonetheme.webpackexample),
particuarly in
[1](https://raw.githubusercontent.com/datakurre/plonetheme.webpackexample/master/resources/src/webpack/rules.xml)
and
[2](https://raw.githubusercontent.com/datakurre/plonetheme.webpackexample/master/resources/src/webpack/license-selector.jsx).)

Injecting a pattern with Diazo
------------------------------

In a usual use case, I have a custom content type (maybe TTW designed)
with simple textline or lines (textarea) fields, which require rich
JavaScript widgets to ease entering of valid input.

The current Plone convention for such widgets is to implement the widget
as a [Patternslib](http://patternslib.com) compatible pattern. The
required classname (and options) for the pattern initialization could,
of course, be injected by registering a custom z3c.form widget for the
field, but it can also be done with a relatively simple
[Diazo](http://diazo.org) rule with some XSLT:

```xml
<!-- Inject license selector pattern -->
<replace css:content="textarea#form-widgets-IDublinCore-rights">
  <xsl:copy>
    <xsl:attribute name="class">
      <xsl:value-of select="concat(@class, ' pat-license-selector')" />
    </xsl:attribute>
    <xsl:apply-templates select="@*[name()!='class']|node()" />
  </xsl:copy>
</replace>
```

Registering a pattern in ES6
----------------------------

Of course, you cannot yet use ES6 in Plone without figuring out a way to
way to transpile it into JavaScript currently supported by your target
browsers and RequireJS (that something, which comes quite easily with
Webpack). If you can do it, registering a Patternslib compatible pattern
in ES6 appeared to be really simple:

```jsx
import Registry from 'patternslib/core/registry';

// ... (imports for other requirements)

Registry.register({

  name: 'license-selector',
  trigger: '.pat-license-selector',

  init ($el, options) {
    // ... (pattern code)
  }
});
```

Choosing React + Redux for widgets
----------------------------------

You must have already heard about the greatest benefits in using
[React](https://facebook.github.io/react) as a view rendering library:
simple unidirectional data flow with stateless views and pretty fast
rendering with \"shadow DOM\" based optimization. While there are many
alternatives for React now, it probably has the best ecosystem, and
[React Lite](https://github.com/Lucifier129/react-lite)-like optimized
implementations, make it small enough to be embeddable anywhere.

[Redux](https://github.com/reactjs/redux), while technically independent
from React, helps to enforce the React ideals of predictable stateless
views in your React app. In my use case of building widgets for
individual input fields, it feels optimal because of its \"single data
store model\": It\'s simple to both serialize the widget value (Redux
store state) into a single input field and de-serialize it later from
the field for editing.

Single file React + Redux skeleton
----------------------------------

Even that Redux is very small library with simple conventions, it seems
to be hard to find an easy example for using it. That\'s because most of
the examples seem to assume that you are building a large scale app with
them. Yet, with a single widget, it would be nice to have all the
required parts close to each other in a single file.

As an example, I implemented a simple [Creative Commons license selector
widget](https://raw.githubusercontent.com/datakurre/plonetheme.webpackexample/master/resources/src/webpack/license-selector.jsx),
which includes all the required parts of React + Redux based widget in a
single file (including Patternslib initialization):

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, compose} from 'redux'
import Registry from 'patternslib/core/registry';

// ... (all the required imports)
// ... (all repeating marker values as constants)

function deserialize(value) {
  // ... (deserialize value from field into initial Redux store state)
}

function serialize(state) {
  // ... (serialize value Redux store state into input field value)
}

function reducer(state={}, action) {
  // ... ("reducer" to apply action to state and return new state)
}

export default class LicenseSelector extends React.Component {
  render() {
    // ...
  }
}

LicenseSelector.propTypes = {
  // ...
};

// ... (all the required React components with property annotations)

Registry.register({
  name: 'license-selector',
  trigger: '.pat-license-selector',

  init ($el) {
    // Get form input element and hide it
    const el = $el.hide().get(0)

    // Define Redux store and initialize it from the field value
    const store = createStore(reducer, deserialize($el.val()));

    // Create container for the widget
    const container = document.createElement('div');
    el.parentNode.insertBefore(container, el);
    container.className = 'license-selector';

    // Define main render
    function render() {
      // Serialize current widget value back into input field
      $el.val(serialize(store.getState()));

      // Render widget with current state
      ReactDOM.render((
        <LicenseSelector
          // Pass state
          {...store.getState()}
          // Pass Redux action factories
          setSharing={(value) => store.dispatch({
            type: SET_SHARING,
            value: value
          })}
          setCommercial={(value) => store.dispatch({
            type: SET_COMMERCIAL,
            value: value
          })}
          />
      ), container);
    }

    // Subscribe to render when state changes
    store.subscribe(render);

    // Call initial render
    render();
  }
});
```

Not too complex, after all\...

Implementing and injecting a display widget as a themefragment
--------------------------------------------------------------

Usually displaying value from a custom field requires more HTML that\'s
convenient to inline into Diazo rules, and may also require data, which
is not rendered by the default Dexterity views. My convention for
implementing these \"display widgets\" in theme is the following
combination of theme fragments and Diazo rules.

At first, I define a theme fragment. Theme fragments are simple TAL
templates saved in `./fragments` folder inside a theme, and are
supported by installing
[collective.themefragments](https://pypi.python.org/pypi/collective.themefragments)
add-on. My example theme has the following fragment at
`./fragments/license.pt`:

```html
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:tal="http://xml.zope.org/namespaces/tal">
<body>
<p tal:condition="context/rights|undefined">
  <img src="https://i.creativecommons.org/l/${context/rights}/4.0/88x31.png"
       alt="${context/rights}" />
</p>
</body>
</html>
```

Finally, the fragment is injected into desired place using Diazo. In my
example, I use Diazo inline XSLT to append the fragment into below
content viewlets\' container:

```xml
<!-- Inject license badge below content body -->
<replace css:content="#viewlet-below-content-body"
         css:if-not-content="textarea#form-widgets-IDublinCore-rights">
  <xsl:copy>
    <xsl:apply-templates select="@*|node()" />
    <xsl:copy-of select="document('@@theme-fragment/license',
                         $diazo-base-document)/html/body/*" />
  </xsl:copy>
</replace>
```
